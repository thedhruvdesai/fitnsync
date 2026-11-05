"use client";
import { useState } from "react";
import { ExerciseSheet, ExerciseThumb } from "@/components/ExerciseSheet";
import type { Session } from "@/lib/types";

/** Training program cards with animated thumbnails; tap any exercise for a demo. */
export function SessionCards({ sessions }: { sessions: Session[] }) {
  const [open, setOpen] = useState<{ s: number; i: number } | null>(null);
  return (
    <>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {sessions.map((s, si) => (
          <div key={si} className="card">
            <div className="flex items-baseline justify-between">
              <h3 className="h-display text-xl">{s.day} · {s.title}</h3>
              <span className="text-xs text-bone-mute">~{s.minutes} min</span>
            </div>
            <p className="text-sm text-bone-dim">{s.focus}</p>
            <ul className="mt-3 space-y-1.5">
              {s.exercises.map((e, i) => (
                <li key={e.name}>
                  <button onClick={() => setOpen({ s: si, i })} className="group flex w-full items-center gap-3 rounded-xl p-1.5 text-left transition hover:bg-white/[0.04]">
                    <ExerciseThumb name={e.name} className="h-12 w-12" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{e.name}</span>
                      <span className="block text-xs text-bone-mute">{e.sets}×{e.reps} · rest {e.rest}</span>
                    </span>
                    <span className="text-bone-mute transition group-hover:translate-x-1 group-hover:text-blood">→</span>
                  </button>
                </li>
              ))}
            </ul>
            <button onClick={() => setOpen({ s: si, i: 0 })} className="btn-ghost mt-3 w-full !py-2 text-xs">▶ Preview this session</button>
          </div>
        ))}
      </div>
      {open && (
        <ExerciseSheet exercises={sessions[open.s].exercises} index={open.i} onIndex={(i) => setOpen({ s: open.s, i })} onClose={() => setOpen(null)} mode="view" />
      )}
    </>
  );
}
