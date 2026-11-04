import { NextResponse } from "next/server";
import { LOOKUP_KEY, REGIONS, stripeCurrencyOptions } from "@/lib/regions";
import { stripe } from "@/lib/stripe";
import { PLANS } from "@/lib/tiers";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * One-tap Stripe setup. Open in a browser:
 *   https://YOUR-SITE/api/admin/stripe-setup?secret=YOUR_CRON_SECRET
 * Creates (or updates) the Starter / Pro / Elite monthly prices in every currency from src/lib/regions.ts.
 * Safe to run again after you change prices: it updates the currency options in place.
 */
export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) return NextResponse.json({ error: "Add ?secret=YOUR_CRON_SECRET to the URL" }, { status: 401 });
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "STRIPE_SECRET_KEY is missing in your environment variables" }, { status: 500 });

  const s = stripe();
  const results: Record<string, unknown>[] = [];
  for (const plan of PLANS) {
    const key = LOOKUP_KEY[plan.id];
    const opts = stripeCurrencyOptions(plan.id);
    const { aud, ...others } = opts;
    const currency_options = Object.fromEntries(Object.entries(others).map(([c, amt]) => [c, { unit_amount: amt }]));

    const existing = (await s.prices.list({ lookup_keys: [key], active: true, limit: 1, expand: ["data.currency_options"] })).data[0];
    if (existing && existing.unit_amount === aud && existing.currency === "aud") {
      await s.prices.update(existing.id, { currency_options });
      results.push({ plan: plan.name, price_id: existing.id, action: "updated currencies" });
      continue;
    }
    // AUD amount changed (or first run): create a new price and move the lookup key to it
    const product = existing
      ? (typeof existing.product === "string" ? existing.product : existing.product.id)
      : (await s.products.create({ name: `Fit&Sync ${plan.name}`, description: plan.tagline, metadata: { tier: plan.id } })).id;
    const price = await s.prices.create({
      product,
      currency: "aud",
      unit_amount: aud,
      recurring: { interval: "month" },
      lookup_key: key,
      transfer_lookup_key: true,
      tax_behavior: "inclusive",
      currency_options: Object.fromEntries(Object.entries(currency_options).map(([c, v]) => [c, { ...v, tax_behavior: "inclusive" as const }])),
      metadata: { tier: plan.id },
    });
    if (existing) await s.prices.update(existing.id, { active: false });
    results.push({ plan: plan.name, price_id: price.id, action: existing ? "replaced" : "created" });
  }

  return NextResponse.json({
    ok: true,
    message: "Stripe prices are ready. You don't need STRIPE_PRICE_* variables; the app finds these automatically.",
    currencies: REGIONS.filter((r, i, a) => a.findIndex((x) => x.currency === r.currency) === i).map((r) => r.currency.toUpperCase()),
    results,
  });
}
