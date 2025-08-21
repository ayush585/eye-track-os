// src/os/components/CalibrationModal.tsx
import { useEffect, useState } from "react";

type Point = { x: number; y: number };
export default function CalibrationModal({
    onDone,
    getRawPoint
}: {
    onDone: (samples: { raw: Point; screen: Point }[]) => void;
    getRawPoint: () => Point | null;
}) {
    const targets: Point[] = [
        { x: 0.1, y: 0.1 },
        { x: 0.9, y: 0.1 },
        { x: 0.5, y: 0.5 },
        { x: 0.1, y: 0.9 },
        { x: 0.9, y: 0.9 }
    ];
    const [i, setI] = useState(0);
    const [samples, setSamples] = useState<{ raw: Point; screen: Point }[]>([]);

    useEffect(() => {
        const t = setTimeout(() => {
            const raw = getRawPoint();
            const screen = { x: targets[i].x * window.innerWidth, y: targets[i].y * window.innerHeight };
            if (raw) setSamples(s => [...s, { raw, screen }]);
            if (i < targets.length - 1) setI(i + 1); else onDone(samples.concat(raw ? [{ raw, screen }] : []));
        }, 1200);
        return () => clearTimeout(t);
    }, [i]);

    const dot = { left: `${targets[i].x * 100}%`, top: `${targets[i].y * 100}%`, transform: "translate(-50%,-50%)" };

    return (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70">
            <div className="absolute inset-0">
                <div className="absolute h-6 w-6 rounded-full bg-white" style={dot}></div>
            </div>
            <div className="px-4 py-2 rounded bg-white/10 border border-white/20 text-white">
                Look at each dot for a second… ({i + 1}/{targets.length})
            </div>
        </div>
    );
}
