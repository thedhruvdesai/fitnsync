import { NextResponse } from "next/server";
import { siteUrl, stripe } from "@/lib/stripe";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { priceIdFor, type Tier } from "@/lib/tiers";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { tier } = (await req.json()) as { tier: Tier };
  const price = priceIdFor(tier);
  if (!price) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });

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
  }

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price, quantity: 1 }],
    allow_promotion_codes: true,
    client_reference_id: user.id,
    subscription_data: { metadata: { user_id: user.id } },
    success_url: `${siteUrl()}/app/billing?success=1`,
    cancel_url: `${siteUrl()}/app/billing`,
  });
  return NextResponse.json({ url: session.url });
}
