"use client";
import Link from "next/link";
import { useState } from "react";
import { formatMoney, type Region } from "@/lib/regions";
import { PLANS, TIER_RANK, TRIAL_DAYS, type Tier } from "@/lib/tiers";

export function PricingCards({ current, mode, highlight, trialEligible = true, region }: { current?: Tier; mode: "public" | "app"; highlight?: string; trialEligible?: boolean; region: Region }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function choose(tier: Tier) {
    setBusy(tier);
    setErr(null);
    const res = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tier, currency: region.currency }) });
    const j = await res.json();
    if (j.url) window.location.href = j.url;
    else {
      setErr(j.error || "Couldn't start checkout");
      setBusy(null);
    }
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const isCurrent = current === p.id;
          const featured = highlight ? highlight === p.id : p.highlight;
          return (
            <div key={p.id} className={`relative flex flex-col rounded-3xl border p-7 ${featured ? "border-blood bg-gradient-to-b from-blood/15 to-ink-2" : "border-white/10 bg-ink-2"}`}>
              {p.highlight && <span className="absolute -top-3 left-7 rounded-full bg-blood px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white">Most popular</span>}
              <h3 className="h-display text-2xl">{p.name}</h3>
              <p className="mt-1 text-sm text-bone-dim">{p.tagline}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="h-display text-5xl">{formatMoney(region.prices[p.id], region)}</span>
                <span className="text-bone-mute">{region.currency.toUpperCase()} / month</span>
              </div>
              {TRIAL_DAYS > 0 && trialEligible && <div className="mt-2 text-xs font-semibold uppercase tracking-widest text-blood">{TRIAL_DAYS}-day free trial</div>}
              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5"><span className="mt-0.5 text-blood">✓</span><span className="text-bone-dim">{f}</span></li>
                ))}
              </ul>
              {mode === "public" ? (
                <Link href="/signup" className={`${featured ? "btn-red" : "btn-ghost"} mt-8`}>{TRIAL_DAYS > 0 ? `Try ${p.name} free` : `Start with ${p.name}`}</Link>
              ) : isCurrent ? (
                <div className="btn-ghost mt-8 cursor-default opacity-70">Current plan</div>
              ) : (
                <button className={`${featured ? "btn-red" : "btn-ghost"} mt-8`} disabled={!!busy} onClick={() => choose(p.id)}>
                  {busy === p.id ? "Opening checkout…" : current && current !== "free" ? (TIER_RANK[p.id] > TIER_RANK[current] ? `Upgrade to ${p.name}` : `Switch to ${p.name}`) : TRIAL_DAYS > 0 && trialEligible ? `Start ${TRIAL_DAYS}-day free trial` : `Choose ${p.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {err && <p className="mt-4 text-center text-sm text-blood-400">{err}</p>}
      <p className="mt-6 text-center text-xs text-bone-mute">{TRIAL_DAYS > 0 && trialEligible ? `Free for ${TRIAL_DAYS} days, then billed monthly in ${region.currency.toUpperCase()}${region.id === "AU" && process.env.NEXT_PUBLIC_GST_REGISTERED === "true" ? " (GST inclusive)" : ""}. Cancel before the trial ends and you will not be charged.` : `Billed monthly in ${region.currency.toUpperCase()}. Cancel anytime from your account.`}</p>
    </>
  );
}
