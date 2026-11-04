import { Logo } from "./Logo";

export function LegalPage({ title, sections }: { title: string; sections: [string, string][] }) {
  return (
    <main className="relative z-10 mx-auto max-w-2xl px-6 py-10">
      <Logo />
      <h1 className="h-display mt-14 text-5xl">{title}</h1>
      <p className="mt-2 text-sm text-bone-mute">Template only. Have this reviewed before launch.</p>
      <div className="mt-10 space-y-8">
        {sections.map(([h, p]) => (
          <section key={h}>
            <h2 className="text-lg font-semibold">{h}</h2>
            <p className="mt-2 text-bone-dim">{p}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
