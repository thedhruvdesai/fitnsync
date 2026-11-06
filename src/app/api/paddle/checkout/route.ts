import { getAuthUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ACTIVE_STATUSES, findPriceId, paddle, type Paid } from "@/lib/paddle";
import { createAdminClient, createClient } from "@/lib/supabase/server";

/**
 * Starts a purchase. New subscribers get what the browser needs to open Paddle's checkout overlay;
 * existing subscribers are switched to the new plan directly (prorated).
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const user = await getAuthUser(supabase);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { tier, country } = (await req.json()) as { tier: Paid; country?: string };
  if (!["starter", "pro", "elite"].includes(tier)) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  if (!process.env.PADDLE_API_KEY || !process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN) return NextResponse.json({ error: "Payments aren't connected yet (Paddle keys missing)." }, { status: 503 });

  let priceId: string | null;
  try {
    priceId = await findPriceId(tier);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
  if (!priceId) return NextResponse.json({ error: "Plans aren't created yet. Open /api/admin/paddle-setup first." }, { status: 503 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("paddle_subscription_id, subscription_status").eq("id", user.id).single();

  // already subscribed: change plan in place
  if (profile?.paddle_subscription_id && ACTIVE_STATUSES.includes(profile.subscription_status ?? "")) {
    try {
      await paddle(`/subscriptions/${profile.paddle_subscription_id}`, {
        method: "PATCH",
        body: { items: [{ price_id: priceId, quantity: 1 }], proration_billing_mode: "prorated_immediately" },
      });
      return NextResponse.json({ switched: true });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 502 });
    }
  }

  const countryCode = country && /^[A-Z]{2}$/.test(country) && country !== "EU" ? country : undefined;
  return NextResponse.json({
    checkout: {
      priceId,
      email: user.email,
      userId: user.id,
      countryCode,
      clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
      environment: (process.env.NEXT_PUBLIC_PADDLE_ENV || "sandbox") === "production" ? "production" : "sandbox",
    },
  });
}
