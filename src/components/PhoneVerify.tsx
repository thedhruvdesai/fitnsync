"use client";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/min";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const CODES: { c: CountryCode; flag: string; dial: string }[] = [
  { c: "AU", flag: "🇦🇺", dial: "+61" },
  { c: "IN", flag: "🇮🇳", dial: "+91" },
  { c: "NZ", flag: "🇳🇿", dial: "+64" },
  { c: "US", flag: "🇺🇸", dial: "+1" },
  { c: "CA", flag: "🇨🇦", dial: "+1" },
  { c: "GB", flag: "🇬🇧", dial: "+44" },
  { c: "SG", flag: "🇸🇬", dial: "+65" },
  { c: "AE", flag: "🇦🇪", dial: "+971" },
  { c: "ZA", flag: "🇿🇦", dial: "+27" },
  { c: "IE", flag: "🇮🇪", dial: "+353" },
  { c: "DE", flag: "🇩🇪", dial: "+49" },
];

/**
 * Mobile number check for regional pricing. Supabase texts a 6-digit code (needs an SMS provider in
 * Supabase → Auth → Phone). Once verified, the number's country is used together with the location.
 */
export function PhoneVerify({ needed, phone, note, plan }: { needed: boolean; phone: string | null; note: string; plan?: string }) {
  const router = useRouter();
  const [country, setCountry] = useState<CountryCode>("AU");
  const [num, setNum] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(needed);

  const send = async () => {
    setErr(null);
    const p = parsePhoneNumberFromString(num, country);
    if (!p || !p.isValid()) return setErr("That number doesn't look right. Check the country and number.");
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ phone: p.number });
    setBusy(false);
    if (error) return setErr(error.message.includes("provider") || error.message.includes("disabled") ? "Text messages aren't set up yet. Please try again later." : error.message);
    setSentTo(p.number);
  };

  const verify = async () => {
    if (!sentTo) return;
    setErr(null);
    setBusy(true);
    const { error } = await createClient().auth.verifyOtp({ phone: sentTo, token: code.trim(), type: "phone_change" });
    setBusy(false);
    if (error) return setErr("That code didn't work. Check it, or send a new one.");
    if (plan) return router.push(`/app/checkout?plan=${plan}`);
    router.refresh();
  };

  const masked = phone ? `+${phone.replace(/^\+/, "").slice(0, -4).replace(/\d/g, "•")}${phone.slice(-4)}` : null;

  return (
    <div className={`card ${needed ? "!border-blood/50 bg-blood/10" : ""}`}>
      <p className="text-sm text-bone-dim">{note}</p>
      {masked && !open && (
        <p className="mt-2 text-sm">
          ✓ Verified mobile <span className="text-bone">{masked}</span>{" "}
          <button className="text-blood-400 underline underline-offset-4" onClick={() => setOpen(true)}>Change</button>
        </p>
      )}
      {!masked && !open && (
        <button className="mt-2 text-sm text-blood-400 underline underline-offset-4" onClick={() => setOpen(true)}>Verify my mobile number</button>
      )}
      {open && !sentTo && (
        <div className="mt-4">
          <div className="label">Mobile number</div>
          <div className="flex gap-2">
            <select className="input !w-auto !py-2" aria-label="Country code" value={country} onChange={(e) => setCountry(e.target.value as CountryCode)}>
              {CODES.map((x) => <option key={x.c} value={x.c}>{x.flag} {x.dial}</option>)}
            </select>
            <input className="input !py-2" aria-label="Mobile number" inputMode="tel" autoComplete="tel-national" placeholder={country === "IN" ? "98765 43210" : "412 345 678"} value={num} onChange={(e) => setNum(e.target.value)} />
          </div>
          <button className="btn-red mt-3 !py-2" disabled={busy || !num.trim()} onClick={send}>{busy ? "Sending…" : "Text me a code"}</button>
          <p className="mt-2 text-xs text-bone-mute">We use your number only to confirm your country for pricing. Standard SMS rates may apply.</p>
        </div>
      )}
      {open && sentTo && (
        <div className="mt-4">
          <div className="label">Code sent to {sentTo}</div>
          <div className="flex gap-2">
            <input className="input !py-2 tracking-[0.4em]" aria-label="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
            <button className="btn-red !py-2" disabled={busy || code.length < 6} onClick={verify}>{busy ? "Checking…" : "Verify"}</button>
          </div>
          <button className="mt-2 text-xs text-bone-dim underline underline-offset-4" onClick={() => { setSentTo(null); setCode(""); }}>Use a different number</button>
        </div>
      )}
      {err && <p className="mt-2 text-sm text-blood-400" role="alert">{err}</p>}
    </div>
  );
}
