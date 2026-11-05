import { NextResponse } from "next/server";
import { analyzeFood, DAILY_SCANS } from "@/lib/food-ai";
import { aiConfigured } from "@/lib/llm";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { Tier } from "@/lib/tiers";

export const maxDuration = 60;

const MEDIA = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** AI food logging: photo and/or text → items with calories and macros. */
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!aiConfigured()) return NextResponse.json({ error: "AI food scan isn't switched on yet (add GEMINI_API_KEY)." }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as { text?: string; image?: string };
  let image: { data: string; mediaType: string } | undefined;
  if (body.image) {
    const m = body.image.match(/^data:(image\/[a-z]+);base64,(.+)$/);
    if (!m || !MEDIA.includes(m[1])) return NextResponse.json({ error: "Please upload a JPG, PNG or WebP photo." }, { status: 400 });
    if (m[2].length > 5_000_000) return NextResponse.json({ error: "That photo is too large. Try a smaller one." }, { status: 413 });
    image = { mediaType: m[1], data: m[2] };
  }
  if (!image && !body.text?.trim()) return NextResponse.json({ error: "Add a photo or type what you ate." }, { status: 400 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("tier").eq("id", user.id).single();
  const tier = ((profile?.tier as Tier) ?? "free") as Tier;
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await admin.from("food_scans").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since);
  const limit = DAILY_SCANS[tier];
  if ((count ?? 0) >= limit) {
    return NextResponse.json({ error: tier === "free" ? `You've used your ${limit} free AI scans today. Upgrade for more.` : `You've reached today's limit of ${limit} AI scans. It resets in 24 hours.` }, { status: 429 });
  }

  try {
    const result = await analyzeFood({ text: body.text, image });
    await admin.from("food_scans").insert({ user_id: user.id, kind: image ? "photo" : "text" });
    return NextResponse.json({ ...result, remaining: Math.max(0, limit - (count ?? 0) - 1) });
  } catch (e) {
    console.error("food analyze", e);
    return NextResponse.json({ error: "Couldn't read that meal. Try a clearer photo or add a short description." }, { status: 502 });
  }
}
