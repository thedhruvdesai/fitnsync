"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Move, Pose, Vec } from "@/lib/exercises";

const L = { torso: 46, upperArm: 28, forearm: 26, thigh: 38, shin: 38, neck: 14 };
const GROUND = 178;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lv = (a: Vec, b: Vec, t: number): Vec => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1]];
const len = (v: Vec) => Math.hypot(v[0], v[1]);

/** 2-link IK: joint position between root and target; sign picks the bend side. */
function ik(root: Vec, target: Vec, a: number, b: number, sign: number): { joint: Vec; end: Vec } {
  const dx = target[0] - root[0];
  const dy = target[1] - root[1];
  let d = Math.hypot(dx, dy);
  const max = a + b - 0.01;
  const end: Vec = d > max ? [root[0] + (dx / d) * max, root[1] + (dy / d) * max] : target;
  d = Math.min(d, max);
  const cos = Math.min(1, Math.max(-1, (a * a + d * d - b * b) / (2 * a * Math.max(d, 0.001))));
  const alpha = Math.acos(cos) * sign;
  const ux = dx / (Math.hypot(dx, dy) || 1);
  const uy = dy / (Math.hypot(dx, dy) || 1);
  const rx = ux * Math.cos(alpha) - uy * Math.sin(alpha);
  const ry = ux * Math.sin(alpha) + uy * Math.cos(alpha);
  return { joint: [root[0] + rx * a, root[1] + ry * a], end };
}

function lerpPose(a: Pose, b: Pose, t: number): Pose {
  return {
    pelvis: lv(a.pelvis, b.pelvis, t),
    torso: a.torso != null && b.torso != null ? lerp(a.torso, b.torso, t) : undefined,
    shoulder: a.shoulder && b.shoulder ? lv(a.shoulder, b.shoulder, t) : undefined,
    hand: lv(a.hand, b.hand, t),
    handFar: lv(a.handFar ?? a.hand, b.handFar ?? b.hand, t),
    foot: lv(a.foot, b.foot, t),
    footFar: lv(a.footFar ?? a.foot, b.footFar ?? b.foot, t),
  };
}

function groundAt(move: Move, ankle: Vec) {
  if (move.gear.includes("box") && ankle[0] > 106 && ankle[0] < 154 && ankle[1] < 150) return 146;
  return GROUND;
}

function toe(move: Move, ankle: Vec): Vec {
  const g = groundAt(move, ankle);
  const prone = move.key === "pushup" || move.key === "plank";
  if (ankle[1] > g - 24) return [ankle[0] + (prone ? 5 : 13), g];
  return [ankle[0] + 11, ankle[1] + 6];
}

export function solve(move: Move, t: number) {
  const p = lerpPose(move.a, move.b, t);
  const pelvis = p.pelvis;
  const shoulder: Vec = p.shoulder ?? [pelvis[0] + L.torso * Math.sin(((p.torso ?? 0) * Math.PI) / 180), pelvis[1] - L.torso * Math.cos(((p.torso ?? 0) * Math.PI) / 180)];
  const dir: Vec = [shoulder[0] - pelvis[0], shoulder[1] - pelvis[1]];
  const dl = len(dir) || 1;
  const head: Vec = [shoulder[0] + (dir[0] / dl) * L.neck, shoulder[1] + (dir[1] / dl) * L.neck];

  const footN = move.feetFromPelvis ? add(pelvis, p.foot) : p.foot;
  const footF = move.feetFromPelvis ? add(pelvis, p.footFar!) : p.footFar!;
  const ks = move.kneeSign ?? -1;
  const legN = ik(pelvis, footN, L.thigh, L.shin, ks);
  const legF = ik(pelvis, footF, L.thigh, L.shin, ks);
  const armN = ik(shoulder, add(shoulder, p.hand), L.upperArm, L.forearm, 1);
  const armF = ik(shoulder, add(shoulder, p.handFar!), L.upperArm, L.forearm, 1);

  return {
    pelvis,
    shoulder,
    head,
    near: { knee: legN.joint, ankle: legN.end, toe: toe(move, legN.end), elbow: armN.joint, hand: armN.end },
    far: { knee: legF.joint, ankle: legF.end, toe: toe(move, legF.end), elbow: armF.joint, hand: armF.end },
  };
}

const BONE = "#F4F1EC";
const FAR = "#5A5752";
const RED = "#E11D2E";

function Seg({ a, b, w, c, o = 1 }: { a: Vec; b: Vec; w: number; c: string; o?: number }) {
  return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={c} strokeWidth={w} strokeLinecap="round" opacity={o} />;
}

function Gear({ move }: { move: Move }) {
  return (
    <g>
      {move.gear.includes("mat") && <rect x={6} y={GROUND} width={188} height={4} rx={2} fill={RED} opacity={0.25} />}
      {move.gear.includes("bench") && (
        <g fill="#26262A">
          <rect x={40} y={137} width={104} height={8} rx={3} />
          <rect x={52} y={145} width={5} height={33} />
          <rect x={126} y={145} width={5} height={33} />
        </g>
      )}
      {move.gear.includes("chair") && (
        <g fill="#26262A">
          <rect x={78} y={139} width={40} height={8} rx={3} />
          <rect x={93} y={147} width={6} height={31} />
          <rect x={74} y={94} width={7} height={50} rx={3} />
        </g>
      )}
      {move.gear.includes("treadmill") && (
        <g stroke="#26262A" strokeLinecap="round">
          <line x1={40} y1={174} x2={170} y2={174} strokeWidth={6} />
          <line x1={166} y1={174} x2={166} y2={104} strokeWidth={5} />
          <line x1={150} y1={110} x2={172} y2={104} strokeWidth={6} />
        </g>
      )}
      {move.gear.includes("stairs") && (
        <g fill="#1A1A1D" stroke="#33333A" strokeWidth={2}>
          <rect x={108} y={146} width={60} height={32} rx={3} />
          <rect x={60} y={170} width={50} height={8} rx={2} />
          <line x1={150} y1={146} x2={150} y2={110} stroke="#26262A" strokeWidth={5} />
        </g>
      )}
      {move.gear.includes("elliptical") && (
        <g stroke="#26262A" strokeLinecap="round">
          <ellipse cx={104} cy={168} rx={28} ry={8} fill="none" strokeWidth={4} />
          <line x1={150} y1={178} x2={150} y2={96} strokeWidth={6} />
          <line x1={150} y1={110} x2={128} y2={100} strokeWidth={4} />
        </g>
      )}
      {move.gear.includes("squatbox") && <rect x={44} y={140} width={38} height={38} rx={4} fill="#1A1A1D" stroke="#33333A" strokeWidth={2} />}
      {move.gear.includes("rearbench") && (
        <g fill="#26262A">
          <rect x={22} y={138} width={44} height={8} rx={3} />
          <rect x={30} y={146} width={5} height={32} />
          <rect x={54} y={146} width={5} height={32} />
        </g>
      )}
      {move.gear.includes("thrustbench") && (
        <g fill="#26262A">
          <rect x={14} y={136} width={46} height={8} rx={3} />
          <rect x={22} y={144} width={5} height={34} />
          <rect x={48} y={144} width={5} height={34} />
        </g>
      )}
      {move.gear.includes("preacher") && (
        <g stroke="#26262A" strokeLinecap="round">
          <line x1={104} y1={100} x2={134} y2={128} strokeWidth={8} />
          <line x1={126} y1={124} x2={126} y2={178} strokeWidth={5} />
        </g>
      )}
      {move.gear.includes("lowbox") && <rect x={2} y={150} width={36} height={28} rx={4} fill="#1A1A1D" stroke="#33333A" strokeWidth={2} />}
      {move.gear.includes("inclinebench") && (
        <g stroke="#26262A" strokeLinecap="round">
          <line x1={84} y1={112} x2={124} y2={142} strokeWidth={9} />
          <line x1={112} y1={141} x2={148} y2={141} strokeWidth={8} />
          <line x1={128} y1={145} x2={128} y2={178} strokeWidth={5} />
          <line x1={100} y1={126} x2={100} y2={178} strokeWidth={5} />
        </g>
      )}
      {move.gear.includes("declinebench") && (
        <g stroke="#26262A" strokeLinecap="round">
          <line x1={70} y1={150} x2={136} y2={130} strokeWidth={9} />
          <line x1={80} y1={152} x2={80} y2={178} strokeWidth={5} />
          <line x1={126} y1={136} x2={126} y2={178} strokeWidth={5} />
          <line x1={126} y1={142} x2={152} y2={150} strokeWidth={5} />
          <circle cx={154} cy={150} r={5} fill="#33333A" stroke="none" />
        </g>
      )}
      {move.gear.includes("seat") && (
        <g fill="#26262A">
          <rect x={76} y={139} width={40} height={8} rx={3} />
          <rect x={93} y={147} width={6} height={31} />
          <rect x={118} y={120} width={6} height={22} rx={3} />
        </g>
      )}
      {move.gear.includes("bike") && (
        <g stroke="#3a3a40" strokeWidth={5} strokeLinecap="round" fill="none">
          <line x1={78} y1={124} x2={102} y2={124} />
          <line x1={92} y1={126} x2={112} y2={156} />
          <line x1={112} y1={156} x2={132} y2={104} />
          <line x1={124} y1={104} x2={140} y2={104} />
          <line x1={100} y1={178} x2={150} y2={178} />
          <line x1={112} y1={156} x2={112} y2={178} />
          <circle cx={112} cy={155} r={14} strokeWidth={3} />
        </g>
      )}
      {move.gear.includes("dipbars") && (
        <g>
          <line x1={84} y1={100} x2={136} y2={100} stroke="#6B6862" strokeWidth={5} strokeLinecap="round" />
          <line x1={130} y1={100} x2={130} y2={178} stroke="#33333A" strokeWidth={5} />
          <line x1={90} y1={100} x2={90} y2={178} stroke="#33333A" strokeWidth={5} />
        </g>
      )}
      {move.gear.includes("lowbar") && (
        <g>
          <line x1={58} y1={100} x2={100} y2={100} stroke="#6B6862" strokeWidth={5} strokeLinecap="round" />
          <line x1={62} y1={100} x2={62} y2={178} stroke="#33333A" strokeWidth={4} />
        </g>
      )}
      {move.gear.includes("sled") && (
        <g stroke="#26262A" strokeLinecap="round">
          <line x1={46} y1={118} x2={92} y2={160} strokeWidth={9} />
          <line x1={80} y1={160} x2={110} y2={160} strokeWidth={8} />
          <line x1={94} y1={164} x2={94} y2={178} strokeWidth={6} />
        </g>
      )}
      {move.gear.includes("incline") && (
        <g stroke="#26262A" strokeLinecap="round">
          <line x1={46} y1={170} x2={104} y2={118} strokeWidth={9} />
          <line x1={104} y1={118} x2={104} y2={178} strokeWidth={6} />
          <line x1={46} y1={170} x2={46} y2={178} strokeWidth={6} />
        </g>
      )}
      {move.gear.includes("box") && <rect x={108} y={146} width={46} height={32} rx={4} fill="#1A1A1D" stroke="#33333A" strokeWidth={2} />}
      {move.gear.includes("bar") && (
        <g>
          <line x1={52} y1={26} x2={148} y2={26} stroke="#6B6862" strokeWidth={5} strokeLinecap="round" />
          <line x1={56} y1={26} x2={56} y2={4} stroke="#33333A" strokeWidth={4} />
          <line x1={144} y1={26} x2={144} y2={4} stroke="#33333A" strokeWidth={4} />
        </g>
      )}
    </g>
  );
}

function Held({ move, hand, far }: { move: Move; hand: Vec; far?: boolean }) {
  if (move.gear.includes("barbell")) {
    if (far) return null;
    return (
      <g>
        <circle cx={hand[0]} cy={hand[1]} r={13} fill="#151517" stroke={RED} strokeWidth={3} />
        <circle cx={hand[0]} cy={hand[1]} r={3} fill="#6B6862" />
      </g>
    );
  }
  if (move.gear.includes("dumbbell")) {
    return <rect x={hand[0] - 8} y={hand[1] - 5} width={16} height={10} rx={3} fill={far ? "#26262A" : "#33333A"} stroke={far ? "#3a3a3f" : "#A8A49D"} strokeWidth={1.5} />;
  }
  return null;
}

/** A square view box around where the figure actually moves, so small thumbnails aren't mostly empty space. */
export function fitBox(move: Move) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    const f = solve(move, t);
    for (const q of [f.pelvis, f.shoulder, f.head, f.near.knee, f.near.ankle, f.near.toe, f.near.elbow, f.near.hand, f.far.knee, f.far.ankle, f.far.hand]) {
      x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]);
    }
  }
  y1 = Math.max(y1, GROUND);
  const side = Math.min(200, Math.max(x1 - x0, y1 - y0, 96) + 44);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return `${(cx - side / 2).toFixed(1)} ${(cy - side / 2).toFixed(1)} ${side.toFixed(1)} ${side.toFixed(1)}`;
}

/**
 * Animated side-view exercise figure. Pauses when off-screen and respects reduced-motion.
 */
export function ExerciseFigure({ move, speed = 1, playing = true, className = "", showGround = true, at, fit = false }: { move: Move; speed?: number; playing?: boolean; className?: string; showGround?: boolean; at?: number; fit?: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  const [t, setT] = useState(0);
  const visible = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !playing) {
      if (reduce) setT(0.7);
      return;
    }
    let raf = 0;
    let phase = 0;
    let last = performance.now();
    const period = (move.tempo ?? 2600) / speed;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = now - last;
      last = now;
      if (!visible.current) return;
      phase = (phase + dt / period) % 1;
      // ease: slow at both ends like a controlled rep, small pause at the top/bottom
      const c = (1 - Math.cos(2 * Math.PI * phase)) / 2;
      setT(Math.min(1, Math.max(0, (c - 0.04) / 0.92)));
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [move, speed, playing]);

  const box = useMemo(() => (fit ? fitBox(move) : "0 0 200 200"), [fit, move]);
  const f = solve(move, at ?? t);
  const hl = new Set(move.highlight);
  const nearW = 9;

  return (
    <svg ref={ref} viewBox={box} className={className} role="img" aria-label={`${move.title} demonstration`}>
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="floor" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={RED} stopOpacity=".25" />
          <stop offset="1" stopColor={RED} stopOpacity="0" />
        </radialGradient>
      </defs>

      {showGround && (
        <>
          <ellipse cx={100} cy={GROUND + 2} rx={80} ry={8} fill="url(#floor)" />
          <line x1={4} y1={GROUND} x2={196} y2={GROUND} stroke="#ffffff" strokeOpacity={0.08} strokeWidth={1.5} />
        </>
      )}
      <Gear move={move} />
      {move.cableFrom && (
        <g>
          <circle cx={move.cableFrom[0]} cy={move.cableFrom[1]} r={4} fill="#33333A" />
          <line x1={move.cableFrom[0]} y1={move.cableFrom[1]} x2={f.near.hand[0]} y2={f.near.hand[1]} stroke="#6B6862" strokeWidth={1.5} strokeDasharray="3 3" />
        </g>
      )}

      {/* far side limbs */}
      <g>
        <Seg a={f.pelvis} b={f.far.knee} w={nearW} c={FAR} />
        <Seg a={f.far.knee} b={f.far.ankle} w={nearW - 1} c={FAR} />
        <Seg a={f.far.ankle} b={f.far.toe} w={6} c={FAR} />
        <Seg a={f.shoulder} b={f.far.elbow} w={nearW - 1} c={FAR} />
        <Seg a={f.far.elbow} b={f.far.hand} w={nearW - 2} c={FAR} />
        <Held move={move} hand={f.far.hand} far />
      </g>

      {/* torso + head */}
      <Seg a={f.pelvis} b={f.shoulder} w={15} c={BONE} />
      {hl.has("torso") && <g filter="url(#glow)"><Seg a={lv(f.pelvis, f.shoulder, 0.3)} b={lv(f.pelvis, f.shoulder, 0.85)} w={9} c={RED} /></g>}
      {hl.has("hip") && <circle cx={f.pelvis[0]} cy={f.pelvis[1]} r={7} fill={RED} filter="url(#glow)" />}
      <circle cx={f.head[0]} cy={f.head[1]} r={9.5} fill={BONE} />

      {/* near leg */}
      <Seg a={f.pelvis} b={f.near.knee} w={nearW + 1} c={BONE} />
      {hl.has("thigh") && <g filter="url(#glow)"><Seg a={lv(f.pelvis, f.near.knee, 0.18)} b={lv(f.pelvis, f.near.knee, 0.82)} w={5} c={RED} /></g>}
      <Seg a={f.near.knee} b={f.near.ankle} w={nearW} c={BONE} />
      {hl.has("shin") && <g filter="url(#glow)"><Seg a={lv(f.near.knee, f.near.ankle, 0.15)} b={lv(f.near.knee, f.near.ankle, 0.7)} w={5} c={RED} /></g>}
      <Seg a={f.near.ankle} b={f.near.toe} w={7} c={BONE} />

      {/* near arm */}
      <Seg a={f.shoulder} b={f.near.elbow} w={nearW} c={BONE} />
      {hl.has("upperArm") && <g filter="url(#glow)"><Seg a={lv(f.shoulder, f.near.elbow, 0.2)} b={lv(f.shoulder, f.near.elbow, 0.85)} w={4.5} c={RED} /></g>}
      <Seg a={f.near.elbow} b={f.near.hand} w={nearW - 1} c={BONE} />
      {hl.has("forearm") && <g filter="url(#glow)"><Seg a={lv(f.near.elbow, f.near.hand, 0.15)} b={lv(f.near.elbow, f.near.hand, 0.75)} w={4} c={RED} /></g>}
      <Held move={move} hand={f.near.hand} />
      <circle cx={f.near.hand[0]} cy={f.near.hand[1]} r={4.5} fill={BONE} />
    </svg>
  );
}
