import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SiteFooterLinks } from "@/components/LegalPage";
import { CONTACT_EMAIL, FAQ_GROUPS } from "@/lib/faq";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact us · Liftkai",
  description: "Questions about your plan, billing, the AI coach or partnerships? Send Liftkai a message and we'll reply within 1–2 business days.",
};

const QUICK = [FAQ_GROUPS[4].items[1], FAQ_GROUPS[4].items[3], FAQ_GROUPS[4].items[4], FAQ_GROUPS[5].items[1]];

export default async function ContactPage(props: { searchParams: Promise<{ topic?: string }> }) {
  const searchParams = await props.searchParams;
  return (
    <main className="relative z-10 mx-auto max-w-6xl px-6 py-10">
      <Logo />
      <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:grid-rows-[auto_1fr] lg:gap-y-0">
        <div>
          <p className="eyebrow">Contact</p>
          <h1 className="h-display mt-3 text-5xl md:text-7xl">Ask us<br />anything.</h1>
          <p className="mt-5 max-w-md text-lg text-bone-dim">
            A question about your plan, billing, the AI coach or working with us? Send a message and a real person will get back to you.
          </p>
        </div>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pt-6">
          <ContactForm defaultType={searchParams.topic} />
          <p className="mt-4 text-xs text-bone-mute">
            In a medical emergency, call 000 (Australia) or your local emergency number. Liftkai can't give medical advice.
          </p>
        </div>

        <div className="lg:col-start-1 lg:row-start-2">

          <div className="space-y-4 lg:mt-10">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-blood-400" aria-hidden>✉</span>
              <div>
                <p className="text-sm text-bone-mute">Email</p>
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold hover:text-blood-400">{CONTACT_EMAIL}</a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-blood-400" aria-hidden>◷</span>
              <div>
                <p className="text-sm text-bone-mute">Response time</p>
                <p className="font-semibold">Within 1–2 business days</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-blood-400" aria-hidden>⌖</span>
              <div>
                <p className="text-sm text-bone-mute">Based in</p>
                <p className="font-semibold">Gold Coast, Australia · serving members worldwide</p>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <p className="eyebrow">Quick answers</p>
            <div className="mt-4 divide-y divide-white/10 border-y border-white/10">
              {QUICK.map((f) => (
                <details key={f.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                    {f.q}
                    <span className="text-blood-400 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-bone-dim">{f.a}</p>
                </details>
              ))}
            </div>
            <Link href="/faq" className="mt-4 inline-block text-sm text-bone underline underline-offset-4">Browse all FAQs →</Link>
          </div>
        </div>

      </div>

      <div className="mt-20 border-t border-white/5 pt-6">
        <SiteFooterLinks />
      </div>
    </main>
  );
}
