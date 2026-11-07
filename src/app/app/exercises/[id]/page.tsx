import { userToday } from "@/lib/tz.server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExerciseDemo, ExerciseThumb } from "@/components/ExerciseDemo";
import { Paywall } from "@/components/Paywall";
import { moveFor } from "@/lib/exercises";
import { byId, findExercise, LIBRARY, sessionStat, type SessionStat, type SetEntry } from "@/lib/library";
import { addDays, isoDate } from "@/lib/report";
import { requireProfile } from "@/lib/session";
import { stepsFor } from "@/lib/library-steps";
import { hasTier } from "@/lib/tiers";
import type { DailyLog } from "@/lib/types";
import { HistoryPanel } from "./HistoryPanel";

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return { title: `${byId(params.id)?.name ?? "Exercise"} · Fit&Sync` };
}

export default async function ExercisePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const ex = byId(params.id);
  if (!ex) notFound();
  const { profile, supabase } = await requireProfile();
  const move = moveFor(ex.name);
  const paid = hasTier(profile.tier, "starter");

  let history: SessionStat[] = [];
  if (paid) {
    const today = await userToday(profile.timezone);
    const { data } = await supabase.from("daily_logs").select("log_date, workouts").gte("log_date", addDays(today, -365)).order("log_date");
    for (const l of (data ?? []) as Pick<DailyLog, "log_date" | "workouts">[]) {
      const sets: SetEntry[] = [];
      for (const w of l.workouts ?? []) {
        if ((w.ex ?? findExercise(w.name)?.id) !== ex.id) continue;
        if (w.set_list?.length) sets.push(...w.set_list);
        else if (w.reps) sets.push(...Array.from({ length: w.sets ?? 1 }, () => ({ w: w.weight ?? 0, r: w.reps! })));
      }
      if (sets.length) history.push(sessionStat(l.log_date, sets));
    }
  }

  const similar = LIBRARY.filter((e) => e.id !== ex.id && e.group === ex.group && e.primary[0] === ex.primary[0]).slice(0, 4);

  return (
    <div className="space-y-6">
      <Link href={`/app/exercises?g=${ex.group}`} className="text-sm text-bone-mute hover:text-bone">← {ex.group} exercises</Link>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="min-w-0 space-y-4">
          <ExerciseDemo name={ex.name} lib={ex} />
          <div>
            <h1 className="h-display text-3xl md:text-4xl">{ex.name}</h1>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-white/10 px-3 py-1 text-bone-dim">{ex.equipment}</span>
              <span className="rounded-full border border-white/10 px-3 py-1 capitalize text-bone-dim">{ex.level}</span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-bone-dim">{ex.where === "both" ? "Gym or home" : "Gym"}</span>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          {paid ? <HistoryPanel history={history} /> : <Paywall need="starter" title="Track your heaviest weight, 1-rep max, volume and PRs for every exercise." />}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.4fr_1fr]">
        <section className="card">
          <h2 className="label">Step by step</h2>
          <ol className="space-y-3">
            {stepsFor(ex.id).map((s, i) => (
              <li key={i} className="flex gap-3 text-sm text-bone-dim">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blood/20 text-xs font-semibold text-blood-400">{i + 1}</span>
                <span className="pt-1">{s}</span>
              </li>
            ))}
          </ol>
        </section>
        <div className="min-w-0 space-y-4">
          <section className="card">
            <h2 className="label">Muscles worked</h2>
            <div className="flex flex-wrap gap-2">
              {ex.primary.map((m) => <span key={m} className="rounded-full border border-blood/60 bg-blood/15 px-3 py-1 text-xs">{m}</span>)}
              {ex.secondary.map((m) => <span key={m} className="rounded-full border border-white/10 px-3 py-1 text-xs text-bone-dim">{m}</span>)}
            </div>
          </section>
          <section className="card">
            <h2 className="label">Coach cues</h2>
            <ul className="space-y-1.5 text-sm text-bone-dim">{move.cues.map((c) => <li key={c}>• {c}</li>)}</ul>
            <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">Avoid</div>
              <p className="mt-1 text-sm text-bone-dim">{move.mistake}</p>
            </div>
            <p className="mt-3 text-[11px] text-bone-mute">Stop if you feel sharp pain, and check with a physio if it persists.</p>
          </section>
        </div>
      </div>

      {similar.length > 0 && (
        <section>
          <h2 className="h-display text-xl">Alternatives</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {similar.map((s) => (
              <Link key={s.id} href={`/app/exercises/${s.id}`} className="card !p-3 text-sm transition hover:border-white/25">
                <ExerciseThumb name={s.name} className="mb-2 aspect-[3/2] h-auto w-full" />
                {s.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
