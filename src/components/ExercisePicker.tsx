"use client";
import { Portal } from "./Portal";
import { useEffect, useMemo, useState } from "react";
import { ExerciseAvatar } from "./ExerciseDemo";
import { GROUPS, LIBRARY, type Group, type LibExercise } from "@/lib/library";

/** Searchable library picker used to swap or add exercises. */
export function ExercisePicker({
  title,
  initialGroup,
  homeOnly,
  exclude = [],
  onPick,
  onClose,
}: {
  title: string;
  initialGroup?: Group;
  homeOnly?: boolean;
  exclude?: string[];
  onPick: (e: LibExercise) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<Group | null>(initialGroup ?? null);
  const [home, setHome] = useState(!!homeOnly);

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

  const list = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const ex = new Set(exclude.map((x) => x.toLowerCase()));
    return LIBRARY.filter((e) => {
      if (ex.has(e.name.toLowerCase())) return false;
      if (group && e.group !== group) return false;
      if (home && e.where !== "both") return false;
      const hay = `${e.name} ${e.group} ${e.equipment} ${e.primary.join(" ")}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [q, group, home, exclude]);

  return (
    <Portal>
      <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="sheet-in relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] bg-ink-2 md:rounded-[28px]">
        <div className="space-y-3 border-b border-white/5 px-5 pb-3 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="h-display text-xl">{title}</h2>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-bone-dim" aria-label="Close">✕</button>
          </div>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exercise or muscle" className="input !py-2.5" />
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5">
            <button onClick={() => setHome(!home)} className={`shrink-0 rounded-full border px-3 py-1 text-xs ${home ? "border-amber-400 bg-amber-400/15 text-amber-200" : "border-white/10 text-bone-dim"}`}>🏠 Home-friendly</button>
            <button onClick={() => setGroup(null)} className={`shrink-0 rounded-full border px-3 py-1 text-xs ${group == null ? "border-blood bg-blood text-white" : "border-white/10 text-bone-dim"}`}>All</button>
            {GROUPS.map((g) => (
              <button key={g} onClick={() => setGroup(group === g ? null : g)} className={`shrink-0 rounded-full border px-3 py-1 text-xs ${group === g ? "border-blood bg-blood text-white" : "border-white/10 text-bone-dim"}`}>{g}</button>
            ))}
          </div>
        </div>
        <ul className="flex-1 divide-y divide-white/5 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
          {list.map((e) => (
            <li key={e.id}>
              <button onClick={() => onPick(e)} className="flex w-full items-center gap-3 px-5 py-2.5 text-left transition hover:bg-white/[0.03]">
                <ExerciseAvatar id={e.id} name={e.name} className="h-12 w-12" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{e.name}</span>
                  <span className="block text-xs text-bone-mute">{e.primary.join(", ")} · {e.equipment}</span>
                </span>
                <span className="rounded-full bg-blood px-3 py-1 text-xs text-white">Pick</span>
              </button>
            </li>
          ))}
          {list.length === 0 && <li className="p-8 text-center text-sm text-bone-mute">No match.</li>}
        </ul>
      </div>
    </div>
    </Portal>
  );
}
