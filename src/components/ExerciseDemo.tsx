"use client";
import { useMemo, useState } from "react";
import { ExerciseFigure } from "./ExerciseFigure";
import { moveFor } from "@/lib/exercises";
import { findExercise, photo, type LibExercise } from "@/lib/library";

/** Real-person demo: start and finish photos crossfaded in a rep rhythm. */
export function ExerciseDemo({ ex, className = "" }: { ex: LibExercise; className?: string }) {
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [frame, setFrame] = useState<0 | 1 | null>(null);
  const rep = `${2.8 / speed}s`;
  return (
    <div className={`relative overflow-hidden rounded-3xl border border-white/10 bg-ink ${className}`}>
      <div className={`relative aspect-[3/2] w-full ${playing && frame == null ? "" : "rep-paused"}`} style={{ ["--rep" as string]: rep }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo(ex.id, 0)} alt={`${ex.name}: start position`} className="demo-photo absolute inset-0 h-full w-full object-cover" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo(ex.id, 1)}
          alt={`${ex.name}: finish position`}
          className={`demo-photo absolute inset-0 h-full w-full object-cover ${frame == null ? "rep-b" : ""}`}
          style={frame != null ? { opacity: frame } : undefined}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-ink/30" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {ex.primary.map((m) => (
            <span key={m} className="rounded-full bg-blood px-2.5 py-0.5 text-[11px] font-semibold text-white shadow">{m}</span>
          ))}
          {ex.secondary.slice(0, 2).map((m) => (
            <span key={m} className="rounded-full bg-ink/70 px-2.5 py-0.5 text-[11px] text-bone-dim backdrop-blur">{m}</span>
          ))}
        </div>
        <div className="absolute inset-x-3 bottom-3 h-1 overflow-hidden rounded-full bg-white/15">
          <div className={`h-full w-full rounded-full bg-blood ${frame == null ? "rep-bar" : ""}`} style={frame != null ? { transform: `scaleX(${frame})`, transformOrigin: "left" } : undefined} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-white/5 px-3 py-2.5">
        <button onClick={() => { setFrame(null); setPlaying((p) => !p); }} className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-sm" aria-label={playing ? "Pause" : "Play"}>
          {playing && frame == null ? "❚❚" : "▶"}
        </button>
        <div className="flex gap-1 rounded-full bg-white/5 p-1 text-xs">
          <button onClick={() => setFrame(0)} className={`rounded-full px-3 py-1 ${frame === 0 ? "bg-bone text-ink" : "text-bone-dim"}`}>Start</button>
          <button onClick={() => setFrame(1)} className={`rounded-full px-3 py-1 ${frame === 1 ? "bg-bone text-ink" : "text-bone-dim"}`}>Finish</button>
        </div>
        <div className="flex gap-1 rounded-full bg-white/5 p-1">
          {[0.5, 1, 1.5].map((s) => (
            <button key={s} onClick={() => { setSpeed(s); setFrame(null); setPlaying(true); }} className={`rounded-full px-2.5 py-1 text-xs transition ${speed === s && frame == null ? "bg-blood text-white" : "text-bone-dim"}`}>{s}×</button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Round looping thumbnail for lists. */
export function ExerciseAvatar({ id, name, className = "h-14 w-14" }: { id: string; name: string; className?: string }) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-full border border-white/10 bg-ink-3 ${className}`} style={{ ["--rep" as string]: "3.4s" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo(id as string, 0)} alt="" loading="lazy" className="demo-photo absolute inset-0 h-full w-full object-cover" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo(id as string, 1)} alt={name} loading="lazy" className="demo-photo rep-b absolute inset-0 h-full w-full object-cover" />
    </div>
  );
}

/** Small looping thumbnail for lists. */
export function ExerciseThumb({ name, className = "h-14 w-14" }: { name: string; className?: string }) {
  const move = useMemo(() => moveFor(name), [name]);
  const lib = useMemo(() => findExercise(name), [name]);
  if (lib) return <ExerciseAvatar id={lib.id} name={lib.name} className={className} />;
  return (
    <div className={`shrink-0 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-blood/10 to-ink ${className}`}>
      <ExerciseFigure move={move} showGround={false} className="h-full w-full" />
    </div>
  );
}
