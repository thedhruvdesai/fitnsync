import { Backdrop } from "./Backdrop";
import { Logo } from "./Logo";

export function AuthShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <>
      <Backdrop intensity={0.8} />
      <main className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
        <Logo />
        <div className="mt-16">
          <h1 className="h-display fade-up text-5xl leading-[0.95]">{title}</h1>
          <p className="fade-up mt-3 text-bone-dim" style={{ animationDelay: "120ms" }}>{sub}</p>
        </div>
        <div className="fade-up mt-8 rounded-3xl border border-white/10 bg-ink/60 p-6 backdrop-blur-xl" style={{ animationDelay: "220ms" }}>{children}</div>
      </main>
    </>
  );
}
