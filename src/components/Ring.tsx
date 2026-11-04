export function Ring({ value, max, label, unit, size = 112 }: { value: number; max: number; label: string; unit: string; size?: number }) {
  const pct = Math.min(1, max ? value / max : 0);
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const over = value > max * 1.1;
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="#26262A" strokeWidth={8} fill="none" />
          <circle cx={size / 2} cy={size / 2} r={r} stroke={over ? "#F59E0B" : "#E11D2E"} strokeWidth={8} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset .6s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="h-display text-2xl leading-none">{Math.round(value).toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-bone-mute">/ {max.toLocaleString()} {unit}</div>
        </div>
      </div>
      <div className="mt-2 text-xs uppercase tracking-[0.18em] text-bone-dim">{label}</div>
    </div>
  );
}
