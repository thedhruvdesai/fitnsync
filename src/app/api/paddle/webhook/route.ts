import { NextResponse } from "next/server";
import { ACTIVE_STATUSES, paddle, tierFromPrice, verifyWebhook } from "@/lib/paddle";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface SubEvent {
  event_type: string;
  data: {
    id: string;
    status: string;
    customer_id: string;
    address_id?: string;
    custom_data?: { user_id?: string } | null;
    items?: { price?: { id: string; custom_data?: Record<string, string> | null } }[];
  };
}

/** Paddle → app: keeps each user's tier in sync with their subscription. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get("paddle-signature"), process.env.PADDLE_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }
  const evt = JSON.parse(raw) as SubEvent;
  if (!evt.event_type?.startsWith("subscription.")) return NextResponse.json({ ignored: evt.event_type });

  const sub = evt.data;
  const admin = createAdminClient();

  // Country check: the billing country typed into Paddle must match the one the app priced for.
  // A mismatch (someone picking a cheaper country) cancels at once; during the free trial nothing has been charged.
  if (evt.event_type === "subscription.created" && sub.custom_data?.user_id && sub.address_id) {
    try {
      const { data: prof } = await admin.from("profiles").select("billing_country").eq("id", sub.custom_data.user_id).single();
      const expected = prof?.billing_country;
      const addr = (await paddle(`/customers/${sub.customer_id}/addresses/${sub.address_id}`)) as { data?: { country_code?: string } };
      const actual = addr?.data?.country_code;
      if (expected && actual && expected !== actual) {
        await paddle(`/subscriptions/${sub.id}/cancel`, { method: "POST", body: { effective_from: "immediately" } });
        await admin.from("profiles").update({ tier: "free", paddle_subscription_id: sub.id, paddle_customer_id: sub.customer_id, subscription_status: "canceled_country_mismatch" }).eq("id", sub.custom_data.user_id);
        console.warn("paddle webhook: country mismatch", { user: sub.custom_data.user_id, expected, actual });
        return NextResponse.json({ ok: true, cancelled: "country_mismatch" });
      }
    } catch (e) {
      console.error("paddle webhook country check", e);
    }
  }

  const active = ACTIVE_STATUSES.includes(sub.status);
  const tier = active ? tierFromPrice(sub.items?.[0]?.price) : "free";
  const update = { tier, paddle_subscription_id: sub.id, paddle_customer_id: sub.customer_id, subscription_status: sub.status };

  const q = admin.from("profiles").update(update, { count: "exact" });
  const { error, count } = sub.custom_data?.user_id
    ? await q.eq("id", sub.custom_data.user_id)
    : await q.eq("paddle_customer_id", sub.customer_id);
  if (error) {
    console.error("paddle webhook", error);
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, updated: count ?? 0 });
}
