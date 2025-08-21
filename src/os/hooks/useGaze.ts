import { useEffect, useMemo, useRef, useState } from "react";
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";
import { EMA, SimpleKalman1D, VelocityEMA, SaccadeGuard, Pt } from "../lib/filters";

type MapMatrix = { ax: number; bx: number; cx: number; ay: number; by: number; cy: number } | null;

/** tiny helper: average selected landmark indices */
function avg(pts: any[], ids: number[]) {
    let x = 0,
        y = 0;
    for (const i of ids) {
        x += pts[i].x;
        y += pts[i].y;
    }
    const n = ids.length;
    return { x: x / n, y: y / n };
}

/** least-squares affine fit: x' = ax*x + bx*y + cx ; y' = ay*x + by*y + cy */
function fitAffine(src: Pt[], dst: Pt[]): Exclude<MapMatrix, null> {
    const n = src.length;
    if (n < 3) throw new Error("Need at least 3 points for affine fit");
    let Sxx = 0,
        Sxy = 0,
        Sx = 0,
        Syy = 0,
        Sy = 0,
        N = n;
    let Cx = 0,
        Cy = 0,
        Cxyx = 0,
        Cxyy = 0,
        Sux = 0,
        Suy = 0;
    for (let i = 0; i < n; i++) {
        const { x, y } = src[i];
        const { x: ux, y: uy } = dst[i];
        Sxx += x * x;
        Sxy += x * y;
        Sx += x;
        Syy += y * y;
        Sy += y;
        Cx += x * ux;
        Cy += x * uy;
        Cxyx += y * ux;
        Cxyy += y * uy;
        Sux += ux;
        Suy += uy;
    }
    const det = Sxx * (Syy * N - Sy * Sy) - Sxy * (Sxy * N - Sy * Sx) + Sx * (Sxy * Sy - Syy * Sx) + 1e-10; // Small regularization
    const i00 = (Syy * N - Sy * Sy) / det,
        i01 = (Sx * Sy - Sxy * N) / det,
        i02 = (Sxy * Sy - Syy * Sx) / det;
    const i10 = (Sy * Sx - Sxy * N) / det,
        i11 = (Sxx * N - Sx * Sx) / det,
        i12 = (Sxy * Sx - Sxx * Sy) / det;
    const i20 = (Sxy * Sy - Syy * Sx) / det,
        i21 = (Sxy * Sx - Sxx * Sy) / det,
        i22 = (Sxx * Syy - Sxy * Sxy) / det;

    const ax = i00 * Cx + i01 * Cxyx + i02 * Sux;
    const bx = i10 * Cx + i11 * Cxyx + i12 * Sux;
    const cx = i20 * Cx + i21 * Cxyx + i22 * Sux;

    const ay = i00 * Cy + i01 * Cxyy + i02 * Suy;
    const by = i10 * Cy + i11 * Cxyy + i12 * Suy;
    const cy = i20 * Cy + i21 * Cxyy + i22 * Suy;

    return { ax, bx, cx, ay, by, cy };
}

export function useGaze(video: HTMLVideoElement | null) {
    const [loading, setLoading] = useState(true);
    const [gaze, setGaze] = useState<Pt | null>(null);
    const [matrix, setMatrix] = useState<MapMatrix>(null);

    // Filters: pre-calibration for accuracy, post-calibration for smoothness
    const ema = useRef(new EMA(0.2)).current; // Smooth normalized coords
    const kx = useRef(new SimpleKalman1D()).current;
    const ky = useRef(new SimpleKalman1D()).current;
    const velocityEma = useMemo(() => new VelocityEMA(0.1, 0.7, 0.03, 0.5), []);
    const guard = useMemo(() => new SaccadeGuard(120, 90), []);

    const landmarkerRef = useRef<FaceLandmarker | null>(null);
    const raf = useRef<number | null>(null);

    // Load model
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const resolver = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );
            const landmarker = await FaceLandmarker.createFromOptions(resolver, {
                baseOptions: { modelAssetPath: "/models/face_landmarker.task" },
                runningMode: "VIDEO",
                numFaces: 1,
            });
            if (!cancelled) {
                landmarkerRef.current = landmarker;
                setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
            if (raf.current) cancelAnimationFrame(raf.current);
        };
    }, []);

    // Tracking loop
    useEffect(() => {
        if (!video || !landmarkerRef.current) return;

        let running = true;
        const step = () => {
            if (!running) return;
            if (video.readyState < 2) {
                raf.current = requestAnimationFrame(step);
                return;
            }

            const t = performance.now();
            const lm = landmarkerRef.current!.detectForVideo(video, t);
            const pts = lm.faceLandmarks?.[0];

            if (pts?.length) {
                // Iris centers (MediaPipe iris ring ~468-476)
                const L = avg(pts, [468, 469, 470, 471]);
                const R = avg(pts, [473, 474, 475, 476]);
                const nx = (L.x + R.x) * 0.5;
                const ny = (L.y + R.y) * 0.5;

                // Pre-calibration smoothing
                const smoothed = ema.next(nx, ny);
                const sx = kx.next(smoothed.x);
                const sy = ky.next(smoothed.y);

                // Map to pixels
                let rawPx: Pt;
                if (matrix) {
                    const gx = matrix.ax * sx + matrix.bx * sy + matrix.cx;
                    const gy = matrix.ay * sx + matrix.by * sy + matrix.cy;
                    rawPx = { x: gx, y: gy };
                } else {
                    // Adjust for video aspect ratio
                    const videoAspect = video.videoWidth / video.videoHeight;
                    const screenAspect = window.innerWidth / window.innerHeight;
                    const scaleX = videoAspect > screenAspect ? window.innerWidth : window.innerHeight * videoAspect;
                    const scaleY = videoAspect > screenAspect ? window.innerWidth / videoAspect : window.innerHeight;
                    rawPx = { x: sx * scaleX, y: sy * scaleY };
                }

                // Post-calibration filtering
                const gated = guard.accept(rawPx, t);
                if (gated) {
                    const sm = velocityEma.update(gated, t);
                    setGaze(sm);
                } else {
                    setGaze(null);
                }
            } else {
                setGaze(null);
            }

            raf.current = requestAnimationFrame(step);
        };

        raf.current = requestAnimationFrame(step);
        return () => {
            running = false;
            if (raf.current) cancelAnimationFrame(raf.current);
        };
    }, [video, matrix, ema, kx, ky, velocityEma, guard]);

    function calibrate(samples: { raw: Pt; screen: Pt }[]) {
        if (samples.length < 4) return null; // Require at least 4 points
        try {
            const src = samples.map((s) => s.raw);
            const dst = samples.map((s) => s.screen);
            const M = fitAffine(src, dst);
            setMatrix(M);
            return M;
        } catch (e) {
            console.error("Calibration failed:", e);
            return null;
        }
    }

    return { loading, gaze, calibrate };
}