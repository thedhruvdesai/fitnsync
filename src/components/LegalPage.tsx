import Link from "next/link";
import { Logo } from "./Logo";

export type LegalSection = [heading: string, body: string | string[]];

export function SiteFooterLinks() {
  return (
    <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-bone-mute">
      <Link href="/" className="hover:text-bone">Home</Link>
      <Link href="/faq" className="hover:text-bone">FAQ</Link>
      <Link href="/contact" className="hover:text-bone">Contact</Link>
      <Link href="/terms" className="hover:text-bone">Terms</Link>
      <Link href="/privacy" className="hover:text-bone">Privacy</Link>
    </nav>
  );
}

export function LegalPage({ title, sections, updated, intro }: { title: string; sections: LegalSection[]; updated?: string; intro?: string }) {
  return (
    <main className="relative z-10 mx-auto max-w-3xl px-6 py-10">
      <Logo />
      <h1 className="h-display mt-14 text-5xl md:text-6xl">{title}</h1>
      {updated && <p className="mt-3 text-sm text-bone-mute">Last updated {updated}</p>}
      {intro && <p className="mt-6 text-lg text-bone-dim">{intro}</p>}

      {sections.length > 5 && (
        <nav aria-label="Contents" className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <p className="eyebrow">Contents</p>
          <ol className="mt-3 grid gap-x-8 gap-y-1.5 text-sm text-bone-dim sm:grid-cols-2">
            {sections.map(([h], i) => (
              <li key={h}>
                <a href={`#s${i + 1}`} className="hover:text-bone">{i + 1}. {h}</a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="mt-12 space-y-10">
        {sections.map(([h, body], i) => (
          <section key={h} id={`s${i + 1}`} className="scroll-mt-8">
            <h2 className="text-xl font-semibold">
              <span className="mr-2 text-blood-400">{i + 1}.</span>
              {h}
            </h2>
            <div className="mt-3 space-y-3 leading-relaxed text-bone-dim">
              {(Array.isArray(body) ? body : [body]).map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-16 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <p className="font-semibold">Questions about this page?</p>
        <p className="mt-1 text-sm text-bone-dim">
          Send us a message through our <Link href="/contact" className="text-blood-400 underline underline-offset-4">contact form</Link> or email{" "}
          <a href="mailto:liftkai.fit@gmail.com" className="text-blood-400 underline underline-offset-4">liftkai.fit@gmail.com</a>.
        </p>
      </div>
      <div className="mt-10 border-t border-white/5 pt-6">
        <SiteFooterLinks />
      </div>
    </main>
  );
}
