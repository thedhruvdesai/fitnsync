import Link from "next/link";
import { PLANS, type Tier } from "@/lib/tiers";

export function Paywall({ need, title, children }: { need: Exclude<Tier, "free">; title: string; children?: React.ReactNode }) {
  const plan = PLANS.find((p) => p.id === need)!;
  return (
    <div className="card relative overflow-hidden !p-8 text-center">
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blood/20 blur-3xl" />
      <p className="eyebrow">{plan.name} · ${plan.price}/mo</p>
      <h2 className="h-display mx-auto mt-3 max-w-md text-3xl">{title}</h2>
      {children && <div className="mx-auto mt-3 max-w-md text-bone-dim">{children}</div>}
      <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm text-bone-dim">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2"><span className="text-blood">●</span>{f}</li>
        ))}
      </ul>
      <Link href={`/app/billing?plan=${need}`} className="btn-red mt-8">Upgrade to {plan.name}</Link>
    </div>
  );
}
