"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Plan } from "@/lib/types";
import { kgTo, useUnits } from "@/lib/units";

interface Adj {
  status: "not_enough_data" | "on_track" | "adjust" | "recently_adjusted";
  actualPerWeek?: number;
  targetPerWeek: number;
  delta?: number;
  newKcal?: number;
  kcal: number;
  message: string;
}

const SNOOZE = "fs_adjust_snooze";

/** Weekly calorie check: shows only when the weight trend says the target should change. */
export function AdaptiveCard({ onApplied, always = false }: { onApplied?: (plan: Plan) => void; always?: boolean }) {
  const [adj, setAdj] = useState<Adj | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [u] = useUnits();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/plan")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j) return;
        setAdj(j);
        try {
          if (!always && j.newKcal && localStorage.getItem(SNOOZE) === String(j.newKcal)) setHidden(true);
        } catch {
          /* ignore */
        }
      })
      .catch(() => {});
  }, [always]);

  if (!adj || hidden) return null;
  if (!always && adj.status !== "adjust" && !done) return null;

  const rate = (v?: number) => (v == null ? "—" : `${v > 0 ? "+" : ""}${kgTo(v, u.w)} ${u.w}/wk`);

  async function apply() {
    setBusy(true);
    const r = await fetch("/api/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "adjust" }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) {
      setDone(`New target: ${j.plan.targets.kcal.toLocaleString()} kcal a day. We'll check again next week.`);
      onApplied?.(j.plan);
      router.refresh();
    } else setDone(j.error || "Couldn't update your plan");
  }

  return (
    <section className="card relative overflow-hidden">
      <div className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full bg-emerald-400/10 blur-3xl" />
      <p className="eyebrow">Weekly check-in</p>
      <h2 className="h-display mt-1 text-2xl">
        {adj.status === "adjust" ? (adj.delta! < 0 ? "Time to trim calories" : "Time to eat a bit more") : adj.status === "on_track" ? "Right on track ✓" : adj.status === "recently_adjusted" ? "Recently adjusted" : "Keep weighing in"}
      </h2>
      {adj.actualPerWeek != null && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-white/[0.04] p-3"><div className="text-xs text-bone-mute">Your trend</div><div className="font-semibold">{rate(adj.actualPerWeek)}</div></div>
          <div className="rounded-xl bg-white/[0.04] p-3"><div className="text-xs text-bone-mute">Plan target</div><div className="font-semibold">{rate(adj.targetPerWeek)}</div></div>
        </div>
      )}
      <p className="mt-3 text-sm text-bone-dim">{done ?? adj.message}</p>
      {adj.status === "adjust" && !done && (
        <>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-bone-mute line-through">{adj.kcal.toLocaleString()}</span>
            <span className="text-bone-mute">→</span>
            <span className="h-display text-3xl">{adj.newKcal!.toLocaleString()}</span>
            <span className="text-sm text-bone-dim">kcal / day</span>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="btn-red flex-1 !py-2.5" disabled={busy} onClick={apply}>{busy ? "Updating…" : "Apply to my plan"}</button>
            <button
              className="btn-ghost !py-2.5"
              onClick={() => {
                try {
                  localStorage.setItem(SNOOZE, String(adj.newKcal));
                } catch {
                  /* ignore */
                }
                setHidden(true);
              }}
            >
              Not now
            </button>
          </div>
          <p className="mt-2 text-[11px] text-bone-mute">Changes come from carbs; protein stays the same. Never below your BMR.</p>
        </>
      )}
    </section>
  );
}
