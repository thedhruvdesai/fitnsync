import { getAuthUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { paddle } from "@/lib/paddle";
import { createClient } from "@/lib/supabase/server";

/** Opens Paddle's customer portal (cancel, change card, invoices). */
export async function POST() {
  const supabase = createClient();
  const user = await getAuthUser(supabase);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { data: p } = await supabase.from("profiles").select("paddle_customer_id, paddle_subscription_id").eq("id", user.id).single();
  if (!p?.paddle_customer_id) return NextResponse.json({ error: "No subscription yet" }, { status: 400 });
  try {
    const res = await paddle<{ data: { urls: { general: { overview: string } } } }>(`/customers/${p.paddle_customer_id}/portal-sessions`, {
      method: "POST",
      body: p.paddle_subscription_id ? { subscription_ids: [p.paddle_subscription_id] } : {},
    });
    return NextResponse.json({ url: res.data.urls.general.overview });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
