import { NextResponse } from "next/server";
import { listFitsyncPrices, paddle, priceSpec } from "@/lib/paddle";
import { PLANS, TRIAL_DAYS } from "@/lib/tiers";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * One-tap Paddle setup. Open in a browser:
 *   https://YOUR-SITE/api/admin/paddle-setup?secret=YOUR_CRON_SECRET
 * Creates (or updates) the Starter / Pro / Elite monthly plans with local prices for every region in src/lib/regions.ts.
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
        body: { name: `Fit&Sync ${plan.name}`, description: plan.tagline, tax_category: "standard", custom_data: { fitsync_tier: plan.id } },
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
    return NextResponse.json({ ok: true, environment: process.env.NEXT_PUBLIC_PADDLE_ENV || "sandbox", results });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
