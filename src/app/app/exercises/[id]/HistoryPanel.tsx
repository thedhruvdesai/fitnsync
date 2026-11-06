"use client";
import { useState } from "react";
import { LineChart } from "@/components/Charts";
import type { SessionStat } from "@/lib/library";
import { kgTo, useUnits } from "@/lib/units";

const TABS = [
  { k: "heaviest", label: "Heaviest weight", unit: "w" },
  { k: "oneRm", label: "One rep max", unit: "w" },
  { k: "volume", label: "Best volume", unit: "w" },
  { k: "reps", label: "# of reps", unit: "" },
] as const;

const short = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" });

export function HistoryPanel({ history }: { history: SessionStat[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["k"]>("heaviest");
  const [u] = useUnits();
  const t = TABS.find((x) => x.k === tab)!;
  const conv = (v: number) => (t.unit === "w" ? (tab === "volume" ? Math.round(kgTo(v, u.w)) : kgTo(v, u.w)) : v);
  const unit = t.unit === "w" ? ` ${u.w}` : "";
  const best = history.length ? Math.max(...history.map((h) => h[tab])) : 0;
  const last = history[history.length - 1];
  const isPr = !!last && history.length > 1 && last[tab] >= best && last[tab] > Math.max(...history.slice(0, -1).map((h) => h[tab]));

  return (
    <section className="card relative">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="h-display text-xl">{t.label}</h2>
          <p className="text-sm text-bone-dim">{history.length ? `Best: ${conv(best)}${unit} · ${history.length} session${history.length > 1 ? "s" : ""}` : "No sessions yet"}</p>
        </div>
        {isPr && (
          <div className="pr-pop grid h-14 w-14 place-items-center rounded-full bg-gradient-to-b from-amber-300 to-amber-500 text-sm font-black text-ink shadow-[0_0_30px_rgba(251,191,36,.45)]">PR</div>
        )}
      </div>
      <div className="mt-3">
        {history.length >= 2 ? (
          <LineChart points={history.slice(-20).map((h) => ({ label: short(h.date), value: conv(h[tab]) }))} unit={unit} />
        ) : (
          <div className="grid h-40 place-items-center rounded-2xl border border-dashed border-white/10 px-6 text-center text-sm text-bone-mute">
            Log this exercise in a workout (weight + reps per set) twice and your progress chart appears here.
          </div>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {TABS.map((x) => (
          <button key={x.k} onClick={() => setTab(x.k)} className={`rounded-full px-3 py-2 text-sm transition ${tab === x.k ? "bg-blood text-white" : "bg-white/5 text-bone-dim hover:bg-white/10"}`}>{x.label}</button>
        ))}
      </div>
      {history.length > 0 && (
        <div className="mt-4">
          <h3 className="label">Recent sessions</h3>
          <ul className="space-y-1.5 text-sm">
            {history.slice(-5).reverse().map((h) => (
              <li key={h.date} className="flex justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2">
                <span className="text-bone-dim">{short(h.date)}</span>
                <span className="truncate text-right">{h.sets.map((s) => `${s.w ? kgTo(s.w, u.w) : "BW"}×${s.r}`).join(" · ")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
