"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ExerciseAvatar } from "@/components/ExerciseDemo";
import { EQUIPMENT, GROUPS, LIBRARY, type Group } from "@/lib/library";

const WHERE = [
  { k: "all", label: "All" },
  { k: "gym", label: "Gym" },
  { k: "home", label: "Home" },
] as const;

export function ExerciseBrowser({ initialGroup, initialQuery }: { initialGroup?: string; initialQuery?: string }) {
  const [q, setQ] = useState(initialQuery ?? "");
  const [group, setGroup] = useState<Group | null>(GROUPS.includes(initialGroup as Group) ? (initialGroup as Group) : null);
  const [equip, setEquip] = useState<string>("all");
  const [where, setWhere] = useState<(typeof WHERE)[number]["k"]>("all");

  const list = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return LIBRARY.filter((e) => {
      if (group && e.group !== group) return false;
      if (equip !== "all" && e.equipment !== equip) return false;
      if (where === "home" && e.where !== "both") return false;
      const hay = `${e.name} ${e.group} ${e.equipment} ${e.primary.join(" ")} ${e.secondary.join(" ")}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [q, group, equip, where]);

  return (
    <div>
      <div className="sticky top-[60px] z-10 -mx-5 space-y-3 bg-ink/90 px-5 pb-3 pt-1 backdrop-blur md:top-0 md:mx-0 md:px-0">
        <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-ink-3 px-4 py-3">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-bone-mute" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exercise or muscle" className="w-full bg-transparent outline-none placeholder:text-bone-mute" aria-label="Search exercises" />
          {q && <button onClick={() => setQ("")} className="text-bone-mute" aria-label="Clear search">✕</button>}
        </label>
        <div className="flex gap-2">
          <select value={equip} onChange={(e) => setEquip(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-ink-3 px-3 py-2 text-sm" aria-label="Equipment">
            <option value="all">All equipment</option>
            {EQUIPMENT.map((x) => <option key={x}>{x}</option>)}
          </select>
          <div className="flex rounded-xl border border-white/10 bg-ink-3 p-1 text-sm">
            {WHERE.map((w) => (
              <button key={w.k} onClick={() => setWhere(w.k)} className={`rounded-lg px-3 py-1 transition ${where === w.k ? "bg-blood text-white" : "text-bone-dim"}`}>{w.label}</button>
            ))}
          </div>
        </div>
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0">
          <button onClick={() => setGroup(null)} className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${group == null ? "border-blood bg-blood text-white" : "border-white/10 text-bone-dim"}`}>All</button>
          {GROUPS.map((g) => (
            <button key={g} onClick={() => setGroup(group === g ? null : g)} className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${group === g ? "border-blood bg-blood text-white" : "border-white/10 text-bone-dim"}`}>{g}</button>
          ))}
        </div>
      </div>

      <p className="mb-2 mt-2 text-xs text-bone-mute">{list.length} exercises</p>
      <ul className="divide-y divide-white/5 overflow-hidden rounded-3xl border border-white/10 bg-ink-2">
        {list.map((e) => (
          <li key={e.id}>
            <Link href={`/app/exercises/${e.id}`} className="group flex items-center gap-4 px-4 py-3 transition hover:bg-white/[0.03]">
              <ExerciseAvatar id={e.id} name={e.name} className="h-16 w-16" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{e.name}</span>
                <span className="block text-xs text-bone-mute">{e.primary.join(", ")} · {e.equipment}{e.where === "both" ? " · Home OK" : ""}</span>
              </span>
              <span className="text-bone-mute transition group-hover:translate-x-1 group-hover:text-blood-400">›</span>
            </Link>
          </li>
        ))}
        {list.length === 0 && <li className="p-8 text-center text-sm text-bone-mute">No match. Try a muscle like “glutes” or a tool like “dumbbell”.</li>}
      </ul>
      <p className="mt-4 text-[11px] text-bone-mute">Exercise photos and instructions: free-exercise-db (public domain).</p>
    </div>
  );
}
