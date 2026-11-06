import Link from "next/link";
import { Backdrop } from "@/components/Backdrop";
import { Logo } from "@/components/Logo";
import { Counter, Cursor, Magnetic, Reveal, RotatingWord } from "@/components/Motion";
import { PricingCards } from "@/components/PricingCards";
import { RegionBanner, RegionPicker } from "@/components/RegionPicker";
import { currentRegion } from "@/lib/region.server";
import { formatMoney } from "@/lib/regions";

const STEPS = [
  { n: "01", t: "Tell us about you", d: "Two minutes: body, goal, schedule, diet, equipment, injuries. No generic templates." },
  { n: "02", t: "Get your plan", d: "Calorie and protein targets, a 7-day meal plan for how you eat, and a program for where you train." },
  { n: "03", t: "Log in seconds", d: "Tap planned meals, tick off sets, add water. Built for one thumb, on the go." },
  { n: "04", t: "Get coached", d: "Weekly reports in your inbox, and Elite members get a detailed review from Fit&Sync Coach." },
];

const FAQ = [
  { q: "Who writes the coach feedback?", a: "Fit&Sync Coach is an AI coach. It reads your logs, notes and targets each week and writes specific, honest feedback the way an experienced coach would. We tell you it's AI because you deserve to know." },
  { q: "Does it work with my diet?", a: "Yes. Eat everything, or choose pescatarian, vegetarian, vegetarian with eggs or vegan, and exclude any foods you don't eat. Your meal plan, protein targets and quick-add foods follow your choices, and the AI food log recognises meals from any cuisine." },
  { q: "How does the free trial work?", a: "Every plan starts with 7 days free. Cancel before day 7 and you pay nothing. Otherwise your plan starts automatically and renews monthly." },
  { q: "Can I cancel anytime?", a: "Yes. Manage or cancel from your account in two clicks. You keep access until the end of your billing month." },
  { q: "Is this medical advice?", a: "No. Fit&Sync gives general fitness and nutrition guidance. If you have a medical condition, are pregnant, or have a history of disordered eating, please speak with your GP or an Accredited Practising Dietitian first." },
];

const MARQUEE = ["Train", "Eat", "Sleep", "Recover", "Repeat", "Sync"];

function Ecg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className={`ecg ${className}`} aria-hidden>
      <path d="M0 40 H380 L400 40 L415 18 L430 62 L450 6 L470 74 L488 40 H700 L715 30 L728 50 L740 40 H1200" fill="none" stroke="#E11D2E" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneMock() {
  const ring = (pct: number, label: string, val: string) => {
    const r = 30, c = 2 * Math.PI * r;
    return (
      <div className="flex flex-col items-center">
        <svg width="76" height="76" className="-rotate-90">
          <circle cx="38" cy="38" r={r} stroke="#26262A" strokeWidth="7" fill="none" />
          <circle cx="38" cy="38" r={r} stroke="#E11D2E" strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
        </svg>
        <div className="-mt-[52px] mb-[26px] text-sm font-bold">{val}</div>
        <div className="text-[9px] uppercase tracking-widest text-bone-mute">{label}</div>
      </div>
    );
  };
  return (
    <div className="float relative mx-auto w-[290px]">
      {/* orbiting chips */}
      <div className="absolute -left-16 top-24 z-10 hidden rounded-2xl border border-white/10 bg-ink-2/80 px-4 py-3 backdrop-blur md:block">
        <div className="text-[10px] uppercase tracking-widest text-bone-mute">Protein streak</div>
        <div className="h-display text-2xl">6 <span className="text-blood">days</span></div>
      </div>
      <div className="absolute -right-14 bottom-28 z-10 hidden rounded-2xl border border-blood/40 bg-blood/15 px-4 py-3 backdrop-blur md:block">
        <div className="text-[10px] uppercase tracking-widest text-bone-dim">Week score</div>
        <div className="h-display text-2xl">87<span className="text-sm text-bone-dim">/100</span></div>
      </div>
      <div className="rounded-[44px] border border-white/10 bg-ink-2 p-3 shadow-[0_40px_120px_-30px_rgba(225,29,46,0.65)]">
        <div className="rounded-[34px] bg-ink px-5 pb-6 pt-8">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blood">Morning, Priya</div>
          <div className="h-display mt-1 text-2xl">Thursday, 5 Nov</div>
          <div className="mt-5 grid grid-cols-3 rounded-2xl border border-white/5 bg-ink-2 py-4">
            {ring(0.72, "kcal", "1,480")}
            {ring(0.86, "protein", "112g")}
            {ring(0.55, "water", "1.5L")}
          </div>
          <div className="mt-4 rounded-2xl border border-white/5 bg-ink-2 p-4">
            <div className="text-xs font-semibold">Upper A · 55 min</div>
            {["Incline dumbbell press", "Chest-supported row", "Shoulder press"].map((e, i) => (
              <div key={e} className={`mt-2 flex items-center justify-between rounded-lg border px-3 py-2 text-[11px] ${i < 2 ? "border-blood/50 bg-blood/10" : "border-white/10"}`}>
                {e}
                <span className={`grid h-4 w-4 place-items-center rounded-full text-[8px] ${i < 2 ? "bg-blood" : "border border-white/20"}`}>{i < 2 ? "✓" : ""}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-blood/30 bg-blood/10 p-4 text-[11px] leading-relaxed text-bone-dim">
            <div className="mb-1 text-[9px] uppercase tracking-widest text-blood">Coach · AI</div>
            Protein hit 6 of 7 days. That&apos;s the habit that moves the scale. This week: add a second set to your rows.
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function Home() {
  const { region, chosen, detected } = await currentRegion();
  return (
    <>
      <Backdrop />
      <Cursor />
      <main className="relative z-10 overflow-x-hidden">
        {/* nav */}
        <header className="sticky top-0 z-30 border-b border-white/5 bg-ink/50 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <Logo />
              <span className="hidden items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-widest text-bone-dim sm:flex">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-blood" /> Now in Australia
              </span>
            </div>
            <nav className="flex items-center gap-1 text-sm">
              <div className="mr-1"><RegionPicker region={region} /></div>
              <a href="#features" className="hidden px-3 text-bone-dim hover:text-bone md:block">Features</a>
              <a href="#coach" className="hidden px-3 text-bone-dim hover:text-bone md:block">Coach</a>
              <a href="#pricing" className="hidden px-3 text-bone-dim hover:text-bone sm:block">Pricing</a>
              <Link href="/login" className="px-3 text-bone-dim hover:text-bone">Sign in</Link>
              <Link href="/signup" className="btn-red !px-4 !py-2">Start</Link>
            </nav>
          </div>
        </header>

        {/* hero */}
        <section className="relative mx-auto grid min-h-[92vh] max-w-7xl items-center gap-12 px-6 pb-16 pt-12 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <p className="eyebrow fade-up" style={{ animationDelay: "100ms" }}>Personal fitness &amp; nutrition coaching</p>
            <h1 className="h-display mt-6 text-[19vw] uppercase leading-[0.82] sm:text-[120px] lg:text-[150px]">
              <span className="line-mask"><span style={{ animationDelay: "150ms" }}>Train.</span></span>
              <span className="line-mask"><span className="text-outline" style={{ animationDelay: "280ms" }}>Eat.</span></span>
              <span className="line-mask"><span className="text-blood" style={{ animationDelay: "410ms" }}>Sync.</span></span>
            </h1>
            <p className="fade-up mt-8 max-w-lg text-lg text-bone-dim md:text-xl" style={{ animationDelay: "700ms" }}>
              A plan built from your body, your goal and the way you actually eat. Made for <RotatingWord words={["lifters", "runners", "shift workers", "busy parents", "beginners", "athletes"]} />.
            </p>
            <div className="fade-up mt-10 flex flex-wrap items-center gap-4" style={{ animationDelay: "850ms" }}>
              <Magnetic><Link href="/signup" className="btn-red !px-8 !py-4 text-base">Build my plan, free →</Link></Magnetic>
              <a href="#pricing" className="btn-ghost !px-8 !py-4 text-base">See plans</a>
            </div>
            <p className="fade-up mt-5 text-xs text-bone-mute" style={{ animationDelay: "950ms" }}>Free intake &amp; targets · 7-day free trial · From {formatMoney(region.prices.starter, region)}/mo</p>
          </div>
          <div className="fade-up relative" style={{ animationDelay: "500ms" }}><PhoneMock /></div>
          <Ecg className="pointer-events-none absolute bottom-6 left-0 h-14 w-full opacity-60" />
        </section>

        {/* marquee */}
        <section className="relative -rotate-2 border-y border-white/10 bg-blood py-5">
          <div className="marquee">
            {[...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE].map((w, i) => (
              <span key={i} className="h-display flex items-center gap-8 px-8 text-5xl uppercase text-white md:text-7xl">
                {w} <span className="text-3xl text-ink">✦</span>
              </span>
            ))}
          </div>
        </section>
        <section className="relative rotate-1 border-b border-white/5 bg-ink-2 py-4">
          <div className="marquee marquee-rev">
            {Array.from({ length: 4 }).flatMap((_, k) =>
              ["Any diet · Any cuisine", "Gym · Home · Bodyweight", "Shift-work friendly", "Weekly AI coach"].map((w, i) => (
                <span key={`${k}-${i}`} className="flex items-center gap-8 px-8 text-sm uppercase tracking-[0.3em] text-bone-dim">
                  {w} <span className="text-blood">●</span>
                </span>
              ))
            )}
          </div>
        </section>

        {/* stats */}
        <section className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden px-6 py-28 md:grid-cols-4">
          {[
            { v: 2, s: " min", l: "to your first plan" },
            { v: 7, s: "-day", l: "meal plan, rebuilt for you" },
            { v: 5, s: " diet styles", l: "eat everything to plant-based" },
            { v: 52, s: "", l: "coach reviews a year" },
          ].map((x, i) => (
            <Reveal key={x.l} delay={i * 100} className="border-l border-white/10 px-5 py-4">
              <div className="h-display text-6xl md:text-7xl"><Counter to={x.v} suffix={x.s} /></div>
              <div className="mt-2 text-sm text-bone-dim">{x.l}</div>
            </Reveal>
          ))}
        </section>

        {/* bento */}
        <section id="features" className="mx-auto max-w-7xl px-6 pb-28">
          <Reveal>
            <p className="eyebrow">Everything in one place</p>
            <h2 className="h-display mt-3 max-w-3xl text-5xl leading-[0.92] md:text-7xl">Built like a coach. <span className="text-outline">Used like an app.</span></h2>
          </Reveal>
          <div className="mt-14 grid auto-rows-[minmax(220px,auto)] gap-4 md:grid-cols-6">
            <Reveal className="md:col-span-4">
              <div className="card tilt shine flex h-full flex-col justify-between !p-8">
                <div>
                  <p className="eyebrow">Personal targets</p>
                  <h3 className="h-display mt-3 text-4xl">Your numbers, not an average.</h3>
                  <p className="mt-3 max-w-md text-bone-dim">Calories, protein, carbs, fat, water, steps and sleep, calculated from your body, activity and goal.</p>
                </div>
                <div className="mt-8 flex flex-wrap gap-2">
                  {["2,150 kcal", "145 g protein", "2.8 L water", "10k steps", "8 h sleep"].map((c) => (
                    <span key={c} className="rounded-full border border-white/10 bg-ink-3 px-4 py-2 text-sm">{c}</span>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal className="md:col-span-2" delay={100}>
              <div className="card tilt shine relative h-full overflow-hidden !p-8">
                <p className="eyebrow">Meal plans</p>
                <h3 className="h-display mt-3 text-3xl">Chicken, fish, eggs or plants. Your call.</h3>
                <div className="h-display absolute -bottom-6 -right-2 text-[120px] leading-none text-white/[0.04]">7d</div>
              </div>
            </Reveal>
            <Reveal className="md:col-span-2" delay={0}>
              <div className="card tilt shine h-full !p-8">
                <p className="eyebrow">Training</p>
                <h3 className="h-display mt-3 text-3xl">2–6 day programs for gym, home or nothing.</h3>
                <p className="mt-3 text-sm text-bone-dim">Progressive overload is built in, with a deload every 6th week.</p>
              </div>
            </Reveal>
            <Reveal className="md:col-span-2" delay={100}>
              <div className="card tilt shine h-full !p-8">
                <p className="eyebrow">Reports · Pro</p>
                <div className="mt-4 flex h-24 items-end gap-2">
                  {[55, 72, 64, 88, 80, 94, 70].map((v, i) => (
                    <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-blood/40 to-blood" style={{ height: `${v}%` }} />
                  ))}
                </div>
                <h3 className="h-display mt-4 text-2xl">A score every Monday.</h3>
              </div>
            </Reveal>
            <Reveal className="md:col-span-2" delay={200}>
              <div className="card tilt shine h-full !border-blood/40 bg-gradient-to-br from-blood/25 to-ink-2 !p-8">
                <p className="eyebrow !text-bone">Elite · AI coach</p>
                <h3 className="h-display mt-3 text-3xl">Three fixes a week, written for you.</h3>
                <a href="#coach" className="mt-6 inline-block text-sm text-bone underline underline-offset-4">Read a sample →</a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* how */}
        <section className="mx-auto max-w-7xl px-6 pb-28">
          <Reveal>
            <p className="eyebrow">How it works</p>
            <h2 className="h-display mt-3 text-5xl md:text-7xl">Four steps. <span className="text-blood">Zero guesswork.</span></h2>
          </Reveal>
          <div className="mt-12 border-t border-white/10">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 80}>
                <div className="group grid items-center gap-4 border-b border-white/10 py-8 transition hover:bg-white/[0.02] md:grid-cols-[140px_1fr_1.2fr]">
                  <div className="h-display text-5xl text-bone-mute transition group-hover:text-blood">{s.n}</div>
                  <h3 className="h-display text-3xl md:text-4xl">{s.t}</h3>
                  <p className="text-bone-dim md:text-lg">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* coach */}
        <section id="coach" className="mx-auto grid max-w-7xl gap-12 px-6 pb-28 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <p className="eyebrow">Elite · Fit&amp;Sync Coach</p>
            <h2 className="h-display mt-3 text-5xl leading-[0.92] md:text-6xl">Feedback that sounds like it came from someone who&apos;s <span className="text-blood">seen it all.</span></h2>
            <p className="mt-6 max-w-lg text-lg text-bone-dim">
              Every Monday, our AI coach reviews your food, training, sleep and notes, then tells you what&apos;s working, the three things to fix, and how to adjust your plan. Ask for a check-in any time.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <div className="relative">
              <div className="absolute -inset-4 rounded-[32px] bg-blood/20 blur-3xl" />
              <div className="card relative !rounded-[28px] !p-8 text-[15px] leading-relaxed text-bone-dim">
                <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-widest">
                  <span className="text-blood">Weekly review · sample</span>
                  <span className="flex items-center gap-2 text-bone-mute"><span className="pulse-dot h-1.5 w-1.5 rounded-full bg-blood" /> AI coach</span>
                </div>
                <h3 className="h-display text-3xl text-bone">Protein&apos;s locked in. Now earn the next kilo.</h3>
                <p className="mt-4"><strong className="text-bone">What&apos;s working:</strong> 6 of 7 days over 140 g protein, and you trained 4 of 4. Down 0.6 kg, right on pace.</p>
                <p className="mt-3"><strong className="text-bone">Fix this week:</strong> Your two night shifts averaged 2,650 kcal against a 2,150 target. <strong className="text-bone">Pack a 400 kcal pre-shift meal</strong> so the 2am vending machine loses.</p>
                <p className="mt-3"><strong className="text-bone">One question:</strong> how did your knee feel on split squats?</p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* pricing */}
        <section id="pricing" className="mx-auto max-w-7xl px-6 pb-28">
          <Reveal className="text-center">
            <p className="eyebrow">Pricing</p>
            <h2 className="h-display mt-3 text-5xl md:text-7xl">Pick your level of <span className="text-outline">support.</span></h2>
          </Reveal>
          <Reveal delay={100} className="mt-14"><PricingCards mode="public" region={region} /></Reveal>
        </section>

        {/* faq */}
        <section className="mx-auto max-w-3xl px-6 pb-28">
          <Reveal><h2 className="h-display text-5xl">Questions</h2></Reveal>
          <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-6">
                <summary className="flex list-none items-center justify-between text-lg font-semibold md:text-xl">
                  {f.q}
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-blood transition group-open:rotate-45 group-open:bg-blood group-open:text-white">+</span>
                </summary>
                <p className="mt-3 text-bone-dim">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* cta */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <Reveal>
            <div className="relative overflow-hidden rounded-[40px] bg-blood px-8 py-20 text-center">
              <Ecg className="absolute inset-x-0 top-1/2 h-20 w-full -translate-y-1/2 opacity-30 [&_path]:stroke-white" />
              <h2 className="h-display relative text-5xl uppercase leading-[0.9] text-white md:text-8xl">Your plan is<br />two minutes away.</h2>
              <Magnetic className="relative mt-10">
                <Link href="/signup" className="btn bg-ink !px-10 !py-5 text-base text-bone hover:bg-ink-3">Start free intake →</Link>
              </Magnetic>
            </div>
          </Reveal>
        </section>

        <footer className="relative mx-auto max-w-7xl overflow-hidden px-6 pb-10 pt-6">
          <div className="h-display select-none text-center text-[22vw] uppercase leading-[0.8] text-outline opacity-40 md:text-[18vw]">Fit&amp;Sync</div>
          <div className="mt-8 flex flex-col gap-4 border-t border-white/5 pt-8 text-sm text-bone-mute md:flex-row md:justify-between">
            <p className="max-w-md text-xs">Fit&amp;Sync provides general fitness and nutrition guidance and is not a substitute for medical advice. Fit&amp;Sync Coach is an AI.</p>
            <div className="flex gap-6"><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><a href="mailto:hello@fitsync.app">Contact</a></div>
          </div>
        </footer>
      </main>
      {!chosen && <RegionBanner detected={detected} />}
    </>
  );
}
