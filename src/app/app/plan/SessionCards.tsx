"use client";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExerciseThumb } from "@/components/ExerciseDemo";
import { ExercisePicker } from "@/components/ExercisePicker";
import { findExercise } from "@/lib/library";
import type { Session } from "@/lib/types";

const ExerciseSheet = dynamic(() => import("@/components/ExerciseSheet").then((m) => m.ExerciseSheet), { ssr: false });

/** Training program cards with animated thumbnails; tap any exercise for a demo. Editable: swap, add, remove, sets/reps. */
export function SessionCards({ sessions: initial, editable = false, homeOnly = false }: { sessions: Session[]; editable?: boolean; homeOnly?: boolean }) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initial);
  const [open, setOpen] = useState<{ s: number; i: number } | null>(null);
  const [editing, setEditing] = useState(false);
  const [picker, setPicker] = useState<{ s: number; i: number | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const changeEx = (s: number, i: number, patch: Partial<Session["exercises"][number]>) =>
    setSessions((list) => list.map((x, k) => (k === s ? { ...x, exercises: x.exercises.map((e, j) => (j === i ? { ...e, ...patch } : e)) } : x)));
  const removeEx = (s: number, i: number) => setSessions((list) => list.map((x, k) => (k === s ? { ...x, exercises: x.exercises.filter((_, j) => j !== i) } : x)));
  const moveEx = (s: number, i: number, dir: -1 | 1) =>
    setSessions((list) =>
      list.map((x, k) => {
        if (k !== s) return x;
        const ex = [...x.exercises];
        const j = i + dir;
        if (j < 0 || j >= ex.length) return x;
        [ex[i], ex[j]] = [ex[j], ex[i]];
        return { ...x, exercises: ex };
      })
    );

  async function save() {
    setSaving(true);
    setMsg(null);
    const r = await fetch("/api/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "training", sessions }) });
    setSaving(false);
    if (r.ok) {
      setEditing(false);
      setMsg("Workouts saved ✓");
      router.refresh();
    } else setMsg((await r.json().catch(() => ({}))).error || "Couldn't save");
  }

  return (
    <>
      {editable && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {editing ? (
            <>
              <button className="btn-red !py-2" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save changes"}</button>
              <button className="btn-ghost !py-2" onClick={() => { setSessions(initial); setEditing(false); }}>Cancel</button>
              <span className="text-xs text-bone-mute">Swap ⇄, reorder ↑↓, change sets and reps, or add exercises.</span>
            </>
          ) : (
            <button className="btn-ghost !py-2" onClick={() => { setEditing(true); setMsg(null); }}>✏️ Edit workouts</button>
          )}
          {msg && <span className="text-xs text-emerald-300">{msg}</span>}
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {sessions.map((s, si) => (
          <div key={si} className={`card min-w-0 ${editing ? "border-blood/30" : ""}`}>
            <div className="flex items-baseline justify-between">
              <h3 className="h-display text-xl">{s.day} · {s.title}</h3>
              <span className="text-xs text-bone-mute">~{s.minutes} min</span>
            </div>
            <p className="text-sm text-bone-dim">{s.focus}</p>
            <ul className="mt-3 space-y-1.5">
              {s.exercises.map((e, i) =>
                editing ? (
                  <li key={e.name + i} className="rounded-xl border border-white/10 bg-white/[0.02] p-2">
                    <div className="flex items-center gap-2">
                      <ExerciseThumb name={e.name} className="h-10 w-10" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{e.name}</span>
                      <button className="shrink-0 rounded-full border border-white/15 px-2.5 py-1 text-xs text-bone-dim hover:text-bone" onClick={() => setPicker({ s: si, i })} aria-label={`Swap ${e.name}`}>⇄ Swap</button>
                      <button className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-bone-mute hover:text-blood" onClick={() => removeEx(si, i)} aria-label={`Remove ${e.name}`}>✕</button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="text-bone-mute">Sets</span>
                        <span className="flex items-center rounded-lg bg-ink-3">
                          <button className="px-2 py-1" onClick={() => changeEx(si, i, { sets: Math.max(1, e.sets - 1) })} aria-label="Fewer sets">−</button>
                          <span className="w-4 text-center">{e.sets}</span>
                          <button className="px-2 py-1" onClick={() => changeEx(si, i, { sets: Math.min(10, e.sets + 1) })} aria-label="More sets">+</button>
                        </span>
                      </span>
                      <label className="flex items-center gap-1.5"><span className="text-bone-mute">Reps</span><input className="w-14 rounded-lg bg-ink-3 px-2 py-1 outline-none" value={e.reps} onChange={(ev) => changeEx(si, i, { reps: ev.target.value })} /></label>
                      <label className="flex items-center gap-1.5"><span className="text-bone-mute">Rest</span><input className="w-14 rounded-lg bg-ink-3 px-2 py-1 outline-none" value={e.rest} onChange={(ev) => changeEx(si, i, { rest: ev.target.value })} /></label>
                      <span className="ml-auto flex">
                        <button className="grid h-7 w-7 place-items-center rounded-full text-bone-mute hover:text-bone disabled:opacity-20" disabled={i === 0} onClick={() => moveEx(si, i, -1)} aria-label="Move up">↑</button>
                        <button className="grid h-7 w-7 place-items-center rounded-full text-bone-mute hover:text-bone disabled:opacity-20" disabled={i === s.exercises.length - 1} onClick={() => moveEx(si, i, 1)} aria-label="Move down">↓</button>
                      </span>
                    </div>
                  </li>
                ) : (
                  <li key={e.name + i}>
                    <button onClick={() => setOpen({ s: si, i })} className="group flex w-full items-center gap-3 rounded-xl p-1.5 text-left transition hover:bg-white/[0.04]">
                      <ExerciseThumb name={e.name} className="h-12 w-12" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{e.name}</span>
                        <span className="block text-xs text-bone-mute">{e.sets}×{e.reps} · rest {e.rest}</span>
                      </span>
                      <span className="text-bone-mute transition group-hover:translate-x-1 group-hover:text-blood">→</span>
                    </button>
                  </li>
                )
              )}
            </ul>
            {editing ? (
              <button onClick={() => setPicker({ s: si, i: null })} className="mt-3 w-full rounded-xl border border-dashed border-white/20 py-2 text-xs text-bone-dim hover:border-white/40">+ Add exercise</button>
            ) : (
              s.exercises.length > 0 && <button onClick={() => setOpen({ s: si, i: 0 })} className="btn-ghost mt-3 w-full !py-2 text-xs">▶ Preview this session</button>
            )}
          </div>
        ))}
      </div>

      {open && !editing && (
        <ExerciseSheet exercises={sessions[open.s].exercises} index={open.i} onIndex={(i) => setOpen({ s: open.s, i })} onClose={() => setOpen(null)} mode="view" />
      )}
      {picker && (
        <ExercisePicker
          title={picker.i == null ? `Add to ${sessions[picker.s].title}` : `Swap ${sessions[picker.s].exercises[picker.i].name}`}
          initialGroup={picker.i == null ? undefined : findExercise(sessions[picker.s].exercises[picker.i].name)?.group}
          homeOnly={homeOnly}
          exclude={sessions[picker.s].exercises.map((e) => e.name)}
          onClose={() => setPicker(null)}
          onPick={(lib) => {
            if (picker.i == null)
              setSessions((list) => list.map((x, k) => (k === picker.s ? { ...x, exercises: [...x.exercises, { name: lib.name, sets: 3, reps: lib.group === "Cardio" ? "10 min" : "8–12", rest: "90 s" }] } : x)));
            else changeEx(picker.s, picker.i, { name: lib.name });
            setPicker(null);
          }}
        />
      )}
    </>
  );
}
