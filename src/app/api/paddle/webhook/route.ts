import { NextResponse } from "next/server";
import { ACTIVE_STATUSES, tierFromPrice, verifyWebhook } from "@/lib/paddle";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface SubEvent {
  event_type: string;
  data: {
    id: string;
    status: string;
    customer_id: string;
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
  const active = ACTIVE_STATUSES.includes(sub.status);
  const tier = active ? tierFromPrice(sub.items?.[0]?.price) : "free";
  const update = { tier, paddle_subscription_id: sub.id, paddle_customer_id: sub.customer_id, subscription_status: sub.status };

  const admin = createAdminClient();
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
