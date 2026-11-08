"use client";
import { useEffect, useRef } from "react";

/** One heartbeat (ECG) shape over 0..1 of a beat: flat, P bump, sharp QRS spike, T wave. Returns -1..1 (up is positive). */
function ecg(u: number) {
  const g = (c: number, w: number, a: number) => a * Math.exp(-((u - c) * (u - c)) / (2 * w * w));
  return g(0.18, 0.025, 0.12) + g(0.3, 0.008, -0.18) + g(0.33, 0.009, 1) + g(0.36, 0.009, -0.35) + g(0.55, 0.04, 0.22);
}

/**
 * Sign-in background: a heart-rate monitor. A red trace sweeps across like a live ECG,
 * the screen glows softly on each beat, over a faint monitor grid.
 * Light on the phone (canvas, ~30 fps on mobile, pauses when hidden) and still for reduced motion.
 */
export function PulseBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, raf = 0, last = 0, start = performance.now();

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // two traces: a bold one low on the screen, a faint one behind the heading
    const traces = [
      { y: 0.84, amp: 0.085, beatPx: 260, alpha: 1, width: 2.4, speed: 1 },
      { y: 0.2, amp: 0.045, beatPx: 200, alpha: 0.35, width: 1.4, speed: 0.8 },
    ];
    const SWEEP = mobile ? 130 : 210; // px per second
    const TRAIL = 0.62; // share of the screen that stays lit behind the head

    const yAt = (tr: (typeof traces)[number], x: number) => h * tr.y - ecg(((x % tr.beatPx) + tr.beatPx) % tr.beatPx / tr.beatPx) * h * tr.amp;

    const draw = (now: number) => {
      if (!reduce) raf = requestAnimationFrame(draw);
      if (!reduce && now - last < (mobile ? 33 : 16)) return;
      last = now;
      const secs = (now - start) / 1000;
      ctx.clearRect(0, 0, w, h);

      // monitor grid
      ctx.strokeStyle = "rgba(244,241,236,0.035)";
      ctx.lineWidth = 1;
      const cell = mobile ? 28 : 36;
      ctx.beginPath();
      for (let x = 0; x <= w; x += cell) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
      for (let y = 0; y <= h; y += cell) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
      ctx.stroke();

      const main = traces[0];
      const headMain = reduce ? w * 0.7 : (secs * SWEEP * main.speed) % (w + 80);
      // beat glow: strongest just after the spike passes the head
      const phase = (((headMain % main.beatPx) + main.beatPx) % main.beatPx) / main.beatPx;
      const since = (phase - 0.33 + 1) % 1;
      const glow = reduce ? 0.4 : Math.exp(-since * 9);
      const rg = ctx.createRadialGradient(headMain, h * main.y, 0, headMain, h * main.y, Math.max(w, h) * 0.6);
      rg.addColorStop(0, `rgba(225,29,46,${0.16 + glow * 0.22})`);
      rg.addColorStop(1, "rgba(225,29,46,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, h);

      for (const tr of traces) {
        const head = reduce ? w * 0.7 : (secs * SWEEP * tr.speed) % (w + 80);
        const tail = head - w * TRAIL;
        // faint full line so the shape is always readable
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) ctx.lineTo(x, yAt(tr, x));
        ctx.strokeStyle = `rgba(244,241,236,${0.05 * tr.alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        // lit trail that fades out behind the head
        const grad = ctx.createLinearGradient(tail, 0, head, 0);
        grad.addColorStop(0, "rgba(225,29,46,0)");
        grad.addColorStop(0.75, `rgba(225,29,46,${0.55 * tr.alpha})`);
        grad.addColorStop(1, `rgba(255,120,120,${tr.alpha})`);
        ctx.beginPath();
        for (let x = Math.max(0, tail); x <= Math.min(w, head); x += 2) ctx.lineTo(x, yAt(tr, x));
        ctx.strokeStyle = grad;
        ctx.lineWidth = tr.width;
        ctx.lineJoin = "round";
        ctx.shadowColor = "rgba(225,29,46,0.8)";
        ctx.shadowBlur = 12 * tr.alpha;
        ctx.stroke();
        ctx.shadowBlur = 0;
        // glowing head
        if (head <= w) {
          const hy = yAt(tr, head);
          const hg = ctx.createRadialGradient(head, hy, 0, head, hy, 14);
          hg.addColorStop(0, `rgba(255,220,220,${tr.alpha})`);
          hg.addColorStop(0.3, `rgba(225,29,46,${0.7 * tr.alpha})`);
          hg.addColorStop(1, "rgba(225,29,46,0)");
          ctx.fillStyle = hg;
          ctx.beginPath();
          ctx.arc(head, hy, 14, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // soft vignette so the form stays the focus
      const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75);
      vg.addColorStop(0, "rgba(10,10,11,0)");
      vg.addColorStop(1, "rgba(10,10,11,0.7)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
    };

    if (reduce) draw(performance.now());
    else raf = requestAnimationFrame(draw);

    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduce) { start = performance.now() - ((performance.now() - start) % 100000); raf = requestAnimationFrame(draw); }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-0 bg-ink">
      <canvas ref={ref} className="h-full w-full" />
    </div>
  );
}
