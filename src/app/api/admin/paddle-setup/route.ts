import { NextResponse } from "next/server";
import { listFitsyncPrices, paddle, priceSpec } from "@/lib/paddle";
import { PLANS, TRIAL_DAYS } from "@/lib/tiers";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * One-tap Paddle setup. Open in a browser:
 *   https://YOUR-SITE/api/admin/paddle-setup?secret=YOUR_CRON_SECRET
 * Creates (or updates) the Starter / Pro / Elite monthly plans with local prices for every region in src/lib/regions.ts,
 * plus the FOUNDING50 discount code (50% off forever, first 100 customers).
 * Run it again whenever you change prices.
 */
export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) return NextResponse.json({ error: "Add ?secret=YOUR_CRON_SECRET to the URL" }, { status: 401 });

  try {
    const existing = await listFitsyncPrices();
    const results: Record<string, string>[] = [];
    for (const plan of PLANS) {
      const spec = priceSpec(plan.id);
      const trial_period = TRIAL_DAYS > 0 ? { interval: "day", frequency: TRIAL_DAYS } : null;
      const found = existing.find((p) => p.custom_data?.fitsync_tier === plan.id);
      if (found) {
        await paddle(`/prices/${found.id}`, { method: "PATCH", body: { ...spec, trial_period } });
        results.push({ plan: plan.name, price_id: found.id, action: "updated" });
        continue;
      }
      const product = await paddle<{ data: { id: string } }>("/products", {
        method: "POST",
        body: { name: `Liftkai ${plan.name}`, description: plan.tagline, tax_category: "standard", custom_data: { fitsync_tier: plan.id } },
      });
      const price = await paddle<{ data: { id: string } }>("/prices", {
        method: "POST",
        body: {
          product_id: product.data.id,
          description: `${plan.name} monthly`,
          name: `${plan.name} monthly`,
          billing_cycle: { interval: "month", frequency: 1 },
          trial_period,
          tax_mode: "internal", // prices shown already include local tax/VAT/GST
          ...spec,
          custom_data: { fitsync_tier: plan.id },
        },
      });
      results.push({ plan: plan.name, price_id: price.data.id, action: "created" });
    }
    // Founding-member code: 50% off forever, first 100 customers
    const code = "FOUNDING50";
    const found = await paddle<{ data: { id: string; status: string }[] }>(`/discounts?code=${code}`);
    let discount: Record<string, string>;
    if (found.data.length) {
      discount = { code, discount_id: found.data[0].id, action: "already exists" };
    } else {
      const d = await paddle<{ data: { id: string } }>("/discounts", {
        method: "POST",
        body: {
          description: "Founding member: 50% off for life",
          type: "percentage",
          amount: "50",
          code,
          enabled_for_checkout: true,
          recur: true,
          maximum_recurring_intervals: null,
          usage_limit: 100,
          custom_data: { fitsync: "founding" },
        },
      });
      discount = { code, discount_id: d.data.id, action: "created" };
    }

    return NextResponse.json({ ok: true, environment: process.env.NEXT_PUBLIC_PADDLE_ENV || "sandbox", results, discount });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
