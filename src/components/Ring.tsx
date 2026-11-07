export function Ring({ value, max, label, unit, size = 112 }: { value: number; max: number; label: string; unit: string; size?: number }) {
  const pct = Math.min(1, max ? value / max : 0);
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const over = value > max * 1.1;
  return (
    <div className="flex min-w-0 flex-col items-center">
      <div className="relative aspect-square w-full" style={{ maxWidth: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="#26262A" strokeWidth={8} fill="none" />
          <circle cx={size / 2} cy={size / 2} r={r} stroke={over ? "#F59E0B" : "#E11D2E"} strokeWidth={8} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset .6s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="h-display text-[clamp(1.1rem,5.5vw,1.5rem)] leading-none">{Math.round(value).toLocaleString()}</div>
          <div className="mt-1 whitespace-nowrap text-[10px] text-bone-mute min-[380px]:text-[11px]">/ {max.toLocaleString()} {unit}</div>
        </div>
      </div>
      <div className="mt-2 text-[10px] uppercase tracking-[0.14em] text-bone-dim min-[380px]:text-xs min-[380px]:tracking-[0.18em]">{label}</div>
    </div>
  );
}
