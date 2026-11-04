import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="h-display text-xl text-bone">
      Fit<span className="text-blood">&amp;</span>Sync
    </Link>
  );
}
