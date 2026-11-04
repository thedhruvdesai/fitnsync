"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { closeCheckout, onPaddleEvent, openInlineCheckout } from "@/lib/paddle-client";
import { formatMoney, getRegion } from "@/lib/regions";

const FRAME = "fitsync-checkout";

function money(amount: unknown, currency?: string) {
  const n = Number(amount);
  if (!Number.isFinite(n) || !currency) return null;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

export default function CheckoutView(props: {
  planId: "starter" | "pro" | "elite";
  planName: string;
  tagline: string;
  features: string[];
  regionId: string;
  trialDays: number;
  name: string;
}) {
  const region = getRegion(props.regionId)!;
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [today, setToday] = useState<string | null>(null);
  const [recurring, setRecurring] = useState<string>(formatMoney(region.prices[props.planId], region));
  const [tax, setTax] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const off = onPaddleEvent((e) => {
      const d = e.data;
      if (e.name === "checkout.loaded" || e.name === "checkout.updated") {
        setLoaded(true);
        const cur = d?.currency_code;
        const t = money(d?.totals?.total, cur);
        const r = money(d?.recurring_totals?.total ?? d?.items?.[0]?.recurring_totals?.total, cur);
        const tx = money(d?.recurring_totals?.tax ?? d?.totals?.tax, cur);
        if (t) setToday(t);
        if (r) setRecurring(r);
        if (tx && Number(d?.recurring_totals?.tax ?? d?.totals?.tax) > 0) setTax(tx);
      }
      if (e.name === "checkout.completed") {
        setDone(true);
        setTimeout(() => window.location.assign("/app/billing?success=1"), 3500);
      }
      if (e.name === "checkout.error") setError("Something went wrong with the payment form. Please try again.");
    });
    if (!started.current) {
      started.current = true;
      fetch("/api/paddle/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tier: props.planId, country: props.regionId }) })
        .then((r) => r.json())
        .then((j) => {
          if (j.switched) return window.location.assign("/app/billing?success=1");
          if (!j.checkout) throw new Error(j.error || "Couldn't start checkout");
          return openInlineCheckout(j.checkout, FRAME);
        })
        .catch((e) => setError((e as Error).message));
    }
    return () => {
      off();
    };
  }, [props.planId, props.regionId]);

  useEffect(() => () => closeCheckout(), []);

  const trial = props.trialDays > 0;
  const firstCharge = new Date(Date.now() + props.trialDays * 864e5).toLocaleDateString("en-AU", { day: "numeric", month: "long" });

  if (done)
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-blood text-4xl text-white shadow-[0_0_60px_-10px_rgba(225,29,46,0.9)]">✓</div>
        <h1 className="h-display mt-8 text-5xl">You&apos;re in{props.name ? `, ${props.name}` : ""}.</h1>
        <p className="mt-4 text-bone-dim">{props.planName} is unlocking now. Taking you to your account…</p>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/app/billing" className="text-sm text-bone-dim hover:text-bone">← Back to plans</Link>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
        {/* summary */}
        <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-blood/25 via-ink-2/80 to-ink-2/80 p-7 backdrop-blur-md md:p-9">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blood/30 blur-3xl" />
          <p className="eyebrow relative">Fit&amp;Sync {props.planName}</p>
          <h1 className="h-display relative mt-3 text-4xl leading-[0.95] md:text-5xl">{props.tagline}</h1>

          <div className="relative mt-8 rounded-2xl border border-white/10 bg-ink/60 p-5">
            {trial ? (
              <>
                <div className="flex items-baseline justify-between">
                  <span className="text-bone-dim">Due today</span>
                  <span className="h-display text-3xl">{today ?? formatMoney(0, region)}</span>
                </div>
                <div className="mt-3 flex items-baseline justify-between text-sm">
                  <span className="text-bone-dim">From {firstCharge}</span>
                  <span className="font-semibold">{recurring} / month</span>
                </div>
                <div className="mt-4 rounded-xl bg-blood/15 px-3 py-2 text-xs text-bone">
                  {props.trialDays} days free. Cancel anytime before {firstCharge} and you pay nothing.
                </div>
              </>
            ) : (
              <div className="flex items-baseline justify-between">
                <span className="text-bone-dim">Monthly</span>
                <span className="h-display text-3xl">{today ?? recurring}</span>
              </div>
            )}
            {tax && <p className="mt-3 text-xs text-bone-mute">Includes {tax} tax</p>}
          </div>

          <ul className="relative mt-7 space-y-2.5 text-sm">
            {props.features.map((f) => (
              <li key={f} className="flex gap-2.5"><span className="text-blood">✓</span><span className="text-bone-dim">{f}</span></li>
            ))}
          </ul>

          <div className="relative mt-8 grid grid-cols-3 gap-2 text-center text-[11px] uppercase tracking-wider text-bone-mute">
            <div className="rounded-xl border border-white/10 px-2 py-3">🔒<br />Secure</div>
            <div className="rounded-xl border border-white/10 px-2 py-3">↺<br />Cancel anytime</div>
            <div className="rounded-xl border border-white/10 px-2 py-3">🌍<br />Local tax incl.</div>
          </div>
        </section>

        {/* payment */}
        <section className="rounded-[28px] border border-white/10 bg-ink-2/80 p-5 backdrop-blur-md md:p-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="h-display text-2xl">Payment</h2>
            <span className="flex items-center gap-1.5 text-xs text-bone-mute">🔒 Encrypted</span>
          </div>
          {error ? (
            <div className="rounded-2xl border border-blood/40 bg-blood/10 p-5 text-sm">
              <p className="text-bone">{error}</p>
              <button className="btn-red mt-4 !py-2" onClick={() => window.location.reload()}>Try again</button>
            </div>
          ) : (
            <>
              {!loaded && (
                <div className="space-y-3" aria-label="Loading payment form">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.06]" style={{ animationDelay: `${i * 120}ms` }} />
                  ))}
                  <div className="h-14 animate-pulse rounded-full bg-blood/30" />
                </div>
              )}
              <div className={`${FRAME} ${loaded ? "" : "h-0 overflow-hidden"}`} />
            </>
          )}
          <p className="mt-5 text-center text-[11px] leading-relaxed text-bone-mute">
            Payments are processed by Paddle.com, our merchant of record, which handles billing, tax and receipts. You can manage or cancel your subscription anytime from your account.
          </p>
        </section>
      </div>
    </div>
  );
}
