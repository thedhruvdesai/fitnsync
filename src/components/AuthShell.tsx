import { Logo } from "./Logo";

export function AuthShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <main className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
      <Logo />
      <div className="mt-16">
        <h1 className="h-display text-4xl leading-none">{title}</h1>
        <p className="mt-3 text-bone-dim">{sub}</p>
      </div>
      <div className="mt-8">{children}</div>
    </main>
  );
}
