"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { LineChart } from "@/components/Charts";
import { createClient } from "@/lib/supabase/client";
import { isoDate } from "@/lib/report";
import { cmTo, kgTo, toCm, toKg, UnitToggle, useUnits, type Units } from "@/lib/units";

export type Pose = "front" | "side" | "back";
export interface Checkin {
  id?: number;
  checkin_date: string;
  weight_kg: number | null;
  body_fat: number | null;
  waist_cm: number | null;
  chest_cm: number | null;
  hips_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
  photos: Partial<Record<Pose, string>>;
  notes: string | null;
}

const POSES: Pose[] = ["front", "side", "back"];
type Kind = "w" | "l" | "pct";
const MEASURES: { k: keyof Checkin; label: string; kind: Kind }[] = [
  { k: "weight_kg", label: "Weight", kind: "w" },
  { k: "body_fat", label: "Body fat", kind: "pct" },
  { k: "waist_cm", label: "Waist", kind: "l" },
  { k: "chest_cm", label: "Chest", kind: "l" },
  { k: "hips_cm", label: "Hips", kind: "l" },
  { k: "arm_cm", label: "Arm", kind: "l" },
  { k: "thigh_cm", label: "Thigh", kind: "l" },
];
/** Stored values are always kg / cm; these convert for display and input. */
const unitOf = (kind: Kind, u: Units) => (kind === "w" ? u.w : kind === "l" ? u.l : "%");
const show = (kind: Kind, v: number, u: Units) => (kind === "w" ? kgTo(v, u.w) : kind === "l" ? cmTo(v, u.l) : v);
const store = (kind: Kind, v: number, u: Units) => (kind === "w" ? toKg(v, u.w) : kind === "l" ? toCm(v, u.l) : v);
const fmt = (kind: Kind, v: number, u: Units) => `${show(kind, v, u)}${kind === "pct" ? "%" : ` ${unitOf(kind, u)}`}`;
const BUCKET = "progress-photos";
const short = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" });
const long = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

async function compress(file: File, max = 1280): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("Couldn't read that image"));
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise<Blob>((res) => c.toBlob((b) => res(b!), "image/jpeg", 0.82));
  } finally {
    URL.revokeObjectURL(url);
  }
}

const emptyForm = (date: string): Checkin => ({ checkin_date: date, weight_kg: null, body_fat: null, waist_cm: null, chest_cm: null, hips_cm: null, arm_cm: null, thigh_cm: null, photos: {}, notes: null });

export function BodyView({ userId, initial, setupNeeded, goalWeight, today }: { userId: string; initial: Checkin[]; setupNeeded: boolean; goalWeight: number | null; today: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [list, setList] = useState<Checkin[]>(initial);
  const [form, setForm] = useState<Checkin>(() => initial.find((c) => c.checkin_date === today) ?? emptyForm(today));
  const [files, setFiles] = useState<Partial<Record<Pose, { blob: Blob; preview: string }>>>({});
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [chart, setChart] = useState<keyof Checkin>("weight_kg");
  const inputs = useRef<Partial<Record<Pose, HTMLInputElement | null>>>({});
  const [units, setUnits] = useUnits();
  // text being typed, so converting units never fights the keyboard
  const [draft, setDraft] = useState<Partial<Record<keyof Checkin, string>>>({});
  useEffect(() => {
    const d: Partial<Record<keyof Checkin, string>> = {};
    for (const m of MEASURES) {
      const v = form[m.k] as number | null;
      d[m.k] = v == null ? "" : String(show(m.kind, v, units));
    }
    setDraft(d);
    // re-sync when switching day or units, not on every keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.checkin_date, form.id, units.w, units.l]);

  // signed URLs for private photos
  useEffect(() => {
    const paths = list.flatMap((c) => Object.values(c.photos ?? {})).filter((p): p is string => !!p && !urls[p]);
    if (!paths.length) return;
    supabase.storage
      .from(BUCKET)
      .createSignedUrls(paths, 60 * 60 * 6)
      .then(({ data }) => {
        if (!data) return;
        setUrls((u) => {
          const next = { ...u };
          for (const d of data) if (d.signedUrl && d.path) next[d.path] = d.signedUrl;
          return next;
        });
      });
  }, [list, supabase, urls]);

  function loadDate(d: string) {
    setForm(list.find((c) => c.checkin_date === d) ?? emptyForm(d));
    setFiles({});
    setMsg(null);
  }

  async function pick(pose: Pose, f?: File | null) {
    if (!f) return;
    try {
      const blob = await compress(f);
      setFiles((x) => ({ ...x, [pose]: { blob, preview: URL.createObjectURL(blob) } }));
    } catch (e) {
      setMsg({ ok: false, t: (e as Error).message });
    }
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const photos = { ...(form.photos ?? {}) };
      for (const pose of POSES) {
        const f = files[pose];
        if (!f) continue;
        const path = `${userId}/${form.checkin_date}-${pose}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, f.blob, { contentType: "image/jpeg", upsert: false });
        if (error) throw new Error(`Photo upload failed: ${error.message}`);
        if (photos[pose]) await supabase.storage.from(BUCKET).remove([photos[pose]!]);
        photos[pose] = path;
      }
      const row = { ...form, photos, user_id: userId, updated_at: new Date().toISOString() };
      delete (row as { id?: number }).id;
      const { data, error } = await supabase.from("body_checkins").upsert(row, { onConflict: "user_id,checkin_date" }).select().single();
      if (error) throw new Error(error.message);
      if (form.weight_kg != null) await supabase.from("daily_logs").upsert({ user_id: userId, log_date: form.checkin_date, weight_kg: form.weight_kg }, { onConflict: "user_id,log_date" });
      const saved = data as Checkin;
      setList((l) => [saved, ...l.filter((c) => c.checkin_date !== saved.checkin_date)].sort((a, b) => b.checkin_date.localeCompare(a.checkin_date)));
      setForm(saved);
      setFiles({});
      setMsg({ ok: true, t: "Check-in saved ✓" });
    } catch (e) {
      setMsg({ ok: false, t: (e as Error).message });
    }
    setSaving(false);
  }

  const [zipping, setZipping] = useState<string | null>(null);
  async function downloadPhotos() {
    const all = list.flatMap((c) => POSES.filter((p) => c.photos?.[p]).map((p) => ({ date: c.checkin_date, pose: p, path: c.photos[p]! })));
    if (!all.length) return;
    setZipping("Preparing…");
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      let n = 0;
      for (const f of all) {
        const { data, error } = await supabase.storage.from(BUCKET).download(f.path);
        if (error || !data) continue;
        zip.file(`${f.date}-${f.pose}.jpg`, data);
        setZipping(`Adding ${++n} of ${all.length}…`);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `fitsync-progress-photos-${today}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
      setZipping(null);
    } catch (e) {
      setZipping(`Download failed: ${(e as Error).message}`);
    }
  }
  const photoCount = list.reduce((a, c) => a + POSES.filter((p) => c.photos?.[p]).length, 0);

  async function remove(c: Checkin) {
    if (!confirm(`Delete the check-in from ${long(c.checkin_date)}? Photos will be deleted too.`)) return;
    const paths = Object.values(c.photos ?? {}).filter(Boolean) as string[];
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
    await supabase.from("body_checkins").delete().eq("user_id", userId).eq("checkin_date", c.checkin_date);
    setList((l) => l.filter((x) => x.checkin_date !== c.checkin_date));
    if (form.checkin_date === c.checkin_date) setForm(emptyForm(c.checkin_date));
  }

  const asc = [...list].reverse();
  const first = asc[0];
  const last = list[0];
  const delta = (k: keyof Checkin) => {
    const a = asc.find((c) => c[k] != null)?.[k] as number | undefined;
    const b = list.find((c) => c[k] != null)?.[k] as number | undefined;
    return a != null && b != null && asc.length > 1 ? Math.round((b - a) * 10) / 10 : null;
  };
  const chartMeta = MEASURES.find((m) => m.k === chart)!;
  const points = asc.filter((c) => c[chart] != null).map((c) => ({ label: short(c.checkin_date), value: show(chartMeta.kind, Number(c[chart]), units) }));

  if (setupNeeded)
    return (
      <div className="space-y-4">
        <h1 className="h-display text-4xl">Body</h1>
        <div className="card text-sm text-bone-dim">
          Body tracking needs a one-time database update. In Supabase → SQL Editor, run <code className="text-bone">supabase/quick-log-body.sql</code> from the project, then refresh this page.
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Body check-in</p>
        <h1 className="h-display mt-1 text-4xl md:text-5xl">Body</h1>
        <p className="mt-2 text-sm text-bone-dim">Check in once a week, same time, same light. Photos are private: only you can see them.</p>
      </div>

      {list.length > 1 && (
        <div className="grid grid-cols-3 gap-3">
          {(["weight_kg", "waist_cm", "body_fat"] as const).map((k) => {
            const m = MEASURES.find((x) => x.k === k)!;
            const d = delta(k);
            return (
              <div key={k} className="card !p-3">
                <div className="text-[11px] uppercase tracking-widest text-bone-mute">{m.label}</div>
                <div className="h-display mt-1 text-xl">{d == null ? "—" : `${d > 0 ? "+" : ""}${m.kind === "pct" ? d : show(m.kind, d, units)}${m.kind === "pct" ? "%" : ` ${unitOf(m.kind, units)}`}`}</div>
                <div className="text-[10px] text-bone-mute">since {first ? short(first.checkin_date) : ""}</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* form */}
        <section className="card space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="h-display text-xl">{form.checkin_date === today ? "Today's check-in" : `Check-in · ${long(form.checkin_date)}`}</h2>
            <input type="date" max={today} value={form.checkin_date} onChange={(e) => e.target.value && loadDate(e.target.value)} className="rounded-xl border border-white/10 bg-ink-3 px-2 py-1.5 text-xs" aria-label="Check-in date" />
          </div>

          <div>
            <div className="label">Progress photos</div>
            <div className="grid grid-cols-3 gap-2">
              {POSES.map((pose) => {
                const src = files[pose]?.preview ?? (form.photos?.[pose] ? urls[form.photos[pose]!] : undefined);
                return (
                  <button key={pose} type="button" onClick={() => inputs.current[pose]?.click()} className="relative aspect-[3/4] overflow-hidden rounded-xl border border-dashed border-white/15 bg-white/[0.03] text-xs text-bone-mute transition hover:border-white/40">
                    {src ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={src} alt={`${pose} photo`} className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full place-items-center">📸<br />Add</span>
                    )}
                    <span className="absolute inset-x-0 bottom-0 bg-ink/70 py-1 text-center capitalize text-bone backdrop-blur">{pose}</span>
                    <input ref={(el) => { inputs.current[pose] = el; }} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => pick(pose, e.target.files?.[0])} />
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-bone-mute">Tip: fitted clothes, arms relaxed, phone at chest height.</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="label !mb-0">Measurements</div>
            <div className="flex gap-2">
              <UnitToggle label="Weight unit" value={units.w} onChange={(w) => setUnits({ w })} options={[{ v: "kg", label: "kg" }, { v: "lb", label: "lb" }]} />
              <UnitToggle label="Length unit" value={units.l} onChange={(l) => setUnits({ l })} options={[{ v: "cm", label: "cm" }, { v: "in", label: "inches" }]} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MEASURES.map((m) => (
              <label key={m.k} className="rounded-xl bg-ink-3 px-3 py-2">
                <span className="block text-[10px] uppercase tracking-wider text-bone-mute">{m.label}</span>
                <span className="flex items-baseline gap-1">
                  <input
                    inputMode="decimal"
                    className="w-full min-w-0 bg-transparent text-lg outline-none"
                    value={draft[m.k] ?? ""}
                    placeholder="—"
                    onChange={(e) => {
                      const raw = e.target.value.replace(",", ".");
                      setDraft({ ...draft, [m.k]: raw });
                      const n = Number(raw);
                      setForm({ ...form, [m.k]: raw === "" || !Number.isFinite(n) ? null : Math.round(store(m.kind, n, units) * 100) / 100 });
                    }}
                  />
                  <span className="text-xs text-bone-mute">{unitOf(m.kind, units) === "in" ? "in" : unitOf(m.kind, units)}</span>
                </span>
              </label>
            ))}
          </div>
          {units.l === "in" && <p className="-mt-2 text-[11px] text-bone-mute">Measure around the widest part, tape snug but not tight.</p>}
          <textarea className="input min-h-[60px] text-sm" placeholder="Notes (how you feel, clothes fit, energy…)" value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value || null })} />
          {msg && <p className={`text-sm ${msg.ok ? "text-emerald-300" : "text-blood-400"}`}>{msg.t}</p>}
          <button className="btn-red w-full !py-3" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save check-in"}</button>
        </section>

        {/* charts + compare */}
        <div className="space-y-6">
          <section className="card">
            <div className="flex items-baseline justify-between">
              <h2 className="h-display text-xl">{chartMeta.label} trend</h2>
              {last?.[chart] != null && <span className="text-sm text-bone-dim">{fmt(chartMeta.kind, Number(last[chart]), units)}</span>}
            </div>
            <div className="mt-2">
              <LineChart points={points} unit={chartMeta.kind === "pct" ? "%" : ` ${unitOf(chartMeta.kind, units)}`} target={chart === "weight_kg" && goalWeight != null ? kgTo(goalWeight, units.w) : undefined} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {MEASURES.map((m) => (
                <button key={m.k} onClick={() => setChart(m.k)} className={`rounded-full px-3 py-1 text-xs ${chart === m.k ? "bg-blood text-white" : "bg-white/5 text-bone-dim"}`}>{m.label}</button>
              ))}
            </div>
          </section>
          <Compare list={list} urls={urls} />
        </div>
      </div>

      {list.length > 0 && (
        <section>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="h-display text-xl">History</h2>
            {photoCount > 0 && (
              <button className="btn-ghost !py-2 text-sm" disabled={!!zipping && !zipping.startsWith("Download failed")} onClick={downloadPhotos}>
                {zipping ?? `⬇ Download all photos (${photoCount})`}
              </button>
            )}
          </div>
          <ul className="mt-3 space-y-2">
            {list.map((c) => (
              <li key={c.checkin_date} className="card flex items-center gap-3 !p-3">
                <div className="flex -space-x-3">
                  {POSES.filter((p) => c.photos?.[p]).slice(0, 3).map((p) => (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img key={p} src={urls[c.photos[p]!]} alt="" className="h-12 w-9 rounded-lg border-2 border-ink-2 bg-white/5 object-cover" />
                  ))}
                </div>
                <button className="min-w-0 flex-1 text-left" onClick={() => { loadDate(c.checkin_date); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                  <div className="text-sm font-medium">{long(c.checkin_date)}</div>
                  <div className="truncate text-xs text-bone-mute">
                    {MEASURES.filter((m) => c[m.k] != null).map((m) => `${m.label} ${fmt(m.kind, Number(c[m.k]), units)}`).join(" · ") || "Photos only"}
                  </div>
                </button>
                <button onClick={() => remove(c)} className="grid h-8 w-8 place-items-center text-bone-mute hover:text-blood-400" aria-label="Delete check-in">✕</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** Before/after slider for the same pose. */
function Compare({ list, urls }: { list: Checkin[]; urls: Record<string, string> }) {
  const [pose, setPose] = useState<Pose>("front");
  const withPose = list.filter((c) => c.photos?.[pose]);
  const [a, setA] = useState<string | null>(null);
  const [b, setB] = useState<string | null>(null);
  const [pos, setPos] = useState(50);
  const before = withPose.find((c) => c.checkin_date === a) ?? withPose[withPose.length - 1];
  const after = withPose.find((c) => c.checkin_date === b) ?? withPose[0];

  if (withPose.length < 2)
    return (
      <section className="card">
        <h2 className="h-display text-xl">Before / after</h2>
        <p className="mt-2 text-sm text-bone-mute">Add photos on two different days to compare them side by side.</p>
      </section>
    );

  const src = (c: Checkin) => urls[c.photos[pose]!];
  return (
    <section className="card">
      <div className="flex items-center justify-between">
        <h2 className="h-display text-xl">Before / after</h2>
        <div className="flex rounded-full bg-white/5 p-1 text-xs">
          {POSES.map((p) => (
            <button key={p} onClick={() => { setPose(p); setA(null); setB(null); }} className={`rounded-full px-2.5 py-1 capitalize ${pose === p ? "bg-bone text-ink" : "text-bone-dim"}`}>{p}</button>
          ))}
        </div>
      </div>
      <div className="relative mt-3 aspect-[3/4] select-none overflow-hidden rounded-2xl bg-ink-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src(after)} alt="After" className="absolute inset-0 h-full w-full object-cover" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src(before)} alt="Before" className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,.6)]" style={{ left: `${pos}%` }}>
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-ink">⇆</div>
        </div>
        <span className="absolute left-2 top-2 rounded-full bg-ink/70 px-2 py-0.5 text-[11px] backdrop-blur">{short(before.checkin_date)}</span>
        <span className="absolute right-2 top-2 rounded-full bg-blood px-2 py-0.5 text-[11px] text-white">{short(after.checkin_date)}</span>
        <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" aria-label="Compare slider" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <select value={before.checkin_date} onChange={(e) => setA(e.target.value)} className="rounded-xl border border-white/10 bg-ink-3 px-2 py-2" aria-label="Before date">
          {withPose.map((c) => <option key={c.checkin_date} value={c.checkin_date}>Before: {long(c.checkin_date)}</option>)}
        </select>
        <select value={after.checkin_date} onChange={(e) => setB(e.target.value)} className="rounded-xl border border-white/10 bg-ink-3 px-2 py-2" aria-label="After date">
          {withPose.map((c) => <option key={c.checkin_date} value={c.checkin_date}>After: {long(c.checkin_date)}</option>)}
        </select>
      </div>
    </section>
  );
}
