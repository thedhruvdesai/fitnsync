import Link from "next/link";
import { useId } from "react";
import { WORDMARK_GLYPHS, WORDMARK_SPARK, WORDMARK_VIEWBOX } from "./brand-paths";

/**
 * Liftkai "Power Plate" symbol: a weight plate (gym) that is also a piece of fresh
 * produce (food) with a leaf (nutrition) and an AI spark at its core.
 */
export function LogoMark({ size = 32, className = "", tile = true }: { size?: number; className?: string; tile?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`pp${id}`} cx=".36" cy=".3" r=".85">
          <stop offset="0" stopColor="#FF4A59" />
          <stop offset=".55" stopColor="#E11D2E" />
          <stop offset="1" stopColor="#A50B1A" />
        </radialGradient>
      </defs>
      {tile && <rect width="64" height="64" rx="15" fill="#0A0A0B" />}
      <circle cx="32" cy="35" r="21" fill={`url(#pp${id})`} />
      <circle cx="32" cy="35" r="16.2" fill="none" stroke="#0A0A0B" strokeWidth="1.3" opacity=".3" />
      <circle cx="32" cy="35" r="10.6" fill="#0A0A0B" opacity=".9" />
      <path d="M32 26.4 C32.9 32.4 34.6 34.1 40.6 35 C34.6 35.9 32.9 37.6 32 43.6 C31.1 37.6 29.4 35.9 23.4 35 C29.4 34.1 31.1 32.4 32 26.4 Z" fill="#F4F1EC" />
      <path d="M33.2 14.2 C33.2 8.4 37 4.8 42.8 4.8 C42.8 10.6 39 14.2 33.2 14.2 Z" fill="#F4F1EC" />
      <path d="M32 15 V9.8" stroke="#F4F1EC" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/** Custom wordmark: "liftkai" with the AI spark as the dot of the last "i". Inherits text colour. */
export function Wordmark({ height = 22, className = "" }: { height?: number; className?: string }) {
  const [, , w, h] = WORDMARK_VIEWBOX.split(" ").map(Number);
  return (
    <svg viewBox={WORDMARK_VIEWBOX} height={height} width={(height * w) / h} className={className} role="img" aria-label="Liftkai">
      <g transform="scale(1,-1)">
        <g fill="currentColor">
          {WORDMARK_GLYPHS.map(([x, d], i) => (
            <path key={i} transform={`translate(${x} 0)`} d={d} />
          ))}
        </g>
        <path d={WORDMARK_SPARK} fill="#E11D2E" />
      </g>
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} aria-label="Liftkai home" className="inline-flex items-center gap-2.5 text-bone">
      <LogoMark size={32} className="shrink-0" />
      <Wordmark height={24} />
    </Link>
  );
}
