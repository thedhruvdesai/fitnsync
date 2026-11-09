"use client";

import { useEffect, useRef, useState } from "react";
import { CONTACT_EMAIL, INQUIRY_TYPES } from "@/lib/faq";

type Errors = Partial<Record<"name" | "email" | "type" | "subject" | "message", string>>;

export function ContactForm({ defaultType }: { defaultType?: string }) {
  const started = useRef(Date.now());
  const [f, setF] = useState({ name: "", email: "", type: (INQUIRY_TYPES as readonly string[]).includes(defaultType ?? "") ? defaultType! : "", subject: "", message: "", website: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    started.current = Date.now();
  }, []);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setF((p) => ({ ...p, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`[Liftkai · ${f.type || "Inquiry"}] ${f.subject}`)}&body=${encodeURIComponent(`${f.message}\n\n${f.name}\n${f.email}`)}`;

  const validate = (): Errors => {
    const e: Errors = {};
    if (f.name.trim().length < 2) e.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "Please enter a valid email address.";
    if (!f.type) e.type = "Please choose a topic.";
    if (f.subject.trim().length < 3) e.subject = "Please add a short subject.";
    if (f.message.trim().length < 10) e.message = "Please tell us a little more (at least 10 characters).";
    return e;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      document.getElementById(Object.keys(v)[0])?.focus();
      return;
    }
    setStatus("sending");
    setMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, elapsed: Date.now() - started.current }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 422) {
        setErrors(j.errors ?? {});
        setStatus("idle");
        return;
      }
      if (!res.ok) throw new Error(j.error || "Something went wrong.");
      if (j.ok) return setStatus("sent");

      if (j.fallback) {
        // Deliver through the form relay straight to the Liftkai inbox.
        const r = await fetch(`https://formsubmit.co/ajax/${j.to}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            _subject: j.subject,
            _replyto: f.email,
            _template: "table",
            _captcha: "false",
            Name: f.name,
            Email: f.email,
            Topic: f.type,
            Subject: f.subject,
            Message: f.message,
          }),
        });
        const k = await r.json().catch(() => ({}));
        if (r.ok && String(k.success) !== "false") return setStatus("sent");
      }
      throw new Error("We couldn't send your message right now.");
    } catch (err) {
      setMsg((err as Error).message);
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="card !p-8 text-center" role="status">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blood/15 text-2xl text-blood-400">✓</div>
        <h2 className="h-display mt-5 text-3xl">Message sent.</h2>
        <p className="mx-auto mt-3 max-w-sm text-bone-dim">
          Thanks{f.name ? `, ${f.name.split(" ")[0]}` : ""}! We've received your inquiry and will reply to <span className="text-bone">{f.email}</span> within 1–2 business days.
        </p>
        <button
          className="btn-ghost mt-6"
          onClick={() => {
            setF((p) => ({ ...p, subject: "", message: "" }));
            started.current = Date.now();
            setStatus("idle");
          }}
        >
          Send another message
        </button>
      </div>
    );
  }

  const err = (k: keyof Errors) =>
    errors[k] ? (
      <p id={`${k}-err`} className="mt-1.5 text-xs text-blood-400" role="alert">
        {errors[k]}
      </p>
    ) : null;
  const bad = (k: keyof Errors) => (errors[k] ? "!border-blood/70" : "");

  return (
    <form onSubmit={submit} noValidate className="card !p-6 md:!p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label">Your name</label>
          <input id="name" className={`input ${bad("name")}`} autoComplete="name" value={f.name} onChange={set("name")} aria-invalid={!!errors.name} aria-describedby="name-err" placeholder="Alex Smith" required />
          {err("name")}
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" className={`input ${bad("email")}`} autoComplete="email" value={f.email} onChange={set("email")} aria-invalid={!!errors.email} aria-describedby="email-err" placeholder="you@example.com" required />
          {err("email")}
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="type" className="label">What's it about?</label>
        <select id="type" className={`input ${bad("type")}`} value={f.type} onChange={set("type")} aria-invalid={!!errors.type} aria-describedby="type-err" required>
          <option value="" disabled>Choose a topic</option>
          {INQUIRY_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {err("type")}
      </div>

      <div className="mt-5">
        <label htmlFor="subject" className="label">Subject</label>
        <input id="subject" className={`input ${bad("subject")}`} value={f.subject} onChange={set("subject")} maxLength={140} aria-invalid={!!errors.subject} aria-describedby="subject-err" placeholder="e.g. Question about the Elite plan" required />
        {err("subject")}
      </div>

      <div className="mt-5">
        <label htmlFor="message" className="label">Your message</label>
        <textarea id="message" rows={6} className={`input resize-y ${bad("message")}`} value={f.message} onChange={set("message")} maxLength={5000} aria-invalid={!!errors.message} aria-describedby="message-err" placeholder="Tell us how we can help. Please don't include card numbers or passwords." required />
        <div className="mt-1 flex justify-between">
          {err("message") ?? <span />}
          <span className="text-xs text-bone-mute">{f.message.length}/5000</span>
        </div>
      </div>

      {/* Honeypot: hidden from people, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} />
      </div>

      {status === "error" && (
        <div className="mt-5 rounded-xl border border-blood/40 bg-blood/10 p-4 text-sm" role="alert">
          <p className="text-bone">{msg}</p>
          <p className="mt-1 text-bone-dim">
            You can also <a href={mailto} className="text-blood-400 underline underline-offset-4">email us directly</a> at {CONTACT_EMAIL}.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col-reverse items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xs text-xs text-bone-mute">We use your details only to reply to you. See our <a href="/privacy" className="underline underline-offset-4">Privacy Policy</a>.</p>
        <button type="submit" className="btn-red shrink-0 whitespace-nowrap !px-8 !py-3.5" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Send message →"}
        </button>
      </div>
    </form>
  );
}
