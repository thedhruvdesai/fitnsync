export function LineChart({ points, height = 180, unit = "", target }: { points: { label: string; value: number | null }[]; height?: number; unit?: string; target?: number }) {
  const vals = points.map((p) => p.value).filter((v): v is number => v != null);
  if (vals.length < 2) return <div className="grid h-40 place-items-center text-sm text-bone-mute">Log at least two days to see a trend.</div>;
  const all = target != null ? [...vals, target] : vals;
  const min = Math.min(...all) - 0.5;
  const max = Math.max(...all) + 0.5;
  const W = 600;
  const x = (i: number) => (i / (points.length - 1)) * (W - 40) + 20;
  const y = (v: number) => height - 24 - ((v - min) / (max - min)) * (height - 48);
  const coords = points.map((p, i) => (p.value == null ? null : [x(i), y(p.value)] as const)).filter(Boolean) as (readonly [number, number])[];
  const d = coords.map(([a, b], i) => `${i ? "L" : "M"}${a.toFixed(1)},${b.toFixed(1)}`).join(" ");
  const area = `${d} L${coords[coords.length - 1][0]},${height - 24} L${coords[0][0]},${height - 24} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label="trend chart">
      <defs>
        <linearGradient id="lg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#E11D2E" stopOpacity=".35" />
          <stop offset="1" stopColor="#E11D2E" stopOpacity="0" />
        </linearGradient>
      </defs>
      {target != null && (
        <>
          <line x1={20} x2={W - 20} y1={y(target)} y2={y(target)} stroke="#6B6862" strokeDasharray="4 6" />
          <text x={W - 20} y={y(target) - 6} textAnchor="end" fontSize="11" fill="#A8A49D">goal {target}{unit}</text>
        </>
      )}
      <path d={area} fill="url(#lg)" />
      <path d={d} fill="none" stroke="#E11D2E" strokeWidth={2.5} strokeLinejoin="round" />
      {coords.map(([a, b], i) => <circle key={i} cx={a} cy={b} r={3} fill="#0A0A0B" stroke="#E11D2E" strokeWidth={2} />)}
      <text x={20} y={height - 6} fontSize="11" fill="#948F88">{points[0].label}</text>
      <text x={W - 20} y={height - 6} fontSize="11" fill="#948F88" textAnchor="end">{points[points.length - 1].label}</text>
      <text x={coords[coords.length - 1][0]} y={coords[coords.length - 1][1] - 10} fontSize="12" fill="#F4F1EC" textAnchor="end">{vals[vals.length - 1]}{unit}</text>
    </svg>
  );
}

export function Bars({ data, target, height = 150, unit = "" }: { data: { label: string; value: number }[]; target: number; height?: number; unit?: string }) {
  const max = Math.max(target * 1.25, ...data.map((d) => d.value), 1);
  const W = 600;
  const bw = (W - 40) / data.length;
  const y = (v: number) => height - 22 - (v / max) * (height - 40);
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label="bar chart">
      {data.map((d, i) => {
        const hit = d.value >= target * 0.9 && d.value <= target * 1.1;
        return (
          <g key={i}>
            <rect x={20 + i * bw + bw * 0.18} y={y(d.value)} width={bw * 0.64} height={Math.max(0, height - 22 - y(d.value))} rx={3} fill={d.value === 0 ? "#26262A" : hit ? "#E11D2E" : "#7A1520"} />
            {data.length <= 14 && <text x={20 + i * bw + bw / 2} y={height - 6} fontSize="10" fill="#948F88" textAnchor="middle">{d.label}</text>}
          </g>
        );
      })}
      <line x1={20} x2={W - 20} y1={y(target)} y2={y(target)} stroke="#F4F1EC" strokeOpacity=".5" strokeDasharray="4 6" />
      <text x={W - 20} y={y(target) - 6} fontSize="11" fill="#A8A49D" textAnchor="end">target {target.toLocaleString()}{unit}</text>
    </svg>
  );
}
