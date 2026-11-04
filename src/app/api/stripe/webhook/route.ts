import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { tierForPrice } from "@/lib/tiers";

export const dynamic = "force-dynamic";

async function syncSubscription(sub: Stripe.Subscription) {
  const admin = createAdminClient();
  const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const active = ["active", "trialing", "past_due"].includes(sub.status);
  const tier = active ? tierForPrice(sub.items.data[0]?.price.id) : "free";
  const update = { tier, stripe_subscription_id: sub.id, subscription_status: sub.status, stripe_customer_id: customer };

  const userId = sub.metadata?.user_id;
  const q = admin.from("profiles").update(update);
  const { error } = userId ? await q.eq("id", userId) : await q.eq("stripe_customer_id", customer);
  if (error) throw error;
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (e) {
    return NextResponse.json({ error: `Bad signature: ${(e as Error).message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.subscription) {
          const sub = await stripe().subscriptions.retrieve(typeof s.subscription === "string" ? s.subscription : s.subscription.id);
          await syncSubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
    }
  } catch (e) {
    console.error("webhook error", e);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
