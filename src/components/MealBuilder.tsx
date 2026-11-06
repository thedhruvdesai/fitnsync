"use client";
import { Portal } from "./Portal";
import { useEffect, useMemo, useState } from "react";
import { MEALS, QUICK_FOODS } from "@/lib/foods";
import type { FoodItem, MyMeal } from "./QuickFoods";

type Row = FoodItem & { key: string };
const key = () => Math.random().toString(36).slice(2, 9);
const r1 = (v: number) => Math.round(v * 10) / 10;
const NUM: (keyof FoodItem)[] = ["kcal", "protein", "carbs", "fat", "fibre", "sugar", "sat_fat", "sodium"];

/** Create or edit a "My meal": combine foods (from your list, recipes, AI or typed in), set servings, save. */
export function MealBuilder({
  initial,
  suggestions = [],
  onSave,
  onClose,
}: {
  initial?: Partial<MyMeal>;
  suggestions?: FoodItem[];
  onSave: (meal: MyMeal, previousName?: string) => Promise<boolean>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [servings, setServings] = useState(initial?.servings ?? 1);
  const [rows, setRows] = useState<Row[]>((initial?.ingredients ?? []).map((i) => ({ ...i, key: key() })));
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<"search" | "ai" | "manual">("search");
  const [aiText, setAiText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [manual, setManual] = useState({ name: "", kcal: "", protein: "", carbs: "", fat: "" });

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

  const pool = useMemo(() => {
    const seen = new Set<string>();
    const all: FoodItem[] = [
      ...suggestions,
      ...QUICK_FOODS.map((f) => ({ name: f.name, kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat })),
      ...MEALS.map((m) => ({ name: m.name, kcal: m.kcal, protein: m.protein, carbs: m.carbs, fat: m.fat })),
    ];
    return all.filter((f) => {
      const k = f.name.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [suggestions]);
  const results = useMemo(() => {
    const w = q.toLowerCase().split(/\s+/).filter(Boolean);
    return (w.length ? pool.filter((f) => w.every((x) => f.name.toLowerCase().includes(x))) : pool).slice(0, 30);
  }, [q, pool]);

  const add = (f: FoodItem) => setRows((r) => [...r, { ...f, key: key() }]);
  const total = rows.reduce((a, r) => {
    for (const k of NUM) (a as Record<string, number>)[k] = ((a as Record<string, number>)[k] ?? 0) + (Number(r[k]) || 0);
    return a;
  }, {} as Record<string, number>);
  const per = (k: string) => r1((total[k] ?? 0) / Math.max(1, servings));

  async function aiAdd() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/food/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: aiText }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Couldn't read that");
      for (const it of j.items ?? []) add({ name: it.portion ? `${it.name} (${it.portion})` : it.name, kcal: it.kcal, protein: it.protein, carbs: it.carbs, fat: it.fat, fibre: it.fibre, sugar: it.sugar, sat_fat: it.sat_fat, sodium: it.sodium });
      setAiText("");
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  }

  async function save() {
    if (!name.trim() || !rows.length) return;
    setBusy(true);
    const meal: MyMeal = {
      kind: "meal",
      name: name.trim().slice(0, 80),
      servings,
      ingredients: rows.map(({ key: _k, ...r }) => r),
      kcal: Math.round(per("kcal")),
      protein: Math.round(per("protein")),
      carbs: Math.round(per("carbs")),
      fat: Math.round(per("fat")),
      ...(total.fibre ? { fibre: Math.round(per("fibre")) } : {}),
      ...(total.sugar ? { sugar: Math.round(per("sugar")) } : {}),
      ...(total.sat_fat ? { sat_fat: Math.round(per("sat_fat")) } : {}),
      ...(total.sodium ? { sodium: Math.round(per("sodium")) } : {}),
      ...(initial?.method ? { method: initial.method } : {}),
    };
    const ok = await onSave(meal, initial?.kind === "meal" ? initial.name : undefined);
    setBusy(false);
    if (ok) onClose();
    else setErr("Couldn't save. Run supabase/quick-log-body.sql if you haven't yet.");
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label="Create a meal">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="sheet-in relative flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] bg-ink-2 md:rounded-[28px]">
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <h2 className="h-display text-2xl">{initial?.kind === "meal" ? "Edit meal" : "Create a meal"}</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-bone-dim" aria-label="Close">✕</button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-4">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input className="input" aria-label="Meal name" placeholder="Meal name, e.g. My usual breakfast" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="flex items-center rounded-xl border border-white/10 bg-ink-3 px-1 text-sm" title="How many servings this makes">
              <button className="px-2 py-2" onClick={() => setServings(Math.max(1, servings - 1))} aria-label="Fewer servings">−</button>
              <span className="w-14 text-center">{servings} serve{servings > 1 ? "s" : ""}</span>
              <button className="px-2 py-2" onClick={() => setServings(Math.min(20, servings + 1))} aria-label="More servings">+</button>
            </div>
          </div>

          {/* ingredients */}
          <div>
            <div className="label">Ingredients · {rows.length}</div>
            {rows.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-bone-mute">Add foods below. They&apos;ll be added up into one meal.</p>
            ) : (
              <ul className="divide-y divide-white/5 rounded-xl border border-white/10">
                {rows.map((r) => (
                  <li key={r.key} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">{r.name}</span>
                    <label className="flex items-center gap-1 text-xs text-bone-mute">
                      <input className="w-14 rounded-lg bg-ink-3 px-2 py-1 text-right text-bone outline-none" inputMode="numeric" aria-label={`${r.name} calories`} value={r.kcal} onChange={(e) => setRows((x) => x.map((y) => (y.key === r.key ? { ...y, kcal: Number(e.target.value) || 0 } : y)))} />
                      kcal
                    </label>
                    <button className="grid h-7 w-7 place-items-center text-bone-mute hover:text-blood-400" onClick={() => setRows((x) => x.filter((y) => y.key !== r.key))} aria-label={`Remove ${r.name}`}>✕</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* add */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
            <div className="flex rounded-full bg-white/5 p-1 text-xs">
              {([["search", "🔎 Find food"], ["ai", "✨ Describe"], ["manual", "✍️ Type it"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setMode(k)} className={`flex-1 rounded-full py-1.5 ${mode === k ? "bg-bone text-ink" : "text-bone-dim"}`}>{l}</button>
              ))}
            </div>
            {mode === "search" && (
              <>
                <input className="input mt-3 !py-2" aria-label="Search foods" placeholder="Search your foods and recipes" value={q} onChange={(e) => setQ(e.target.value)} />
                <ul className="mt-2 max-h-52 divide-y divide-white/5 overflow-y-auto">
                  {results.map((f) => (
                    <li key={f.name} className="flex items-center gap-2 py-1.5">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{f.name}</span>
                        <span className="block text-[11px] text-bone-mute">{f.kcal} kcal · {f.protein} g P</span>
                      </span>
                      <button className="grid h-8 w-8 place-items-center rounded-full bg-blood text-white" onClick={() => add(f)} aria-label={`Add ${f.name}`}>+</button>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {mode === "ai" && (
              <div className="mt-3 space-y-2">
                <textarea className="input min-h-[70px] text-sm" aria-label="Describe ingredients" placeholder="e.g. 60g oats, 1 banana, 1 scoop whey, 250ml milk" value={aiText} onChange={(e) => setAiText(e.target.value)} />
                <button className="btn-red w-full !py-2.5 text-sm" disabled={busy || !aiText.trim()} onClick={aiAdd}>{busy ? "Working it out…" : "Add these ingredients"}</button>
                <p className="text-[11px] text-bone-mute">Uses one AI scan. Check the numbers after.</p>
              </div>
            )}
            {mode === "manual" && (
              <form
                className="mt-3 grid grid-cols-4 gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!manual.name.trim()) return;
                  add({ name: manual.name.trim(), kcal: +manual.kcal || 0, protein: +manual.protein || 0, carbs: +manual.carbs || 0, fat: +manual.fat || 0 });
                  setManual({ name: "", kcal: "", protein: "", carbs: "", fat: "" });
                }}
              >
                <input className="input col-span-4 !py-2" aria-label="Ingredient name" placeholder="Ingredient, e.g. 2 eggs" value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} />
                {(["kcal", "protein", "carbs", "fat"] as const).map((k) => (
                  <input key={k} className="input !px-2 !py-2 text-sm" inputMode="decimal" aria-label={k} placeholder={k === "kcal" ? "kcal" : `${k[0].toUpperCase()} g`} value={manual[k]} onChange={(e) => setManual({ ...manual, [k]: e.target.value })} />
                ))}
                <button className="btn-ghost col-span-4 !py-2 text-sm">Add ingredient</button>
              </form>
            )}
            {err && <p className="mt-2 text-xs text-blood-400">{err}</p>}
          </div>
        </div>

        <div className="border-t border-white/5 bg-ink-2 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mb-3 flex items-baseline justify-between text-sm">
            <span className="text-bone-dim">Per serving</span>
            <span><strong className="text-lg">{Math.round(per("kcal"))}</strong> kcal · {Math.round(per("protein"))} g P · {Math.round(per("carbs"))} g C · {Math.round(per("fat"))} g F</span>
          </div>
          <button className="btn-red w-full !py-3" disabled={busy || !name.trim() || !rows.length} onClick={save}>{busy ? "Saving…" : "Save meal"}</button>
        </div>
      </div>
    </div>
    </Portal>
  );
}
