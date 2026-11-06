"use client";
import { useEffect, useRef } from "react";

/**
 * Animated background: flowing "contour" lines that breathe like a heartbeat and bend toward the cursor,
 * plus drifting red glow orbs and film grain. Pauses off-screen and respects prefers-reduced-motion.
 */
export function Backdrop({ intensity = 1, still = false }: { intensity?: number; still?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = still || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    let w = 0, h = 0, raf = 0, t = 0, last = 0;
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    const onMove = (e: PointerEvent) => { mouse.tx = e.clientX / w; mouse.ty = e.clientY / h; };
    window.addEventListener("pointermove", onMove);

    const LINES = mobile ? 22 : 38;
    const STEP = mobile ? 14 : 10;

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - last < (mobile ? 33 : 16)) return;
      last = now;
      t += reduce ? 0 : 0.006;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      ctx.clearRect(0, 0, w, h);

      // heartbeat pulse every ~3.2s
      const beat = Math.pow(Math.max(0, Math.sin(t * 6.2)), 24);

      for (let i = 0; i < LINES; i++) {
        const p = i / (LINES - 1);
        const baseY = h * (0.08 + p * 0.9);
        const amp = (18 + 42 * Math.sin(p * Math.PI)) * (1 + beat * 0.35);
        ctx.beginPath();
        for (let x = -20; x <= w + 20; x += STEP) {
          const nx = x / w;
          const dx = nx - mouse.x, dy = p - mouse.y;
          const pull = Math.exp(-(dx * dx + dy * dy) * 9) * 60;
          const y =
            baseY +
            Math.sin(nx * 4.2 + t * 1.3 + p * 5.1) * amp * 0.55 +
            Math.sin(nx * 9.7 - t * 0.9 + p * 2.3) * amp * 0.25 +
            Math.cos(nx * 1.7 + t * 0.5 + p * 9) * amp * 0.35 -
            pull;
          x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        const hot = Math.exp(-Math.pow((p - mouse.y) * 4, 2));
        const a = (0.05 + hot * 0.16 + beat * 0.05) * intensity;
        ctx.strokeStyle = i % 6 === 0 ? `rgba(255,59,76,${a * 1.8})` : `rgba(225,29,46,${a})`;
        ctx.lineWidth = i % 6 === 0 ? 1.4 : 1;
        ctx.stroke();
      }
    };
    if (reduce) {
      // static: draw a single frame (and again on resize) instead of animating
      const once = () => { last = 0; draw(performance.now() + 1000); cancelAnimationFrame(raf); };
      once();
      window.removeEventListener("pointermove", onMove);
      window.addEventListener("resize", once);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
        window.removeEventListener("resize", once);
      };
    }
    raf = requestAnimationFrame(draw);

    const vis = () => { if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(draw); };
    document.addEventListener("visibilitychange", vis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [intensity, still]);

  return (
    <div aria-hidden className={`pointer-events-none fixed inset-0 -z-0 overflow-hidden ${still ? "backdrop-still" : ""}`}>
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="orb orb-c" />
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#0A0A0B_100%)]" />
    </div>
  );
}
