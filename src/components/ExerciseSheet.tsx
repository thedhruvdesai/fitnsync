"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ExerciseFigure } from "./ExerciseFigure";
import { ExerciseAvatar, ExerciseDemo } from "./ExerciseDemo";
import { moveFor, repTarget, restSeconds } from "@/lib/exercises";
import { findExercise } from "@/lib/library";
import { stepsFor } from "@/lib/library-steps";
import type { Exercise } from "@/lib/types";

export interface SetRow {
  weight: string;
  reps: string;
  done: boolean;
}

function RestTimer({ seconds, onDone, next }: { seconds: number; onDone: () => void; next?: string }) {
  const [left, setLeft] = useState(seconds);
  const [total, setTotal] = useState(seconds);
  useEffect(() => {
    const id = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (left <= 0) {
      try {
        navigator.vibrate?.([180, 80, 180]);
      } catch {
        /* ignore */
      }
      onDone();
    }
  }, [left, onDone]);
  const r = 70;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, left) / total;
  const mm = Math.floor(Math.max(0, left) / 60);
  const ss = String(Math.max(0, left) % 60).padStart(2, "0");
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-[28px] bg-ink/95 backdrop-blur-xl">
      <p className="eyebrow">Rest</p>
      <div className="relative mt-4 h-44 w-44">
        <svg viewBox="0 0 160 160" className="h-44 w-44 -rotate-90">
          <circle cx="80" cy="80" r={r} stroke="#26262A" strokeWidth="8" fill="none" />
          <circle cx="80" cy="80" r={r} stroke="#E11D2E" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset 1s linear" }} />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="h-display text-5xl tabular-nums">{mm}:{ss}</span>
        </div>
      </div>
      {next && <p className="mt-4 text-sm text-bone-dim">Next: {next}</p>}
      <div className="mt-6 flex gap-3">
        <button className="chip" onClick={() => { setLeft((l) => l + 15); setTotal((t) => t + 15); }}>+15 s</button>
        <button className="btn-red !py-2" onClick={onDone}>Skip rest</button>
      </div>
    </div>
  );
}

/**
 * Exercise detail + guided workout. Shows an animated demo, form cues, a set tracker
 * and an automatic rest timer. In "view" mode it's a read-only preview.
 */
export function ExerciseSheet({
  exercises,
  index,
  onIndex,
  onClose,
  mode,
  done,
  onComplete,
  onUndo,
}: {
  exercises: Exercise[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  mode: "log" | "view";
  done?: Set<string>;
  onComplete?: (ex: Exercise, sets: SetRow[]) => void;
  onUndo?: (ex: Exercise) => void;
}) {
  const ex = exercises[index];
  const move = useMemo(() => moveFor(ex.name), [ex.name]);
  const lib = useMemo(() => findExercise(ex.name), [ex.name]);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [logs, setLogs] = useState<Record<string, SetRow[]>>({});
  const [resting, setResting] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  const rows: SetRow[] = logs[ex.name] ?? Array.from({ length: ex.sets }, () => ({ weight: "", reps: String(repTarget(ex.reps)), done: false }));
  const setRows = (r: SetRow[]) => setLogs((l) => ({ ...l, [ex.name]: r }));
  const isDone = done?.has(ex.name) ?? false;
  const completed = rows.filter((r) => r.done).length;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
    setResting(false);
  }, [index]);

  function tickSet(i: number) {
    const next = rows.map((r, k) => (k === i ? { ...r, done: !r.done } : r));
    setRows(next);
    const nowDone = next[i].done;
    const all = next.every((r) => r.done);
    if (nowDone && all) onComplete?.(ex, next);
    else if (nowDone) setResting(true);
    if (!nowDone && isDone) onUndo?.(ex);
  }

  const last = index === exercises.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={ex.name}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="sheet-in glow-border relative flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] bg-ink-2 md:rounded-[28px]">
        {/* header */}
        <div className="flex justify-center pt-3 md:hidden">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>
        <div className="flex items-center justify-between px-5 pt-1">
          <div className="text-[11px] uppercase tracking-[0.2em] text-bone-mute">
            {mode === "log" ? "Workout" : "Preview"} · Exercise {index + 1} of {exercises.length}
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-bone-dim hover:text-bone" aria-label="Close">✕</button>
        </div>
        <div className="mx-5 mt-3 flex gap-1">
          {exercises.map((e, i) => (
            <button key={e.name + i} onClick={() => onIndex(i)} aria-label={`Go to ${e.name}`} className={`h-1.5 flex-1 rounded-full transition ${done?.has(e.name) ? "bg-blood" : i === index ? "bg-bone" : "bg-white/15"}`} />
          ))}
        </div>

        <div ref={scroller} className="flex-1 overflow-y-auto px-5 pb-6">
          {/* demo */}
          {lib ? (
            <ExerciseDemo key={lib.id} ex={lib} className="mt-4" />
          ) : (
          <div className="relative mt-4 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-blood/10 to-ink">
            <div aria-hidden className="h-display text-outline pointer-events-none absolute inset-x-0 top-2 select-none text-center text-[64px] uppercase leading-none opacity-20">{move.title.split(" ")[0]}</div>
            <ExerciseFigure key={ex.name} move={move} speed={speed} playing={playing} className="relative mx-auto h-60 w-full max-w-sm md:h-72" />
            <div className="relative flex items-center justify-between border-t border-white/5 px-3 py-2.5">
              <button onClick={() => setPlaying((p) => !p)} className="grid h-10 w-10 place-items-center rounded-full bg-ink/80 text-sm backdrop-blur" aria-label={playing ? "Pause" : "Play"}>
                {playing ? "❚❚" : "▶"}
              </button>
              <div className="flex gap-1 rounded-full bg-ink/80 p-1 backdrop-blur">
                {[0.5, 1, 1.5].map((s) => (
                  <button key={s} onClick={() => setSpeed(s)} className={`rounded-full px-3 py-1 text-xs transition ${speed === s ? "bg-blood text-white" : "text-bone-dim"}`}>
                    {s}×
                  </button>
                ))}
              </div>
            </div>
          </div>
          )}

          {/* title */}
          <div className="mt-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="h-display text-3xl leading-tight">{ex.name}</h2>
              <p className="mt-1 text-sm text-bone-dim">
                {ex.sets} sets × {ex.reps} reps · rest {ex.rest}
              </p>
            </div>
            {isDone && <span className="rounded-full bg-blood px-3 py-1 text-xs font-semibold text-white">✓ Done</span>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(lib ? [...lib.primary, ...lib.secondary.slice(0, 3), lib.equipment] : move.muscles).map((m, i) => (
              <span key={m} className={`rounded-full border px-3 py-1 text-xs ${i === 0 ? "border-blood/60 bg-blood/15 text-bone" : "border-white/10 text-bone-dim"}`}>{m}</span>
            ))}
          </div>

          {/* set tracker */}
          {mode === "log" && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="label !mb-0">Your sets</h3>
                <span className="text-xs text-bone-mute">{completed}/{rows.length} done</span>
              </div>
              <div className="mt-2 space-y-2">
                {rows.map((r, i) => (
                  <div key={i} className={`flex items-center gap-2 rounded-2xl border p-2 pl-4 transition ${r.done ? "border-blood/50 bg-blood/10" : "border-white/10 bg-ink-3"}`}>
                    <span className="w-12 text-sm text-bone-dim">Set {i + 1}</span>
                    <label className="flex flex-1 items-center gap-1 rounded-xl bg-ink px-3 py-2">
                      <input inputMode="decimal" placeholder="—" value={r.weight} onChange={(e) => setRows(rows.map((x, k) => (k === i ? { ...x, weight: e.target.value } : x)))} className="w-full bg-transparent text-center outline-none" aria-label={`Set ${i + 1} weight`} />
                      <span className="text-[10px] text-bone-mute">kg</span>
                    </label>
                    <label className="flex flex-1 items-center gap-1 rounded-xl bg-ink px-3 py-2">
                      <input inputMode="numeric" value={r.reps} onChange={(e) => setRows(rows.map((x, k) => (k === i ? { ...x, reps: e.target.value } : x)))} className="w-full bg-transparent text-center outline-none" aria-label={`Set ${i + 1} reps`} />
                      <span className="text-[10px] text-bone-mute">reps</span>
                    </label>
                    <button onClick={() => tickSet(i)} aria-label={`Complete set ${i + 1}`} className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border text-lg transition active:scale-90 ${r.done ? "border-blood bg-blood text-white" : "border-white/20 text-bone-mute hover:border-blood"}`}>
                      ✓
                    </button>
                  </div>
                ))}
              </div>
              {!isDone && (
                <button className="mt-3 text-xs text-bone-mute underline underline-offset-4 hover:text-bone" onClick={() => onComplete?.(ex, rows.map((r) => ({ ...r, done: true })))}>
                  Mark exercise as done
                </button>
              )}
            </div>
          )}

          {/* how to */}
          <div className="mt-6 grid gap-4 md:grid-cols-[1.4fr_1fr]">
            <div>
              <h3 className="label">Step by step</h3>
              <ol className="space-y-2.5">
                {(lib ? stepsFor(lib.id) : move.cues).map((c, i) => (
                  <li key={c} className="flex gap-3 text-sm text-bone-dim">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blood/20 text-xs font-semibold text-blood-400">{i + 1}</span>
                    <span className="pt-0.5">{c}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="space-y-3">
            {lib && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <h3 className="label">Coach cues</h3>
                <ul className="space-y-1.5 text-sm text-bone-dim">
                  {move.cues.map((c) => <li key={c}>• {c}</li>)}
                </ul>
              </div>
            )}
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
              <h3 className="label !text-amber-300">Avoid</h3>
              <p className="text-sm text-bone-dim">{move.mistake}</p>
              <p className="mt-3 text-[11px] text-bone-mute">Stop if you feel sharp pain. Swap the exercise and check with a physio if it persists.</p>
            </div>
            {lib && (
              <Link href={`/app/exercises/${lib.id}`} className="btn-ghost w-full !py-2.5 text-xs">📈 Your history &amp; PRs</Link>
            )}
            </div>
          </div>
        </div>

        {/* footer nav */}
        <div className="flex gap-3 border-t border-white/5 bg-ink-2/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button className="btn-ghost !py-3" disabled={index === 0} onClick={() => onIndex(index - 1)}>←</button>
          {last ? (
            <button className="btn-red flex-1 !py-3" onClick={onClose}>{mode === "log" ? "Finish workout" : "Done"}</button>
          ) : (
            <button className="btn-red flex-1 !py-3" onClick={() => onIndex(index + 1)}>
              Next: {exercises[index + 1].name}
            </button>
          )}
        </div>

        {resting && <RestTimer seconds={restSeconds(ex.rest)} onDone={() => setResting(false)} next={completed < rows.length ? `Set ${completed + 1} of ${ex.name}` : exercises[index + 1]?.name} />}
      </div>
    </div>
  );
}

export { ExerciseThumb } from "./ExerciseDemo";
