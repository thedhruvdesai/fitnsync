import { NextResponse } from "next/server";
import { siteUrl, stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").eq("id", user.id).single();
  if (!profile?.stripe_customer_id) return NextResponse.json({ error: "No subscription yet" }, { status: 400 });
  const portal = await stripe().billingPortal.sessions.create({ customer: profile.stripe_customer_id, return_url: `${siteUrl()}/app/billing` });
  return NextResponse.json({ url: portal.url });
}
