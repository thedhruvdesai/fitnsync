import { NextResponse } from "next/server";
import { applyKcal, weeklyAdjustment, type WeighIn } from "@/lib/adapt";
import { getAuthUser } from "@/lib/auth";
import { isoDate, addDays } from "@/lib/report";
import { createClient } from "@/lib/supabase/server";
import type { Exercise, Plan, Session } from "@/lib/types";

async function load() {
  const supabase = createClient();
  const user = await getAuthUser(supabase);
  if (!user) return { error: NextResponse.json({ error: "Not signed in" }, { status: 401 }) } as const;
  const { data } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  const plan = data?.plan as Plan | null;
  if (!plan) return { error: NextResponse.json({ error: "No plan yet" }, { status: 400 }) } as const;
  return { supabase, user, plan } as const;
}

async function weighIns(supabase: ReturnType<typeof createClient>, today: string): Promise<WeighIn[]> {
  const from = addDays(today, -24);
  const [logs, body] = await Promise.all([
    supabase.from("daily_logs").select("log_date, weight_kg").gte("log_date", from).not("weight_kg", "is", null),
    supabase.from("body_checkins").select("checkin_date, weight_kg").gte("checkin_date", from).not("weight_kg", "is", null),
  ]);
  return [
    ...((logs.data ?? []) as { log_date: string; weight_kg: number }[]).map((r) => ({ date: r.log_date, kg: Number(r.weight_kg) })),
    ...((body.error ? [] : body.data ?? []) as { checkin_date: string; weight_kg: number }[]).map((r) => ({ date: r.checkin_date, kg: Number(r.weight_kg) })),
  ];
}

/** GET: weekly calorie check from the weight trend. */
export async function GET() {
  const ctx = await load();
  if ("error" in ctx) return ctx.error;
  const today = isoDate(new Date());
  return NextResponse.json({ ...weeklyAdjustment(ctx.plan, await weighIns(ctx.supabase, today), today), kcal: ctx.plan.targets.kcal });
}

const clean = (sessions: unknown): Session[] | null => {
  if (!Array.isArray(sessions) || sessions.length > 7) return null;
  const out: Session[] = [];
  for (const s of sessions as Session[]) {
    if (!s || typeof s.day !== "string" || !Array.isArray(s.exercises) || s.exercises.length > 14) return null;
    out.push({
      day: s.day.slice(0, 3),
      title: String(s.title ?? "Workout").slice(0, 40),
      focus: String(s.focus ?? "").slice(0, 80),
      minutes: Math.min(180, Math.max(10, Number(s.minutes) || 45)),
      exercises: s.exercises.map((e: Exercise) => ({
        name: String(e.name ?? "").slice(0, 80) || "Exercise",
        sets: Math.min(10, Math.max(1, Math.round(Number(e.sets) || 3))),
        reps: String(e.reps ?? "8–12").slice(0, 16),
        rest: String(e.rest ?? "90 s").slice(0, 16),
      })),
    });
  }
  return out;
};

/** POST: { action: "training", sessions } to save edited workouts, or { action: "adjust" } to apply the weekly calorie change. */
export async function POST(req: Request) {
  const ctx = await load();
  if ("error" in ctx) return ctx.error;
  const body = await req.json().catch(() => ({}));
  const plan = ctx.plan;

  if (body.action === "training") {
    const sessions = clean(body.sessions);
    if (!sessions) return NextResponse.json({ error: "Invalid workout data" }, { status: 400 });
    plan.training = { ...plan.training, sessions };
  } else if (body.action === "adjust") {
    const today = isoDate(new Date());
    const adj = weeklyAdjustment(plan, await weighIns(ctx.supabase, today), today);
    if (adj.status !== "adjust" || !adj.newKcal) return NextResponse.json({ error: "No adjustment needed right now", adj }, { status: 409 });
    const from = plan.targets.kcal;
    plan.targets = applyKcal(plan.targets, adj.newKcal);
    plan.adjustments = [...(plan.adjustments ?? []).slice(-20), { date: today, from, to: adj.newKcal, reason: adj.message }];
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const { error } = await ctx.supabase.from("profiles").update({ plan }).eq("id", ctx.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, plan });
}
