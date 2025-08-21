// src/os/components/GazeDot.tsx
export default function GazeDot({ x, y }: { x: number; y: number }) {
    return (
        <div
            style={{ transform: `translate(${x - 8}px, ${y - 8}px)` }}
            className="pointer-events-none fixed z-[50] h-4 w-4 rounded-full"
        >
            <div className="h-full w-full rounded-full bg-cyan-400 shadow-[0_0_20px_6px_rgba(34,211,238,0.35)]" />
        </div>
    );
}
