import { NextResponse } from "next/server";
import { REGIONS } from "@/lib/regions";
import { resolvePrice, siteUrl, stripe } from "@/lib/stripe";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { TRIAL_DAYS, type Tier } from "@/lib/tiers";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { tier, currency: wanted } = (await req.json()) as { tier: Tier; currency?: string };
  if (tier === "free" || !["starter", "pro", "elite"].includes(tier)) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  const price = await resolvePrice(tier);
  if (!price) return NextResponse.json({ error: "Payments aren't set up yet. Open /api/admin/stripe-setup first." }, { status: 503 });
  let currency = REGIONS.some((r) => r.currency === wanted) ? wanted! : "aud";

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("stripe_customer_id, stripe_subscription_id, subscription_status, email, full_name").eq("id", user.id).single();

  // Existing subscriber: send to the portal to switch plans (handles proration).
  if (profile?.stripe_subscription_id && profile.subscription_status && ["active", "trialing", "past_due"].includes(profile.subscription_status)) {
    const portal = await stripe().billingPortal.sessions.create({ customer: profile.stripe_customer_id!, return_url: `${siteUrl()}/app/billing` });
    return NextResponse.json({ url: portal.url });
  }

  let customer = profile?.stripe_customer_id;
  if (!customer) {
    const c = await stripe().customers.create({ email: user.email!, name: profile?.full_name || undefined, metadata: { user_id: user.id } });
    customer = c.id;
    await admin.from("profiles").update({ stripe_customer_id: customer }).eq("id", user.id);
  } else {
    // a Stripe customer is locked to the currency they first paid in
    const c = await stripe().customers.retrieve(customer);
    if (!("deleted" in c && c.deleted) && "currency" in c && c.currency) currency = c.currency;
  }

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer,
    currency,
    line_items: [{ price, quantity: 1 }],
    allow_promotion_codes: true,
    client_reference_id: user.id,
    // only a first-ever subscription gets the free trial
    subscription_data: {
      metadata: { user_id: user.id },
      ...(TRIAL_DAYS > 0 && !profile?.stripe_subscription_id ? { trial_period_days: TRIAL_DAYS } : {}),
    },
    success_url: `${siteUrl()}/app/billing?success=1`,
    cancel_url: `${siteUrl()}/app/billing`,
  });
  return NextResponse.json({ url: session.url });
}
