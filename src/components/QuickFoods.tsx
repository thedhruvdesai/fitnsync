"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays } from "@/lib/report";
import type { LoggedMeal } from "@/lib/types";

export type FoodItem = Omit<LoggedMeal, "id" | "slot" | "source">;

/** A saved "My meal": several foods logged together. Stored in food_favorites with kind = "meal"; macros are per serving. */
export interface MyMeal extends FoodItem {
  kind: "meal";
  servings: number;
  ingredients: FoodItem[];
  method?: string[];
}
export const isMeal = (f: FoodItem): f is MyMeal => (f as MyMeal).kind === "meal";

const pickItem = (m: LoggedMeal): FoodItem => ({
  name: m.name,
  kcal: m.kcal,
  protein: m.protein,
  carbs: m.carbs,
  fat: m.fat,
  ...(m.fibre != null && { fibre: m.fibre }),
  ...(m.sugar != null && { sugar: m.sugar }),
  ...(m.sat_fat != null && { sat_fat: m.sat_fat }),
  ...(m.sodium != null && { sodium: m.sodium }),
});

/** Favourite foods stored in Supabase (table food_favorites). */
export function useFavorites(supabase: SupabaseClient) {
  const [favs, setFavs] = useState<FoodItem[]>([]);
  const [ready, setReady] = useState<boolean | "missing">(false);

  useEffect(() => {
    supabase
      .from("food_favorites")
      .select("item")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) return setReady("missing");
        setFavs((data ?? []).map((r) => r.item as FoodItem));
        setReady(true);
      });
  }, [supabase]);

  const isFav = useCallback((name: string) => favs.some((f) => f.name.toLowerCase() === name.toLowerCase()), [favs]);

  const toggle = useCallback(
    async (item: FoodItem) => {
      const { data: auth } = await supabase.auth.getSession();
      const userId = auth.session?.user.id;
      if (!userId) return;
      if (isFav(item.name)) {
        setFavs((f) => f.filter((x) => x.name.toLowerCase() !== item.name.toLowerCase()));
        await supabase.from("food_favorites").delete().eq("user_id", userId).eq("name", item.name);
      } else {
        setFavs((f) => [item, ...f]);
        const { error } = await supabase.from("food_favorites").upsert({ user_id: userId, name: item.name, item }, { onConflict: "user_id,name" });
        if (error) setReady("missing");
      }
    },
    [supabase, isFav]
  );

  const saveItem = useCallback(
    async (item: FoodItem, previousName?: string) => {
      const { data: auth } = await supabase.auth.getSession();
      const userId = auth.session?.user.id;
      if (!userId) return false;
      if (previousName && previousName !== item.name) await supabase.from("food_favorites").delete().eq("user_id", userId).eq("name", previousName);
      const { error } = await supabase.from("food_favorites").upsert({ user_id: userId, name: item.name, item }, { onConflict: "user_id,name" });
      if (error) {
        setReady("missing");
        return false;
      }
      setFavs((f) => [item, ...f.filter((x) => x.name !== item.name && x.name !== previousName)]);
      return true;
    },
    [supabase]
  );
  const removeItem = useCallback(
    async (name: string) => {
      const { data: auth } = await supabase.auth.getSession();
      const userId = auth.session?.user.id;
      if (!userId) return;
      setFavs((f) => f.filter((x) => x.name !== name));
      await supabase.from("food_favorites").delete().eq("user_id", userId).eq("name", name);
    },
    [supabase]
  );
  const foods = favs.filter((f) => !isMeal(f));
  const meals = favs.filter(isMeal);

  return { favs, foods, meals, isFav, toggle, ready, pickItem, saveItem, removeItem };
}

export function Star({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={on ? "Remove from favourites" : "Add to favourites"} className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-base transition active:scale-90 ${on ? "text-amber-300" : "text-bone-mute hover:text-amber-200"}`}>
      {on ? "★" : "☆"}
    </button>
  );
}

/** Recent foods, favourites and "copy yesterday". */
export function QuickFoods({
  supabase,
  date,
  onAdd,
  fav,
  onBuildMeal,
  onRecent,
}: {
  supabase: SupabaseClient;
  date: string;
  onAdd: (items: FoodItem[]) => void;
  fav: ReturnType<typeof useFavorites>;
  /** open the meal builder (new, or editing an existing meal) */
  onBuildMeal?: (meal?: MyMeal) => void;
  /** recent foods, for the meal builder's search */
  onRecent?: (items: FoodItem[]) => void;
}) {
  const [tab, setTab] = useState<"recent" | "fav" | "meals">("recent");
  const [recent, setRecent] = useState<(FoodItem & { times: number })[]>([]);
  const [yesterday, setYesterday] = useState<LoggedMeal[]>([]);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    supabase
      .from("daily_logs")
      .select("log_date, meals")
      .gte("log_date", addDays(date, -30))
      .lt("log_date", date)
      .order("log_date", { ascending: false })
      .then(({ data }) => {
        if (!live) return;
        const rows = (data ?? []) as { log_date: string; meals: LoggedMeal[] }[];
        const seen = new Map<string, FoodItem & { times: number }>();
        for (const r of rows)
          for (const m of r.meals ?? []) {
            const k = m.name.trim().toLowerCase();
            if (!k) continue;
            const prev = seen.get(k);
            if (prev) prev.times++;
            else seen.set(k, { ...pickItem(m), times: 1 });
          }
        setRecent([...seen.values()].slice(0, 20));
        onRecent?.([...seen.values()].slice(0, 60));
        setYesterday(rows.find((r) => r.log_date === addDays(date, -1))?.meals ?? []);
      });
    return () => {
      live = false;
    };
  }, [supabase, date]);

  const add = (items: FoodItem[], label: string) => {
    onAdd(items);
    setFlash(label);
    setTimeout(() => setFlash(null), 1600);
  };

  const list = tab === "recent" ? recent : tab === "fav" ? fav.foods : fav.meals;
  const yKcal = useMemo(() => yesterday.reduce((a, m) => a + (Number(m.kcal) || 0), 0), [yesterday]);

  return (
    <div className="space-y-3">
      {yesterday.length > 0 && (
        <button type="button" onClick={() => add(yesterday.map(pickItem), `Copied ${yesterday.length} items`)} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:border-white/25 active:scale-[0.99]">
          <span>
            <span className="block text-sm font-medium">↻ Copy yesterday&apos;s food</span>
            <span className="block text-xs text-bone-mute">{yesterday.length} item{yesterday.length > 1 ? "s" : ""} · {Math.round(yKcal)} kcal</span>
          </span>
          <span className="text-bone-mute">→</span>
        </button>
      )}

      <div className="flex items-center justify-between">
        <div className="flex rounded-full bg-white/5 p-1 text-xs">
          <button type="button" onClick={() => setTab("recent")} className={`rounded-full px-3 py-1.5 ${tab === "recent" ? "bg-bone text-ink" : "text-bone-dim"}`}>Recent</button>
          <button type="button" onClick={() => setTab("fav")} className={`rounded-full px-3 py-1.5 ${tab === "fav" ? "bg-bone text-ink" : "text-bone-dim"}`}>★ Favs{fav.foods.length ? ` · ${fav.foods.length}` : ""}</button>
          <button type="button" onClick={() => setTab("meals")} className={`rounded-full px-3 py-1.5 ${tab === "meals" ? "bg-bone text-ink" : "text-bone-dim"}`}>🍱 My meals{fav.meals.length ? ` · ${fav.meals.length}` : ""}</button>
        </div>
        {flash && <span className="text-xs text-emerald-300">✓ {flash}</span>}
      </div>

      {tab === "meals" && onBuildMeal && (
        <button type="button" onClick={() => onBuildMeal()} className="w-full rounded-xl border border-dashed border-blood/50 bg-blood/5 py-2.5 text-sm text-bone transition hover:bg-blood/10">＋ Create a meal</button>
      )}
      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-bone-mute">
          {tab === "recent"
            ? "Foods you log will show up here for one-tap re-logging."
            : tab === "meals"
              ? "Save meals you eat often (like your usual breakfast) and log them in one tap."
            : fav.ready === "missing"
              ? "Favourites need a one-time database update (supabase/quick-log-body.sql)."
              : "Tap ☆ on any food to save it as a favourite."}
        </p>
      ) : (
        <ul className="max-h-72 divide-y divide-white/5 overflow-y-auto rounded-xl border border-white/10">
          {list.map((f) => (
            <li key={f.name} className="flex items-center gap-1 py-1 pl-3 pr-1">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{f.name}</span>
                <span className="block text-[11px] text-bone-mute">
                  {f.kcal} kcal · {f.protein} g P{isMeal(f) ? ` · ${f.ingredients.length} items${f.servings > 1 ? ` · per serve (makes ${f.servings})` : ""}` : ""}{"times" in f && (f as { times: number }).times > 1 ? ` · logged ${(f as { times: number }).times}×` : ""}
                </span>
              </span>
              {isMeal(f) ? (
                <>
                  <button type="button" onClick={() => onBuildMeal?.(f)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm text-bone-mute hover:text-bone" aria-label={`Edit ${f.name}`}>✏️</button>
                  <button type="button" onClick={() => confirm(`Delete "${f.name}"?`) && fav.removeItem(f.name)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-bone-mute hover:text-blood-400" aria-label={`Delete ${f.name}`}>🗑</button>
                </>
              ) : (
                <Star on={fav.isFav(f.name)} onClick={() => fav.toggle(f)} />
              )}
              <button type="button" onClick={() => add([isMeal(f) ? { name: f.name, kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat, ...(f.fibre != null && { fibre: f.fibre }), ...(f.sugar != null && { sugar: f.sugar }), ...(f.sat_fat != null && { sat_fat: f.sat_fat }), ...(f.sodium != null && { sodium: f.sodium }) } : f], `Added ${f.name.split(" (")[0]}`)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blood text-lg text-white transition active:scale-90" aria-label={`Add ${f.name}`}>+</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
