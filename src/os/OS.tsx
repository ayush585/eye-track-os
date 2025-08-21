// src/pages/OS.tsx
import { useRef, useState } from "react";
import { useCamera } from "./hooks/useCamera";
import { useGaze } from "./hooks/useGaze";
import GazeDot from "./components/GazeDot";
import CalibrationModal from "./components/CalibrationModal";
import { DwellEngine } from "./lib/dwell";

export default function OS() {
    const { videoRef, ready, error } = useCamera();
    const videoEl = videoRef.current;
    const { loading, gaze, calibrate } = useGaze(videoEl as HTMLVideoElement | null);
    const [calibrating, setCalibrating] = useState(true);
    const [toast, setToast] = useState<string | null>(null);

    const dwell = useRef(new DwellEngine(700, 30)).current;
    if (gaze) dwell.update(gaze.x, gaze.y);
    dwell.onTrigger(({ x, y }) => {
        setToast(`Dwell click at (${Math.round(x)}, ${Math.round(y)})`);
        setTimeout(() => setToast(null), 1200);
    });

    return (
        <div className="h-screen w-screen bg-neutral-950 text-white">
            <div className="absolute left-4 top-4 text-sm opacity-70">
                {error && <div className="text-red-400">Camera: {error}</div>}
                {!ready && !error && <div>Requesting camera…</div>}
                {loading && <div>Loading model… (put face_landmarker.task in /public/models)</div>}
            </div>

            <video ref={videoRef} className="fixed left-2 bottom-2 w-56 opacity-20 rounded-md" muted playsInline />

            {gaze && <GazeDot x={gaze.x} y={gaze.y} />}

            {calibrating && (
                <CalibrationModal
                    getRawPoint={() => {
                        if (!gaze) return null;
                        return { x: gaze.x / window.innerWidth, y: gaze.y / window.innerHeight };
                    }}
                    onDone={(samples) => {
                        calibrate(samples);
                        setCalibrating(false);
                    }}
                />
            )}

            <div className="absolute top-4 right-4 flex gap-2">
                <button
                    onClick={() => setCalibrating(true)}
                    className="rounded bg-white/10 border border-white/20 px-3 py-1 text-sm hover:bg-white/15"
                >
                    Recalibrate
                </button>
            </div>

            {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded bg-white/10 border border-white/20 px-3 py-1 text-sm">{toast}</div>}
        </div>
    );
}
