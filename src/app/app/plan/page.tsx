import Link from "next/link";
import { Paywall } from "@/components/Paywall";
import { requireProfile } from "@/lib/session";
import { hasTier } from "@/lib/tiers";
import { SessionCards } from "./SessionCards";

export default async function PlanPage() {
  const { profile } = await requireProfile();
  const plan = profile.plan!;
  const t = plan.targets;

  if (!hasTier(profile.tier, "starter"))
    return (
      <div className="space-y-6">
        <h1 className="h-display text-4xl">Your plan</h1>
        <Paywall need="starter" title="Your meal plan and training program are ready.">
          Built from your intake: {t.kcal.toLocaleString()} kcal, {t.protein_g} g protein, a {plan.training.split.toLowerCase()} for {profile.equipment === "gym" ? "the gym" : profile.equipment === "home" ? "home" : "bodyweight"}.
        </Paywall>
      </div>
    );

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Built {new Date(plan.generated_at).toLocaleDateString("en-AU", { day: "numeric", month: "long" })}</p>
          <h1 className="h-display mt-1 text-4xl md:text-5xl">Your plan</h1>
        </div>
        <Link href="/onboarding" className="btn-ghost !py-2">Update details &amp; rebuild</Link>
      </div>

      <section>
        <h2 className="h-display text-2xl">Daily targets</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[["Calories", `${t.kcal.toLocaleString()} kcal`], ["Protein", `${t.protein_g} g`], ["Carbs", `${t.carbs_g} g`], ["Fat", `${t.fat_g} g`], ["Fibre", `${t.fibre_g} g`], ["Water", `${(t.water_ml / 1000).toFixed(1)} L`], ["Steps", t.steps.toLocaleString()], ["Sleep", `${t.sleep_h} h`]].map(([k, v]) => (
            <div key={k} className="card !p-4">
              <div className="text-xs uppercase tracking-widest text-bone-mute">{k}</div>
              <div className="mt-1 text-xl font-semibold">{v}</div>
            </div>
          ))}
        </div>
        <ul className="mt-4 space-y-2 text-sm text-bone-dim">
          {plan.notes.map((n) => <li key={n} className="flex gap-2"><span className="text-blood">●</span>{n}</li>)}
        </ul>
      </section>

      <section>
        <h2 className="h-display text-2xl">Meal plan</h2>
        <div className="-mx-5 mt-4 flex snap-x gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-3">
          {plan.meals.map((d) => (
            <div key={d.day} className="card min-w-[82%] snap-start md:min-w-0">
              <div className="flex items-baseline justify-between">
                <h3 className="h-display text-xl">{d.day}</h3>
                <span className="text-xs text-bone-mute">{d.totals.kcal} kcal · {d.totals.protein} g P</span>
              </div>
              <ul className="mt-3 space-y-3">
                {d.meals.map((m, k) => (
                  <li key={k}>
                    <div className="text-[11px] uppercase tracking-widest text-blood">{m.slot}</div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-bone-mute">{m.items.join(" · ")}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="h-display text-2xl">{plan.training.split}</h2>
        <SessionCards sessions={plan.training.sessions} />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="card text-sm"><div className="label">Cardio</div><p className="text-bone-dim">{plan.training.cardio}</p></div>
          <div className="card text-sm"><div className="label">How to progress</div><p className="text-bone-dim">{plan.training.progression}</p></div>
        </div>
      </section>
    </div>
  );
}
