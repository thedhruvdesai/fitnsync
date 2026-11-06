import { getAuthUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidTz } from "@/lib/tz";

export async function POST(req: Request) {
  const supabase = await createClient();
  const user = await getAuthUser(supabase);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (typeof body.weekly_email === "boolean") await supabase.from("profiles").update({ weekly_email: body.weekly_email }).eq("id", user.id);
  // separate update: works even before the timezone column migration has been run
  if (isValidTz(body.timezone)) await supabase.from("profiles").update({ timezone: body.timezone }).eq("id", user.id);
  return NextResponse.json({ ok: true });
}
