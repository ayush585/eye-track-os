import React, { useEffect, useRef, useState, Suspense } from "react";
import { motion, Variants, useMotionValue, useSpring } from "framer-motion"; // Animations + cursor spring
import {
    SignedIn,
    SignedOut,
    SignInButton,
    UserButton,
    RedirectToSignIn,
} from "@clerk/clerk-react"; // AuthCLERK
import {
    Eye,
    Hand,
    Zap,
    Shield,
    Cpu,
    LineChart,
    Github,
    Play,
    ChevronRight,
} from "lucide-react"; // SVG icons

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * CursorTrailer (subtle glow tail)
 * ──────────────────────────────────────────────────────────────────────────────
 * A soft, radial-gradient glow that follows the pointer using Framer Motion
 * springs. It's decorative only (aria-hidden, pointer-events-none).
 */
function CursorTrailer() {
    const x = useMotionValue(-1000);
    const y = useMotionValue(-1000);
    const smoothX = useSpring(x, { stiffness: 300, damping: 40, mass: 0.5 });
    const smoothY = useSpring(y, { stiffness: 300, damping: 40, mass: 0.5 });

    useEffect(() => {
        const handle = (e: MouseEvent) => {
            x.set(e.clientX);
            y.set(e.clientY);
        };
        window.addEventListener("mousemove", handle, { passive: true });
        return () => window.removeEventListener("mousemove", handle);
    }, [x, y]);

    return (
        <motion.div
            aria-hidden
            style={{ translateX: smoothX, translateY: smoothY }}
            className="pointer-events-none fixed z-[60] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-2xl"
        >
            <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.45),rgba(168,85,247,0.25)_60%,transparent_70%)] mix-blend-screen" />
        </motion.div>
    );
}

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * LazyMount (intersection-based lazy mount)
 * ──────────────────────────────────────────────────────────────────────────────
 * Renders a placeholder until the element scrolls into view, then mounts
 * children once. Great for deferring heavier components (3D, charts, etc.).
 */
function LazyMount({ children, rootMargin = "150px" }: { children: React.ReactNode; rootMargin?: string }) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!ref.current) return;
        const io = new IntersectionObserver(
            (entries) => entries.forEach((e) => e.isIntersecting && setReady(true)),
            { root: null, rootMargin, threshold: 0.05 }
        );
        io.observe(ref.current);
        return () => io.disconnect();
    }, [rootMargin]);

    return <div ref={ref}>{ready ? children : <div className="aspect-[16/10] w-full rounded-3xl border border-white/10 bg-black/30" />}</div>;
}

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * Optional Spline (lazy + safe fallback)
 * ──────────────────────────────────────────────────────────────────────────────
 * This keeps the file drop-in safe even if @splinetool/react-spline is not
 * installed. Flip `hasSpline` to true after installing to enable the 3D scene.
 */
const SplineLazy = React.lazy(() =>
    import("@splinetool/react-spline").catch(() => ({ default: () => null }))
);
const hasSpline = false; // set to true after: npm i @splinetool/react-spline

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * Animation variants
 * ──────────────────────────────────────────────────────────────────────────────
 */
const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

/**
 * Export name is `Home` (keeps App.tsx imports simple). The CTA points to `/os`
 * to match your protected route. A11y: skip link and consistent focus rings.
 */
export default function Home() {
    return (
        // Relative wrapper lets us position decorative layers absolutely
        <div className="min-h-screen w-full bg-[#06060a] text-white relative overflow-hidden">
            {/* Skip-to-content for keyboard users */}
            <a
                href="#main"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-black"
            >
                Skip to content
            </a>

            {/* Cursor glow trailer (decorative) */}
            <CursorTrailer />

            {/* Decorative gradient blobs */}
            <div className="pointer-events-none absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full blur-3xl opacity-30 bg-gradient-to-br from-cyan-500/40 to-fuchsia-600/40" />
            <div className="pointer-events-none absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full blur-3xl opacity-20 bg-gradient-to-tl from-indigo-500/30 to-emerald-500/30" />

            {/* NAVBAR */}
            <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-black/30 bg-black/20 border-b border-white/10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 shadow-lg" aria-hidden />
                        <span className="text-lg font-semibold tracking-tight">Eye-Track-OS</span>
                        <span className="ml-2 rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/70">Alpha</span>
                    </div>

                    {/* Primary nav (hidden on small screens for brevity) */}
                    <nav className="hidden md:flex items-center gap-6 text-sm text-white/80">
                        {[
                            { href: "#features", label: "Features" },
                            { href: "#how", label: "How it works" },
                            { href: "#tech", label: "Tech" },
                            { href: "#faq", label: "FAQ" },
                        ].map((l) => (
                            <a
                                key={l.href}
                                href={l.href}
                                className="outline-none hover:text-white transition focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-md px-1"
                            >
                                {l.label}
                            </a>
                        ))}
                    </nav>

                    {/* Auth */}
                    <div className="flex items-center gap-3">
                        <a
                            href="https://github.com/"
                            target="_blank"
                            rel="noreferrer"
                            className="hidden sm:inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-md px-2 py-1"
                        >
                            <Github className="h-4 w-4" aria-hidden /> Star
                        </a>
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="rounded-xl px-4 py-2 text-sm font-medium bg-white text-black hover:opacity-90 transition shadow outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black">
                                    Sign in
                                </button>
                            </SignInButton>
                        </SignedOut>
                        <SignedIn>
                            <UserButton afterSignOutUrl="/" />
                        </SignedIn>
                    </div>
                </div>
            </header>

            {/* HERO */}
            <section className="relative" id="main">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-10">
                    <motion.div variants={container} initial="hidden" animate="show" className="grid lg:grid-cols-2 gap-10 items-center">
                        {/* Left column: headline, copy, CTAs, stats */}
                        <div>
                            <motion.h1 variants={item} className="text-5xl sm:text-6xl font-extrabold leading-tight">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-500">Hands-free computing</span>
                                <br /> built for creators & accessibility
                            </motion.h1>
                            <motion.p variants={item} className="mt-5 text-lg text-white/70 max-w-xl">
                                Navigate, click, and type using only your gaze. On-device ML, micro-calibration, and latency-aware UX.
                                Privacy-first. No special hardware required.
                            </motion.p>

                            <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-3">
                                <SignedOut>
                                    <SignInButton mode="modal">
                                        <button className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-3 text-sm font-semibold shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.99] outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black">
                                            <Play className="h-4 w-4" aria-hidden /> Try the Demo
                                        </button>
                                    </SignInButton>
                                </SignedOut>
                                <SignedIn>
                                    {/* CTA points to /os to match protected route */}
                                    <a
                                        href="/os"
                                        className="group inline-flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-3 text-sm font-semibold shadow hover:bg-white/15 outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                                    >
                                        Open Dashboard <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                                    </a>
                                </SignedIn>

                                <a
                                    href="#how"
                                    className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-6 py-3 text-sm font-semibold hover:bg-white/5 outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                                >
                                    How it works
                                </a>
                            </motion.div>

                            {/* Investor-ish stats for quick credibility */}
                            <motion.div variants={item} className="mt-8 grid grid-cols-3 max-w-md gap-4 text-center">
                                {[
                                    { k: "~0.25s", v: "Avg. gaze→action latency" },
                                    { k: "97%", v: "Click precision after calibration" },
                                    { k: "0 HW", v: "No extra hardware needed" },
                                ].map((s, i) => (
                                    <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                                        <div className="text-xl font-bold">{s.k}</div>
                                        <div className="mt-1 text-[11px] text-white/60">{s.v}</div>
                                    </div>
                                ))}
                            </motion.div>
                        </div>

                        {/* Right column: 3D preview (lazy + Suspense) */}
                        <motion.div variants={item} className="relative">
                            <LazyMount>
                                <div className="aspect-[16/10] w-full rounded-3xl border border-white/10 bg-black/40 backdrop-blur overflow-hidden shadow-2xl">
                                    {hasSpline ? (
                                        <Suspense fallback={<div className="h-full w-full grid place-items-center text-white/50">Loading 3D…</div>}>
                                            <SplineLazy scene="/spline/eye-track-scene.splinecode" />
                                        </Suspense>
                                    ) : (
                                        <iframe
                                            title="Spline Preview"
                                            className="h-full w-full"
                                            // Light placeholder that won't block the main thread
                                            srcDoc={`<!DOCTYPE html><html><head><meta charset='utf-8'/><style>html,body{height:100%;margin:0;background:#0b0b12;color:#9aa0a6;display:grid;place-items:center;font:14px system-ui}</style></head><body>\n<div>3D Preview — connect your Spline scene here</div>\n</body></html>`}
                                        />
                                    )}
                                </div>
                            </LazyMount>
                            {/* Label chip */}
                            <div className="absolute -bottom-4 -left-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">
                                Live Prototype
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" className="py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="grid md:grid-cols-3 gap-6">
                        {[
                            { title: "Real-time Eye Tracking", desc: "Robust, head-movement tolerant tracking with micro-calibration.", Icon: Eye },
                            { title: "Hands-free Control", desc: "Gaze-to-click, dwell-to-type, and glance-based shortcuts.", Icon: Hand },
                            { title: "Low-latency Engine", desc: "Custom WebGL + WASM pipeline for sub-second response.", Icon: Zap },
                            { title: "Private by Design", desc: "All gaze vectors processed locally. No raw camera frames leave your device.", Icon: Shield },
                            { title: "On-device ML", desc: "TinyConv + Transformer fusion model optimized for CPU/GPU.", Icon: Cpu },
                            { title: "Adaptive Learning", desc: "Personalized calibration that improves with each session.", Icon: LineChart },
                        ].map(({ title, desc, Icon }, i) => (
                            <motion.div key={i} variants={item} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-white/10 p-2">
                                        <Icon className="h-5 w-5" aria-hidden />
                                    </div>
                                    <h3 className="text-lg font-semibold">{title}</h3>
                                </div>
                                <p className="mt-3 text-sm text-white/70">{desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how" className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
                        <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-2xl font-bold">
                            How it works
                        </motion.h2>
                        <div className="mt-6 grid md:grid-cols-4 gap-6">
                            {[
                                { n: 1, t: "Sign in", d: "Use Clerk to create a private profile and sync calibration." },
                                { n: 2, t: "Calibrate", d: "30-second micro-calibration aligns gaze vectors to your screen." },
                                { n: 3, t: "Control", d: "Hover with gaze, dwell to click, blink to confirm, glance for shortcuts." },
                                { n: 4, t: "Adapt", d: "Model fine-tunes preferences locally for your posture and lighting." },
                            ].map((s) => (
                                <div key={s.n} className="rounded-2xl border border-white/10 p-5">
                                    <div className="text-xs text-white/60">Step {s.n}</div>
                                    <div className="mt-1 text-lg font-semibold">{s.t}</div>
                                    <div className="mt-2 text-sm text-white/70">{s.d}</div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <a href="#demo" className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2 text-sm font-semibold shadow outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black">Launch Interactive Demo</a>
                            <a href="#docs" className="rounded-xl border border-white/15 px-5 py-2 text-sm font-semibold hover:bg-white/5 outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black">Read Docs</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* TECH STACK */}
            <section id="tech" className="py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div>
                            <h2 className="text-2xl font-bold">Under the hood</h2>
                            <p className="mt-3 text-white/70 max-w-prose">
                                Built with WebAssembly, WebGL, and a hybrid TinyConv+Transformer model compiled via ONNX Runtime Web. We use
                                a Kalman filter for gaze smoothing, RANSAC for outlier rejection, and a latency-aware event dispatcher to
                                ensure predictable interactions.
                            </p>
                            <ul className="mt-4 space-y-2 text-sm text-white/70 list-disc list-inside">
                                <li>Privacy-first: on-device inference, differential privacy for analytics</li>
                                <li>Clerk for auth, multi-device sync for calibration matrices</li>
                                <li>Realtime store with IndexedDB + CRDT for low-latency state</li>
                            </ul>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {["React", "Vite", "Tailwind", "Framer Motion", "Clerk", "WASM", "WebGL", "ONNX Runtime"].map((t) => (
                                <div key={t} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 text-center">
                                    {t}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="py-12">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold">FAQ</h2>
                    <div className="mt-6 space-y-4">
                        {[
                            { q: "Do I need special hardware?", a: "No. A normal laptop webcam works. Performance improves with 60fps cameras." },
                            { q: "Is my video uploaded?", a: "Never. All processing is local. We only sync tiny calibration parameters if you opt in." },
                            { q: "Can I type with eyes?", a: "Yes. We provide a dwell-based keyboard and predictive typing model." },
                        ].map((f, i) => (
                            <details key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
                                <summary className="cursor-pointer font-medium outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-md px-1 py-0.5">{f.q}</summary>
                                <p className="mt-2 text-sm text-white/70">{f.a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-white/10 py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/60">
                    <div>© {new Date().getFullYear()} Eye-Track-OS • A MindMorph Labs prototype</div>
                    <div className="flex items-center gap-4">
                        <a href="#privacy" className="hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-md px-1">Privacy</a>
                        <a href="#terms" className="hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-md px-1">Terms</a>
                        <a href="#contact" className="hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-md px-1">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

