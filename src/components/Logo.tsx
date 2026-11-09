import Link from "next/link";

/** PlateLift mark: a fork (food) and a weight plate (lifting) that together form a "P". */
export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <rect width="64" height="64" rx="15" fill="#0A0A0B" />
      <g transform="translate(1 2)">
        <circle cx="36" cy="26" r="15" fill="#E11D2E" />
        <circle cx="36" cy="26" r="10" fill="none" stroke="#0A0A0B" strokeWidth="1.6" opacity=".55" />
        <circle cx="36" cy="26" r="4" fill="#0A0A0B" />
        <path d="M21.5 6.5 V54" stroke="#0A0A0B" strokeWidth="9" strokeLinecap="round" />
        <path d="M14.5 6.5 V16.5 Q14.5 22.5 21.5 22.5 Q28.5 22.5 28.5 16.5 V6.5" stroke="#0A0A0B" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <g stroke="#F4F1EC" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeWidth="4.2">
          <path d="M14.5 6.5 V16.5 Q14.5 22.5 21.5 22.5 Q28.5 22.5 28.5 16.5 V6.5" />
          <path d="M21.5 6.5 V15" />
          <path d="M21.5 22.5 V54" />
        </g>
      </g>
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} aria-label="PlateLift home" className="inline-flex items-center gap-2 text-bone">
      <LogoMark size={30} className="shrink-0" />
      <span className="h-display text-xl !tracking-[-0.02em]">
        Plate<span className="text-blood-400">Lift</span>
      </span>
    </Link>
  );
}
