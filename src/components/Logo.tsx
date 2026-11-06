import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="h-display text-xl text-bone">
      Fit<span className="text-blood-400">&amp;</span>Sync
    </Link>
  );
}
