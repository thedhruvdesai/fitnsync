"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MEALS, type DietTag, type MealTemplate } from "@/lib/foods";
import { methodFor } from "@/lib/recipes";
import { addMealsToDay, slotNow } from "@/lib/dayLog";
import { useFavorites, type MyMeal } from "@/components/QuickFoods";
import type { Diet } from "@/lib/types";

type TabKey = "all" | "veg" | "vegan" | "egg" | "nonveg" | "meat" | "seafood" | "protein" | "quick" | "indian";
const INDIAN = /dal|paneer|roti|masala|chana|chole|rajma|tikka|idli|sambar|poha|khichdi|chilla|kulcha|bhurji|keema|tandoori|rogan|biryani|palak|soya chunk|goan|butter chicken|jeera|thali/i;

const TABS: Record<TabKey, { label: string; test: (m: MealTemplate) => boolean }> = {
  all: { label: "All", test: () => true },
  veg: { label: "Vegetarian", test: (m) => m.tag === "veg" || m.tag === "vegan" },
  vegan: { label: "Vegan", test: (m) => m.tag === "vegan" },
  egg: { label: "Eggs", test: (m) => m.tag === "egg" },
  nonveg: { label: "Non-veg", test: (m) => m.tag === "egg" || m.tag === "fish" || m.tag === "meat" },
  meat: { label: "Chicken & meat", test: (m) => m.tag === "meat" },
  seafood: { label: "Seafood", test: (m) => m.tag === "fish" },
  protein: { label: "High protein", test: (m) => m.protein >= 30 || (m.protein * 4) / m.kcal >= 0.3 },
  quick: { label: "Quick ≤15 min", test: (m) => (methodFor(m.name)?.mins ?? 99) <= 15 },
  indian: { label: "Indian", test: (m) => INDIAN.test(m.name) },
};
const ALL_KEYS = Object.keys(TABS) as TabKey[];

const DEFAULT_TABS: Record<Diet, TabKey[]> = {
  vegan: ["vegan", "protein", "quick", "indian"],
  vegetarian: ["veg", "vegan", "protein", "quick", "indian"],
  eggetarian: ["veg", "egg", "vegan", "protein", "quick", "indian"],
  pescatarian: ["all", "veg", "seafood", "vegan", "protein", "quick"],
  non_veg: ["all", "veg", "vegan", "nonveg", "meat", "seafood", "protein", "quick", "indian"],
};

export const DIET_BADGE: Record<DietTag, { label: string; dot: string }> = {
  vegan: { label: "Vegan", dot: "bg-emerald-400" },
  veg: { label: "Vegetarian", dot: "bg-green-500" },
  egg: { label: "Contains egg", dot: "bg-amber-400" },
  fish: { label: "Seafood", dot: "bg-sky-400" },
  meat: { label: "Meat", dot: "bg-red-500" },
};

const SLOTS = ["breakfast", "lunch", "dinner", "snack"] as const;
const KEY = "fs_recipe_tabs";

export function RecipesView({ diet, userId, today, open, initialTab }: { diet: Diet; userId: string; today: string; open?: string; initialTab?: string }) {
  const supabase = useMemo(() => createClient(), []);
  const fav = useFavorites(supabase);
  const [tabs, setTabs] = useState<TabKey[]>(DEFAULT_TABS[diet] ?? DEFAULT_TABS.non_veg);
  const [tab, setTab] = useState<TabKey>((ALL_KEYS.includes(initialTab as TabKey) ? initialTab : (DEFAULT_TABS[diet] ?? ["all"])[0]) as TabKey);
  const [slot, setSlot] = useState<(typeof SLOTS)[number] | null>(null);
  const [sort, setSort] = useState<"rec" | "protein" | "light" | "quick">("rec");
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState(false);
  const [detail, setDetail] = useState<MealTemplate | null>(() => MEALS.find((m) => m.name === open) ?? null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (Array.isArray(saved) && saved.length && saved.every((k) => ALL_KEYS.includes(k))) {
        setTabs(saved);
        if (!saved.includes(tab) && !initialTab) setTab(saved[0]);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const saveTabs = (t: TabKey[]) => {
    setTabs(t);
    try {
      localStorage.setItem(KEY, JSON.stringify(t));
    } catch {
      /* ignore */
    }
    if (!t.includes(tab) && t.length) setTab(t[0]);
  };

  const list = useMemo(() => {
    const w = q.toLowerCase().split(/\s+/).filter(Boolean);
    const out = MEALS.filter((m) => TABS[tab].test(m) && (!slot || m.slot === slot) && w.every((x) => `${m.name} ${m.items.join(" ")} ${m.keywords.join(" ")}`.toLowerCase().includes(x)));
    const mins = (m: MealTemplate) => methodFor(m.name)?.mins ?? 99;
    if (sort === "protein") out.sort((a, b) => b.protein / b.kcal - a.protein / a.kcal);
    if (sort === "light") out.sort((a, b) => a.kcal - b.kcal);
    if (sort === "quick") out.sort((a, b) => mins(a) - mins(b));
    return out;
  }, [tab, slot, sort, q]);

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Recipes</p>
        <h1 className="h-display mt-1 text-4xl md:text-5xl">Eat well, any way you eat</h1>
        <p className="mt-2 max-w-xl text-sm text-bone-dim">{MEALS.length} coach-built meals with macros and simple methods. Log one in a tap or save it to My meals.</p>
      </div>

      {/* tabs */}
      <div className="flex items-center gap-2">
        <div className="-mx-5 flex flex-1 gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0" role="tablist" aria-label="Recipe categories">
          {tabs.map((k) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${tab === k ? "border-blood bg-blood text-white" : "border-white/10 text-bone-dim hover:border-white/30"}`}>
              {TABS[k].label}
            </button>
          ))}
        </div>
        <button onClick={() => setEdit(true)} className="shrink-0 rounded-full border border-white/10 px-3 py-2 text-sm text-bone-dim hover:text-bone" aria-label="Customise tabs">⚙ Customise</button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input className="input !w-auto min-w-0 flex-1 !py-2" aria-label="Search recipes" placeholder="Search: paneer, chicken, oats…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded-xl border border-white/10 bg-ink-3 px-3 py-2 text-sm" aria-label="Sort recipes">
          <option value="rec">Recommended</option>
          <option value="protein">Most protein per calorie</option>
          <option value="light">Lowest calories</option>
          <option value="quick">Quickest</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setSlot(null)} className={`rounded-full px-3 py-1 text-xs ${slot == null ? "bg-bone text-ink" : "bg-white/5 text-bone-dim"}`}>Any meal</button>
        {SLOTS.map((s) => (
          <button key={s} onClick={() => setSlot(slot === s ? null : s)} className={`rounded-full px-3 py-1 text-xs capitalize ${slot === s ? "bg-bone text-ink" : "bg-white/5 text-bone-dim"}`}>{s}</button>
        ))}
      </div>

      <p className="text-xs text-bone-mute">{list.length} recipe{list.length === 1 ? "" : "s"}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((m) => {
          const meth = methodFor(m.name);
          const b = DIET_BADGE[m.tag];
          return (
            <button key={m.name} onClick={() => setDetail(m)} className="card group !p-4 text-left transition hover:border-white/25">
              <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-widest text-bone-mute">
                <span className="flex items-center gap-1.5"><span className={`inline-block h-2.5 w-2.5 rounded-sm ${b.dot}`} aria-hidden />{b.label} · {m.slot}</span>
                {meth && <span>⏱ {meth.mins} min</span>}
              </div>
              <h3 className="mt-2 text-lg font-semibold leading-snug">{m.name}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-bone-mute">{m.items.join(" · ")}</p>
              <div className="mt-3 flex items-end justify-between">
                <span className="h-display text-2xl">{m.kcal}<span className="ml-1 text-xs font-normal text-bone-dim">kcal</span></span>
                <span className="text-xs text-bone-dim">{m.protein} g P · {m.carbs} g C · {m.fat} g F</span>
              </div>
            </button>
          );
        })}
        {list.length === 0 && <p className="col-span-full rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-bone-mute">No recipes match. Try another tab or search.</p>}
      </div>

      {edit && <TabEditor tabs={tabs} onSave={saveTabs} onReset={() => saveTabs(DEFAULT_TABS[diet] ?? DEFAULT_TABS.non_veg)} onClose={() => setEdit(false)} />}
      {detail && <RecipeSheet meal={detail} onClose={() => setDetail(null)} supabase={supabase} userId={userId} today={today} fav={fav} />}
    </div>
  );
}

function TabEditor({ tabs, onSave, onReset, onClose }: { tabs: TabKey[]; onSave: (t: TabKey[]) => void; onReset: () => void; onClose: () => void }) {
  const [sel, setSel] = useState<TabKey[]>(tabs);
  const move = (k: TabKey, d: -1 | 1) => {
    const i = sel.indexOf(k);
    const j = i + d;
    if (i < 0 || j < 0 || j >= sel.length) return;
    const n = [...sel];
    [n[i], n[j]] = [n[j], n[i]];
    setSel(n);
  };
  const ordered = [...sel, ...ALL_KEYS.filter((k) => !sel.includes(k))];
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label="Customise recipe tabs">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="sheet-in relative w-full max-w-md rounded-t-[28px] bg-ink-2 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:rounded-[28px]">
        <h2 className="h-display text-2xl">Your recipe tabs</h2>
        <p className="mt-1 text-sm text-bone-dim">Tick the tabs you want and use ↑↓ to set the order.</p>
        <ul className="mt-4 divide-y divide-white/5 rounded-2xl border border-white/10">
          {ordered.map((k) => {
            const on = sel.includes(k);
            return (
              <li key={k} className="flex items-center gap-3 px-3 py-2">
                <input type="checkbox" className="h-4 w-4 accent-[#E11D2E]" checked={on} aria-label={`Show ${TABS[k].label}`} onChange={(e) => setSel(e.target.checked ? [...sel, k] : sel.filter((x) => x !== k))} />
                <span className={`flex-1 text-sm ${on ? "" : "text-bone-mute"}`}>{TABS[k].label}</span>
                {on && (
                  <>
                    <button className="grid h-7 w-7 place-items-center text-bone-dim disabled:opacity-20" disabled={sel.indexOf(k) === 0} onClick={() => move(k, -1)} aria-label={`Move ${TABS[k].label} up`}>↑</button>
                    <button className="grid h-7 w-7 place-items-center text-bone-dim disabled:opacity-20" disabled={sel.indexOf(k) === sel.length - 1} onClick={() => move(k, 1)} aria-label={`Move ${TABS[k].label} down`}>↓</button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex gap-2">
          <button className="btn-ghost !py-2.5 text-sm" onClick={() => { onReset(); onClose(); }}>Reset</button>
          <button className="btn-red flex-1 !py-2.5" disabled={!sel.length} onClick={() => { onSave(sel); onClose(); }}>Save tabs</button>
        </div>
      </div>
    </div>
  );
}

function RecipeSheet({ meal, onClose, supabase, userId, today, fav }: { meal: MealTemplate; onClose: () => void; supabase: ReturnType<typeof createClient>; userId: string; today: string; fav: ReturnType<typeof useFavorites> }) {
  const meth = methodFor(meal.name);
  const b = DIET_BADGE[meal.tag];
  const [slot, setSlot] = useState<(typeof SLOTS)[number]>(meal.slot === "snack" ? "snack" : slotNow() === "snack" ? meal.slot : slotNow());
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const saved = fav.meals.some((m) => m.name === meal.name);

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

  async function log() {
    setBusy(true);
    try {
      await addMealsToDay(supabase, userId, today, [{ name: meal.name, slot, source: "recipe", kcal: meal.kcal, protein: meal.protein, carbs: meal.carbs, fat: meal.fat }]);
      setMsg(`✓ Logged to today's ${slot}`);
    } catch (e) {
      setMsg(`Couldn't log: ${(e as Error).message}`);
    }
    setBusy(false);
  }
  async function save() {
    const item: MyMeal = { kind: "meal", name: meal.name, servings: 1, kcal: meal.kcal, protein: meal.protein, carbs: meal.carbs, fat: meal.fat, ingredients: [{ name: meal.name, kcal: meal.kcal, protein: meal.protein, carbs: meal.carbs, fat: meal.fat }], method: meth?.steps };
    const ok = await fav.saveItem(item);
    setMsg(ok ? "★ Saved to My meals" : "Couldn't save to My meals");
  }

  const macroK = meal.protein * 4 + meal.carbs * 4 + meal.fat * 9 || 1;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={meal.name}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="sheet-in relative flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] bg-ink-2 md:rounded-[28px]">
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-bone-mute"><span className={`inline-block h-2.5 w-2.5 rounded-sm ${b.dot}`} aria-hidden />{b.label} · {meal.slot}{meth ? ` · ⏱ ${meth.mins} min` : ""}</div>
            <h2 className="h-display mt-1 text-3xl leading-tight">{meal.name}</h2>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-bone-dim" aria-label="Close">✕</button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div className="rounded-2xl border border-white/10 bg-ink p-4">
            <div className="flex items-end justify-between">
              <span className="h-display text-4xl">{meal.kcal}<span className="ml-1 text-sm font-normal text-bone-dim">kcal / serve</span></span>
            </div>
            <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-white/10">
              <div className="bg-blood" style={{ width: `${(meal.protein * 400) / macroK}%` }} />
              <div className="bg-amber-400" style={{ width: `${(meal.carbs * 400) / macroK}%` }} />
              <div className="bg-sky-400" style={{ width: `${(meal.fat * 900) / macroK}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs">
              <span><span className="text-blood-400">●</span> Protein {meal.protein} g</span>
              <span><span className="text-amber-400">●</span> Carbs {meal.carbs} g</span>
              <span><span className="text-sky-400">●</span> Fat {meal.fat} g</span>
            </div>
          </div>
          <section>
            <h3 className="label">Ingredients (1 serve)</h3>
            <ul className="space-y-1.5 text-sm text-bone-dim">{meal.items.map((i) => <li key={i} className="flex gap-2"><span className="text-blood-400">•</span>{i}</li>)}</ul>
          </section>
          {meth && (
            <section>
              <h3 className="label">Method</h3>
              <ol className="space-y-2.5">
                {meth.steps.map((st, i) => (
                  <li key={i} className="flex gap-3 text-sm text-bone-dim">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blood/20 text-xs font-semibold text-blood-400">{i + 1}</span>
                    <span className="pt-0.5">{st}</span>
                  </li>
                ))}
              </ol>
              {meth.tip && <p className="mt-3 rounded-xl bg-white/[0.04] p-3 text-xs text-bone-dim">💡 {meth.tip}</p>}
            </section>
          )}
        </div>
        <div className="space-y-2 border-t border-white/5 bg-ink-2 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="grid grid-cols-4 gap-1.5">
            {SLOTS.map((s) => (
              <button key={s} onClick={() => setSlot(s)} className={`rounded-xl py-2 text-xs capitalize ${slot === s ? "bg-bone text-ink" : "bg-white/5 text-bone-dim"}`}>{s}</button>
            ))}
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button className="btn-red !py-3" disabled={busy} onClick={log}>{busy ? "Logging…" : "✓ Log to today"}</button>
            <button className="btn-ghost !py-3 text-sm" disabled={saved} onClick={save}>{saved ? "★ Saved" : "☆ My meals"}</button>
          </div>
          {msg && <p className="text-center text-xs text-emerald-300" role="status">{msg}</p>}
        </div>
      </div>
    </div>
  );
}
