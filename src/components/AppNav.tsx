"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

type Item = { href: string; label: string; icon: string };

const TODAY: Item = { href: "/app", label: "Today", icon: "M12 3v2m0 14v2m9-9h-2M5 12H3m14.36 6.36-1.41-1.41M8.05 8.05 6.64 6.64m10.72 0-1.41 1.41M8.05 15.95l-1.41 1.41M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" };
const CALENDAR: Item = { href: "/app/calendar", label: "Calendar", icon: "M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 10h2m4 0h2" };
const PLAN: Item = { href: "/app/plan", label: "Plan", icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4" };
const EXERCISES: Item = { href: "/app/exercises", label: "Exercises", icon: "M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" };
const RECIPES: Item = { href: "/app/recipes", label: "Recipes", icon: "M12 3c-3 0-5 2-5 4.5 0 1.6.9 2.8 2 3.5V20h6v-9c1.1-.7 2-1.9 2-3.5C17 5 15 3 12 3Zm-3 13h6" };
const PROGRESS: Item = { href: "/app/progress", label: "Progress", icon: "M3 17l6-6 4 4 8-8M15 7h6v6" };
const BODY: Item = { href: "/app/body", label: "Body", icon: "M12 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-5 6h10m-5 0v5m0 0-3 5m3-5 3 5" };
const REPORTS: Item = { href: "/app/reports", label: "Reports", icon: "M9 17v-6m4 6V7m4 10v-3M5 21h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Z" };
const COACH: Item = { href: "/app/coach", label: "Coach", icon: "M8 10h8M8 14h5m-9 6 3-3h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12Z" };
const ACCOUNT: Item = { href: "/app/billing", label: "Plan & account", icon: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21a8 8 0 0 1 16 0" };

/** Desktop shows everything; phones get 4 main tabs + More. */
const DESKTOP = [TODAY, CALENDAR, PLAN, RECIPES, EXERCISES, PROGRESS, BODY, REPORTS, COACH];
const TABS = [TODAY, CALENDAR, PLAN, EXERCISES];
const MORE = [RECIPES, PROGRESS, BODY, REPORTS, COACH, ACCOUNT];

function Icon({ d, className = "h-5 w-5" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function AppNav({ tier, name }: { tier: string; name?: string | null }) {
  const path = usePathname();
  const router = useRouter();
  const [more, setMore] = useState(false);
  const active = (href: string) => (href === "/app" ? path === "/app" : path.startsWith(href));
  const moreActive = MORE.some((i) => active(i.href));

  /** Tapping the tab you're already on takes you back to Today. */
  const toggle = (href: string) => (e: React.MouseEvent) => {
    if (href !== "/app" && path === href) {
      e.preventDefault();
      router.push("/app");
    }
  };

  useEffect(() => setMore(false), [path]);
  useEffect(() => {
    if (!more) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMore(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [more]);

  return (
    <>
      {/* desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-white/5 bg-ink px-5 py-7 md:flex">
        <Logo href="/app" />
        <nav className="mt-10 flex flex-col gap-1" aria-label="Main">
          {DESKTOP.map((i) => (
            <Link key={i.href} href={i.href} onClick={toggle(i.href)} onTouchStart={() => router.prefetch(i.href)} onMouseEnter={() => router.prefetch(i.href)} aria-current={active(i.href) ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active(i.href) ? "bg-blood/15 text-bone" : "text-bone-dim hover:bg-white/5 hover:text-bone"}`}>
              <Icon d={i.icon} /> {i.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <Link href="/app/billing" className="block rounded-xl border border-white/10 p-3 text-sm hover:border-white/25">
            <div className="text-bone">{name || "Account"}</div>
            <div className="text-xs uppercase tracking-widest text-blood-400">{tier === "free" ? "Free · Upgrade" : tier}</div>
          </Link>
        </div>
      </aside>

      {/* mobile top bar */}
      <header className="no-print sticky top-0 z-20 flex items-center justify-between border-b border-white/5 bg-ink/85 px-5 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur md:hidden">
        <Logo href="/app" />
        <Link href="/app/billing" className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-widest text-blood-400">{tier === "free" ? "Upgrade" : tier}</Link>
      </header>

      {/* mobile tab bar */}
      <nav className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-white/5 bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Main">
        {TABS.map((i) => (
          <Link key={i.href} href={i.href} onClick={toggle(i.href)} onTouchStart={() => router.prefetch(i.href)} onMouseEnter={() => router.prefetch(i.href)} aria-current={active(i.href) ? "page" : undefined} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${active(i.href) && !more ? "text-blood-400" : "text-bone-dim"}`}>
            <Icon d={i.icon} className="h-6 w-6" /> {i.label}
          </Link>
        ))}
        <button onClick={() => setMore(!more)} aria-expanded={more} aria-haspopup="menu" className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${more || moreActive ? "text-blood-400" : "text-bone-dim"}`}>
          <Icon d="M5 12h.01M12 12h.01M19 12h.01" className="h-6 w-6" /> More
        </button>
      </nav>

      {more && (
        <div className="fixed inset-0 z-20 md:hidden" onClick={() => setMore(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div role="menu" aria-label="More" className="sheet-in absolute inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] mx-3 rounded-3xl border border-white/10 bg-ink-2 p-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {MORE.map((i) => (
              <Link key={i.href} role="menuitem" href={i.href} onTouchStart={() => router.prefetch(i.href)} aria-current={active(i.href) ? "page" : undefined} className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-base transition ${active(i.href) ? "bg-blood/15 text-bone" : "text-bone-dim hover:bg-white/5"}`}>
                <Icon d={i.icon} /> {i.label}
                <span className="ml-auto text-bone-mute">›</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
