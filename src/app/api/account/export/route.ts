import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Download everything we store about the signed-in user as JSON. */
export async function GET() {
  const supabase = createClient();
  const user = await getAuthUser(supabase);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const q = (table: string, order: string) => supabase.from(table).select("*").order(order).then((r) => (r.error ? [] : r.data));
  const [profile, logs, feedback, body, favorites] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single().then((r) => r.data),
    q("daily_logs", "log_date"),
    q("coach_feedback", "week_start"),
    q("body_checkins", "checkin_date"),
    q("food_favorites", "created_at"),
  ]);

  const data = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email },
    profile,
    daily_logs: logs,
    coach_feedback: feedback,
    body_checkins: body,
    food_favorites: favorites,
    note: "Progress photos are listed by file path in body_checkins.photos; download them from the Body page.",
  };
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="fitsync-data-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
