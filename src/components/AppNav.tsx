"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const ITEMS = [
  { href: "/app", label: "Today", icon: "M12 3v2m0 14v2m9-9h-2M5 12H3m14.36 6.36-1.41-1.41M8.05 8.05 6.64 6.64m10.72 0-1.41 1.41M8.05 15.95l-1.41 1.41M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" },
  { href: "/app/plan", label: "Plan", icon: "M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" },
  { href: "/app/exercises", label: "Exercises", icon: "M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" },
  { href: "/app/progress", label: "Progress", icon: "M3 17l6-6 4 4 8-8M15 7h6v6" },
  { href: "/app/reports", label: "Reports", icon: "M9 17v-6m4 6V7m4 10v-3M5 21h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Z" },
  { href: "/app/coach", label: "Coach", icon: "M8 10h8M8 14h5m-9 6 3-3h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12Z" },
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d={d} />
    </svg>
  );
}

export function AppNav({ tier, name }: { tier: string; name?: string | null }) {
  const path = usePathname();
  const active = (href: string) => (href === "/app" ? path === "/app" : path.startsWith(href));
  return (
    <>
      {/* desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-white/5 bg-ink px-5 py-7 md:flex">
        <Logo href="/app" />
        <nav className="mt-10 flex flex-col gap-1">
          {ITEMS.map((i) => (
            <Link key={i.href} href={i.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active(i.href) ? "bg-blood/15 text-bone" : "text-bone-dim hover:bg-white/5 hover:text-bone"}`}>
              <Icon d={i.icon} /> {i.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <Link href="/app/billing" className="block rounded-xl border border-white/10 p-3 text-sm hover:border-white/25">
            <div className="text-bone">{name || "Account"}</div>
            <div className="text-xs uppercase tracking-widest text-blood">{tier === "free" ? "Free · Upgrade" : tier}</div>
          </Link>
        </div>
      </aside>
      {/* mobile top bar */}
      <header className="no-print sticky top-0 z-20 flex items-center justify-between border-b border-white/5 bg-ink/85 px-5 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur md:hidden">
        <Logo href="/app" />
        <Link href="/app/billing" className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-widest text-blood">{tier === "free" ? "Upgrade" : tier}</Link>
      </header>
      {/* mobile tab bar */}
      <nav className="no-print fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 border-t border-white/5 bg-ink/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {ITEMS.map((i) => (
          <Link key={i.href} href={i.href} className={`flex flex-col items-center gap-1 py-2.5 text-[10px] ${active(i.href) ? "text-blood" : "text-bone-mute"}`}>
            <Icon d={i.icon} /> {i.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
