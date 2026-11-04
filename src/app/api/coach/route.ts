import { NextResponse } from "next/server";
import { generateFeedback, MONTHLY_CHECKINS } from "@/lib/coach";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { hasTier } from "@/lib/tiers";
import type { Profile } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("*").eq("id", user.id).single();
  const profile = data as Profile;
  if (!hasTier(profile.tier, "elite")) return NextResponse.json({ error: "Coach check-ins are part of Elite." }, { status: 403 });
  if (!profile.plan) return NextResponse.json({ error: "Finish onboarding first." }, { status: 400 });

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { count } = await admin.from("coach_feedback").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("kind", "on_demand").gte("created_at", monthStart.toISOString());
  if ((count ?? 0) >= MONTHLY_CHECKINS) return NextResponse.json({ error: `You've used all ${MONTHLY_CHECKINS} check-ins this month. Your weekly review still arrives every Monday.` }, { status: 429 });

  const { question } = await req.json().catch(() => ({ question: "" }));
  try {
    const { content } = await generateFeedback(admin, profile, "on_demand", question);
    return NextResponse.json({ content });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Coach is busy right now. Try again in a minute." }, { status: 502 });
  }
}
