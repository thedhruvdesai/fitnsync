"use client";
import { useEffect, useMemo, useState } from "react";
import { ExerciseFigure } from "./ExerciseFigure";
import { moveFor } from "@/lib/exercises";
import { photo, type LibExercise } from "@/lib/library";

const MODE_KEY = "fs_demo_mode";

/**
 * Exercise demo. Default: the animated figure (same style for every exercise).
 * Where a real photo exists, "Photo" switches to start/finish photos crossfaded like a rep.
 */
export function ExerciseDemo({ name, lib, className = "" }: { name: string; lib?: LibExercise; className?: string }) {
  const move = useMemo(() => moveFor(name), [name]);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [frame, setFrame] = useState<0 | 1 | null>(null);
  const [mode, setModeState] = useState<"figure" | "photo">("figure");
  useEffect(() => {
    try {
      if (localStorage.getItem(MODE_KEY) === "photo") setModeState("photo");
    } catch {
      /* ignore */
    }
  }, []);
  const setMode = (m: "figure" | "photo") => {
    setModeState(m);
    setFrame(null);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      /* ignore */
    }
  };
  const showPhoto = mode === "photo" && !!lib;
  const primary = lib?.primary ?? move.muscles.slice(0, 1);
  const secondary = lib?.secondary.slice(0, 2) ?? move.muscles.slice(1, 3);
  const rep = `${2.8 / speed}s`;

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-blood/10 to-ink ${className}`}>
      {showPhoto ? (
        <div className={`relative aspect-[3/2] w-full ${playing && frame == null ? "" : "rep-paused"}`} style={{ ["--rep" as string]: rep }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo(lib!.id, 0)} alt={`${lib!.name}: start position`} className="demo-photo absolute inset-0 h-full w-full object-cover" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo(lib!.id, 1)} alt={`${lib!.name}: finish position`} className={`demo-photo absolute inset-0 h-full w-full object-cover ${frame == null ? "rep-b" : ""}`} style={frame != null ? { opacity: frame } : undefined} />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-ink/30" />
        </div>
      ) : (
        <div className="relative">
          <div aria-hidden className="h-display text-outline pointer-events-none absolute inset-x-0 top-2 select-none text-center text-[64px] uppercase leading-none opacity-20">{move.title.split(" ")[0]}</div>
          <ExerciseFigure key={name} move={move} speed={speed} playing={playing && frame == null} at={frame ?? undefined} className="relative mx-auto h-60 w-full max-w-sm md:h-72" />
        </div>
      )}
      <div className={`pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5 ${lib ? "right-[132px]" : "right-3"}`}>
        {primary.map((m) => <span key={m} className="rounded-full bg-blood px-2.5 py-0.5 text-[11px] font-semibold text-white shadow">{m}</span>)}
        {secondary.slice(0, lib ? 1 : 2).map((m) => <span key={m} className="rounded-full bg-ink/70 px-2.5 py-0.5 text-[11px] text-bone-dim backdrop-blur">{m}</span>)}
      </div>
      {lib && (
        <div className="absolute right-3 top-3 flex rounded-full bg-ink/80 p-0.5 text-[11px] backdrop-blur" role="group" aria-label="Demo style">
          <button onClick={() => setMode("figure")} className={`rounded-full px-2.5 py-1 ${!showPhoto ? "bg-bone font-semibold text-ink" : "text-bone-dim"}`}>Animation</button>
          <button onClick={() => setMode("photo")} className={`rounded-full px-2.5 py-1 ${showPhoto ? "bg-bone font-semibold text-ink" : "text-bone-dim"}`}>Photo</button>
        </div>
      )}
      <div className="relative flex flex-wrap items-center justify-between gap-1.5 border-t border-white/5 px-2 py-2.5 min-[380px]:gap-2 min-[380px]:px-3">
        <button onClick={() => { setFrame(null); setPlaying((p) => !p); }} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/5 text-sm min-[380px]:h-10 min-[380px]:w-10" aria-label={playing && frame == null ? "Pause" : "Play"}>
          {playing && frame == null ? "❚❚" : "▶"}
        </button>
        <div className="flex gap-1 rounded-full bg-white/5 p-1 text-xs">
          <button onClick={() => setFrame(0)} className={`rounded-full px-2 py-1 min-[380px]:px-3 ${frame === 0 ? "bg-bone text-ink" : "text-bone-dim"}`}>Start</button>
          <button onClick={() => setFrame(1)} className={`rounded-full px-2 py-1 min-[380px]:px-3 ${frame === 1 ? "bg-bone text-ink" : "text-bone-dim"}`}>Finish</button>
        </div>
        <div className="flex gap-1 rounded-full bg-white/5 p-1">
          {[0.5, 1, 1.5].map((sp) => (
            <button key={sp} onClick={() => { setSpeed(sp); setFrame(null); setPlaying(true); }} className={`rounded-full px-2 py-1 text-xs transition min-[380px]:px-2.5 ${speed === sp && frame == null ? "bg-blood text-white" : "text-bone-dim"}`}>{sp}×</button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Round animated figure thumbnail for lists (same style everywhere). */
export function ExerciseAvatar({ name, className = "h-14 w-14" }: { id?: string; name: string; className?: string }) {
  const move = useMemo(() => moveFor(name), [name]);
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-full border border-white/10 bg-gradient-to-b from-blood/15 to-ink ${className}`} aria-label={name} role="img">
      <ExerciseFigure move={move} showGround={false} fit className="h-full w-full" />
    </div>
  );
}

export function ExerciseThumb({ name, className = "h-14 w-14" }: { name: string; className?: string }) {
  const move = useMemo(() => moveFor(name), [name]);
  return (
    <div className={`shrink-0 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-blood/10 to-ink ${className}`}>
      <ExerciseFigure move={move} showGround={false} fit className="h-full w-full" />
    </div>
  );
}
