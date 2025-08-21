// src/os/lib/dwell.ts

export type DwellEvent = { x: number; y: number };
type cb = (e: DwellEvent) => void;

/**
 * Dwell engine with velocity gate + debounce:
 * - Only starts counting when velocity is low enough for `armMs`
 * - Fires once per dwell window
 */
export class DwellEngine {
    private last?: { x: number; y: number; t: number };
    private armedSince = 0;
    private firedAt = 0;
    private onFire: cb | null = null;

    constructor(
        private dwellMs = 700,   // dwell duration
        private vThresh = 0.30,  // px/ms; tune for your setup
        private armMs = 250,     // must be slow for at least this long
        private refractoryMs = 600 // cooldown after a fire
    ) { }

    onTrigger(fn: cb) { this.onFire = fn; }

    update(x: number, y: number, t = performance.now()) {
        if (!this.last) { this.last = { x, y, t }; this.armedSince = 0; return; }

        const dt = Math.max(1, t - this.last.t);
        const v = Math.hypot(x - this.last.x, y - this.last.y) / dt;

        // Gate by velocity
        if (v < this.vThresh) {
            if (this.armedSince === 0) this.armedSince = t;
            // Armed long enough? then count dwell time
            const dwellElapsed = t - this.armedSince;
            if (dwellElapsed >= this.dwellMs && t - this.firedAt > this.refractoryMs) {
                this.firedAt = t;
                this.armedSince = 0; // reset
                this.onFire?.({ x, y });
            }
        } else {
            // moving too fast; reset arm
            this.armedSince = 0;
        }

        this.last = { x, y, t };
    }
}
