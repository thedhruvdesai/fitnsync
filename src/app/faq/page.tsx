import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SiteFooterLinks } from "@/components/LegalPage";
import { CONTACT_EMAIL, FAQ_GROUPS } from "@/lib/faq";

export const metadata: Metadata = {
  title: "FAQ · Liftkai",
  description: "Answers about Liftkai: how your AI meal plan and training program are built, food photo logging, the AI coach, free trial, pricing, cancelling and privacy.",
};

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_GROUPS.flatMap((g) => g.items).map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main className="relative z-10 mx-auto max-w-4xl px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Logo />
      <p className="eyebrow mt-14">Help centre</p>
      <h1 className="h-display mt-3 text-5xl md:text-7xl">Questions, answered.</h1>
      <p className="mt-5 max-w-2xl text-lg text-bone-dim">
        Everything about your plan, food logging, training, the AI coach and billing. Can't find it?{" "}
        <Link href="/contact" className="text-blood-400 underline underline-offset-4">Ask us directly</Link>.
      </p>

      <nav aria-label="FAQ topics" className="mt-10 flex flex-wrap gap-2">
        {FAQ_GROUPS.map((g) => (
          <a key={g.id} href={`#${g.id}`} className="rounded-full border border-white/15 px-4 py-2 text-sm text-bone-dim transition hover:border-blood/60 hover:text-bone">
            {g.title}
          </a>
        ))}
      </nav>

      <div className="mt-12 space-y-16">
        {FAQ_GROUPS.map((g) => (
          <section key={g.id} id={g.id} className="scroll-mt-8">
            <h2 className="h-display text-3xl md:text-4xl">{g.title}</h2>
            <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
              {g.items.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold">
                    {f.q}
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/15 text-blood-400 transition group-open:rotate-45 group-open:bg-blood group-open:text-white">+</span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-bone-dim">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-20 overflow-hidden rounded-[32px] border border-blood/30 bg-gradient-to-br from-blood/20 to-transparent p-10">
        <h2 className="h-display text-3xl md:text-4xl">Still have a question?</h2>
        <p className="mt-3 max-w-xl text-bone-dim">Send us a message and we'll get back to you within 1–2 business days.</p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link href="/contact" className="btn-red !px-7 !py-3.5">Contact us →</Link>
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm text-bone-dim underline underline-offset-4 hover:text-bone">{CONTACT_EMAIL}</a>
        </div>
      </div>

      <div className="mt-12 border-t border-white/5 pt-6">
        <SiteFooterLinks />
      </div>
    </main>
  );
}
