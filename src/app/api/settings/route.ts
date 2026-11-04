import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { weekly_email } = await req.json();
  await supabase.from("profiles").update({ weekly_email: !!weekly_email }).eq("id", user.id);
  return NextResponse.json({ ok: true });
}
