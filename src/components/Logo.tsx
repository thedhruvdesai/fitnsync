import Link from "next/link";

/**
 * Liftkai mark: a bold "L" (lift) cradling a red plate — read as both a dinner
 * plate (kai = food) and a weight plate. The rim ring keeps it a plate at large sizes;
 * the silhouette alone holds up at 16px.
 */
export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <rect width="64" height="64" rx="15" fill="#0A0A0B" />
      <path d="M15 11 H26 V41 H51 V52 H19 Q15 52 15 48 Z" fill="#F4F1EC" />
      <circle cx="39.5" cy="27.5" r="10.5" fill="#E11D2E" />
      <circle cx="39.5" cy="27.5" r="6.6" fill="none" stroke="#0A0A0B" strokeWidth="1.5" opacity=".45" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} aria-label="Liftkai home" className="inline-flex items-center gap-2 text-bone">
      <LogoMark size={30} className="shrink-0" />
      <span className="h-display text-xl !tracking-[-0.025em]">
        Liftk<span className="text-blood-400">ai</span>
      </span>
    </Link>
  );
}
