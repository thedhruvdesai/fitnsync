import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** PKCE callback (same-browser links). For cross-device links, /auth/confirm is used instead. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/app";
  const next = nextParam.startsWith("/") ? nextParam : "/app";
  const errDesc = searchParams.get("error_description");

  if (errDesc) return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errDesc)}`);
  if (code) {
    const { error } = await (await createClient()).auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    // Most common cause: link opened on a different device/browser. Supabase has still confirmed the email.
    return NextResponse.redirect(`${origin}/login?confirmed=1`);
  }
  return NextResponse.redirect(`${origin}/login`);
}
