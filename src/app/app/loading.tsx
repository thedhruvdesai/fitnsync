/** Shown instantly while a tab's data loads, so taps feel immediate. */
export default function Loading() {
  return (
    <div className="animate-pulse space-y-5" aria-busy="true" aria-label="Loading">
      <div className="h-3 w-24 rounded-full bg-white/10" />
      <div className="h-10 w-2/3 rounded-2xl bg-white/10" />
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-3xl bg-white/[0.06]" />)}
      </div>
      <div className="h-40 rounded-3xl bg-white/[0.06]" />
      <div className="h-64 rounded-3xl bg-white/[0.06]" />
    </div>
  );
}
