export type Pt = { x: number; y: number };
const now = () => performance.now();

export class EMA {
    private alpha: number;
    private last: Pt | null = null;

    constructor(alpha: number) {
        this.alpha = alpha;
    }

    next(x: number, y: number): Pt {
        if (!this.last) {
            this.last = { x, y };
            return { x, y };
        }
        const newX = this.alpha * x + (1 - this.alpha) * this.last.x;
        const newY = this.alpha * y + (1 - this.alpha) * this.last.y;
        this.last = { x: newX, y: newY };
        return { x: newX, y: newY };
    }
}

export class SimpleKalman1D {
    private x: number = 0;
    private P: number = 1;
    private Q: number = 0.05;
    private R: number = 0.1;

    next(z: number): number {
        this.P += this.Q;
        const K = this.P / (this.P + this.R);
        this.x += K * (z - this.x);
        this.P *= 1 - K;
        return this.x;
    }
}

export class VelocityEMA {
    private last?: Pt;
    private lastT = 0;

    constructor(
        private alphaMin = 0.1,
        private alphaMax = 0.7,
        private vLow = 0.03,
        private vHigh = 0.5
    ) { }

    update(p: Pt, t = now()): Pt {
        if (!this.last) {
            this.last = { ...p };
            this.lastT = t;
            return { ...p };
        }
        const dt = Math.max(1, t - this.lastT);
        this.lastT = t;

        const vx = (p.x - this.last.x) / dt;
        const vy = (p.y - this.last.y) / dt;
        const v = Math.hypot(vx, vy);

        let a = (v - this.vLow) / (this.vHigh - this.vLow);
        a = Math.min(this.alphaMax, Math.max(this.alphaMin, a));

        this.last.x += a * (p.x - this.last.x);
        this.last.y += a * (p.y - this.last.y);
        return { x: this.last.x, y: this.last.y };
    }
}

export class SaccadeGuard {
    private lastGood?: Pt;
    private blockUntil = 0;

    constructor(private jumpPx = 120, private blockMs = 90) { }

    accept(p: Pt, t = now()): Pt | null {
        if (this.lastGood) {
            const d = Math.hypot(p.x - this.lastGood.x, p.y - this.lastGood.y);
            if (d > this.jumpPx) {
                this.blockUntil = t + this.blockMs;
                return null;
            }
        }
        if (t < this.blockUntil) return null;
        this.lastGood = p;
        return p;
    }
}