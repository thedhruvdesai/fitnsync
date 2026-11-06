"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

const KEY = "fs_getting_started_hidden";

/** First-days checklist: shows new users the three things that make the app click. */
export function GettingStarted({ supabase, onDemo, onScan }: { supabase: SupabaseClient; onDemo: () => void; onScan?: () => void }) {
  const [state, setState] = useState<{ food: boolean; workout: boolean; body: boolean } | null>(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(KEY) === "1");
    } catch {
      setHidden(false);
    }
    (async () => {
      const [{ data: logs }, body] = await Promise.all([
        supabase.from("daily_logs").select("meals, workouts").order("log_date", { ascending: false }).limit(60),
        supabase.from("body_checkins").select("id", { count: "exact", head: true }),
      ]);
      const rows = (logs ?? []) as { meals: unknown[]; workouts: unknown[] }[];
      setState({
        food: rows.some((r) => (r.meals?.length ?? 0) > 0),
        workout: rows.some((r) => (r.workouts?.length ?? 0) > 0),
        body: !body.error && (body.count ?? 0) > 0,
      });
    })();
  }, [supabase]);

  if (hidden || !state) return null;
  const done = [state.food, state.workout, state.body].filter(Boolean).length;
  if (done === 3) return null;

  const hide = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setHidden(true);
  };

  const Step = ({ n, ok, title, sub, children }: { n: number; ok: boolean; title: string; sub: string; children?: React.ReactNode }) => (
    <li className={`flex gap-3 rounded-2xl p-3 transition ${ok ? "opacity-60" : "bg-white/[0.04]"}`}>
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${ok ? "bg-emerald-400 text-ink" : "border border-white/20 text-bone-dim"}`}>{ok ? "✓" : n}</span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${ok ? "line-through" : ""}`}>{title}</p>
        <p className="text-xs text-bone-mute">{sub}</p>
        {!ok && children && <div className="mt-2 flex flex-wrap gap-2">{children}</div>}
      </div>
    </li>
  );

  return (
    <section className="card relative overflow-hidden">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blood/20 blur-3xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Get started · {done}/3</p>
          <h2 className="h-display mt-1 text-2xl">Let&apos;s set you up</h2>
        </div>
        <button onClick={hide} className="text-xs text-bone-mute hover:text-bone" aria-label="Hide getting started">Hide</button>
      </div>
      <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-blood to-amber-400 transition-all duration-700" style={{ width: `${(done / 3) * 100}%` }} />
      </div>
      <ol className="relative mt-4 space-y-2">
        <Step n={1} ok={state.food} title="Log your first meal" sub="See how the AI scan works. The demo uses one of today's free scans.">
          <button className="btn-red !px-4 !py-2 text-xs" onClick={onDemo}>✨ Try a demo scan</button>
          {onScan && <button className="chip !py-2 text-xs" onClick={onScan}>📷 Scan my food</button>}
        </Step>
        <Step n={2} ok={state.workout} title="Do your first workout" sub="Open today's session, follow the demos and tick off your sets.">
          <Link href="/app/plan" className="chip !py-2 text-xs">🏋️ See my plan</Link>
          <Link href="/app/exercises" className="chip !py-2 text-xs">Browse exercises</Link>
        </Step>
        <Step n={3} ok={state.body} title="Take your “before” photo" sub="Weight, waist and a private progress photo. Future you will thank you.">
          <Link href="/app/body" className="chip !py-2 text-xs">📸 Body check-in</Link>
        </Step>
      </ol>
    </section>
  );
}
