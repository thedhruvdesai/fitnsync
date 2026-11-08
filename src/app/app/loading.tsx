/** Shown instantly while a tab's data loads, so taps feel immediate. */
export default function Loading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading">
      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-bone-mute">
        <svg viewBox="0 0 120 24" className="h-5 w-24" aria-hidden>
          <path className="ecg-draw" d="M0 12 H34 L40 6 L46 12 H52 L56 15 L61 2 L66 21 L70 12 H82 Q88 6 94 12 H120" fill="none" stroke="#E11D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Loading
      </div>
      <div className="skeleton h-10 w-2/3 rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => <div key={i} className="skeleton h-24 rounded-3xl" />)}
      </div>
      <div className="skeleton h-40 rounded-3xl" />
      <div className="skeleton h-64 rounded-3xl" />
    </div>
  );
}
