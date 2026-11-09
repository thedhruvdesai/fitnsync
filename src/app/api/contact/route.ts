import { NextResponse } from "next/server";
import { Resend } from "resend";
import { CONTACT_EMAIL, INQUIRY_TYPES } from "@/lib/faq";

export const dynamic = "force-dynamic";


const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const hits = new Map<string, number[]>(); // best-effort rate limit per server instance

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = clean(body.name, 80);
  const email = clean(body.email, 160);
  const type = clean(body.type, 60);
  const subject = clean(body.subject, 140);
  const message = clean(body.message, 5000);

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Please enter your name.";
  if (!EMAIL_RE.test(email)) errors.email = "Please enter a valid email address.";
  if (!(INQUIRY_TYPES as readonly string[]).includes(type)) errors.type = "Please choose a topic.";
  if (subject.length < 3) errors.subject = "Please add a short subject.";
  if (message.length < 10) errors.message = "Please tell us a little more (at least 10 characters).";
  if (Object.keys(errors).length) return NextResponse.json({ error: "Please check the highlighted fields.", errors }, { status: 422 });

  // Spam traps (after validation, so real people always see field errors): a hidden
  // field humans never fill, and complete forms submitted impossibly fast.
  const elapsed = Number(body.elapsed ?? 0);
  if (clean(body.website, 200) || (elapsed > 0 && elapsed < 1500)) return NextResponse.json({ ok: true, via: "filtered" });

  const ip = req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  if (recent.length >= 5) return NextResponse.json({ error: "Too many messages. Please wait a few minutes and try again." }, { status: 429 });
  hits.set(ip, [...recent, now]);

  const to = process.env.CONTACT_EMAIL || CONTACT_EMAIL;
  const fullSubject = `[Liftkai · ${type}] ${subject}`;

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const row = (k: string, v: string) => `<tr><td style="padding:8px 12px;color:#948F88;font-size:13px;white-space:nowrap;vertical-align:top">${k}</td><td style="padding:8px 12px;color:#0A0A0B;font-size:14px">${v}</td></tr>`;
      const { error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || "Liftkai <onboarding@resend.dev>",
        to,
        replyTo: email,
        subject: fullSubject,
        html: `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:600px">
<h2 style="margin:0 0 4px;color:#0A0A0B">New inquiry from liftkai.fit</h2>
<p style="margin:0 0 16px;color:#948F88;font-size:13px">Reply to this email to answer ${esc(name)} directly.</p>
<table cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:12px;width:100%">${row("Name", esc(name))}${row("Email", esc(email))}${row("Topic", esc(type))}${row("Subject", esc(subject))}</table>
<div style="margin-top:16px;padding:16px;border-left:3px solid #E11D2E;background:#faf8f5;white-space:pre-wrap;font-size:15px;line-height:1.6;color:#0A0A0B">${esc(message)}</div></div>`,
        text: `New inquiry from liftkai.fit\n\nName: ${name}\nEmail: ${email}\nTopic: ${type}\nSubject: ${subject}\n\n${message}`,
      });
      if (!error) return NextResponse.json({ ok: true, via: "email" });
    } catch {
      /* fall through to the browser fallback */
    }
  }

  // No email provider configured for this address yet: let the browser deliver it via the form relay.
  return NextResponse.json({ ok: false, fallback: true, to, subject: fullSubject });
}
