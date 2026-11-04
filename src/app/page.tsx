import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PricingCards } from "@/components/PricingCards";

const STEPS = [
  { n: "01", t: "Tell us about you", d: "Two minutes: body, goal, schedule, diet, equipment, injuries. No generic templates." },
  { n: "02", t: "Get your plan", d: "Calorie and protein targets, a 7-day meal plan for how you eat, and a program for where you train." },
  { n: "03", t: "Log in seconds", d: "Tap planned meals, tick off sets, add water. Built for one-thumb use on the go." },
  { n: "04", t: "Get coached", d: "Weekly reports in your inbox, and Elite members get a detailed review from Fit&Sync Coach." },
];

const FAQ = [
  { q: "Who writes the coach feedback?", a: "Fit&Sync Coach is an AI coach. It reads your logs, notes and targets each week and writes specific, honest feedback the way an experienced coach would. We tell you it's AI because you deserve to know." },
  { q: "Does it work for vegetarians and vegans?", a: "Yes. Choose vegetarian, vegan, vegetarian + eggs, pescatarian or everything. Your meal plan, protein targets and quick-add foods follow your choice, and you can exclude foods you don't eat." },
  { q: "Can I cancel anytime?", a: "Yes. Manage or cancel from your account in two clicks. You keep access until the end of your billing month." },
  { q: "Is this medical advice?", a: "No. Fit&Sync gives general fitness and nutrition guidance. If you have a medical condition, are pregnant, or have a history of disordered eating, please speak with your GP or an Accredited Practising Dietitian first." },
];

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
    <div className="relative mx-auto w-[290px] rounded-[44px] border border-white/10 bg-ink-2 p-3 shadow-[0_40px_120px_-30px_rgba(225,29,46,0.55)]">
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
  );
}

export default function Home() {
  return (
    <main className="relative z-10 overflow-hidden">
      {/* nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <nav className="flex items-center gap-2 text-sm">
          <a href="#pricing" className="hidden px-3 text-bone-dim hover:text-bone sm:block">Pricing</a>
          <Link href="/login" className="px-3 text-bone-dim hover:text-bone">Sign in</Link>
          <Link href="/signup" className="btn-red !px-4 !py-2">Start</Link>
        </nav>
      </header>

      {/* hero */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pb-24 pt-10 md:grid-cols-[1.15fr_1fr] md:pt-16">
        <div className="pointer-events-none absolute -left-40 top-10 h-[520px] w-[520px] rounded-full bg-blood/20 blur-[120px]" />
        <div className="relative">
          <p className="eyebrow">Personal fitness &amp; nutrition coaching</p>
          <h1 className="h-display mt-5 text-[13vw] leading-[0.88] sm:text-7xl md:text-[88px]">
            Train it.<br />Eat it.<br /><span className="text-blood">Sync it.</span>
          </h1>
          <p className="mt-7 max-w-md text-lg text-bone-dim">
            A plan built from your body, your goal and the way you actually eat, plus weekly reports and a coach that reads every log.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/signup" className="btn-red !px-7 !py-4 text-base">Build my plan, free</Link>
            <a href="#pricing" className="btn-ghost !px-7 !py-4 text-base">See plans</a>
          </div>
          <p className="mt-4 text-xs text-bone-mute">Free intake and targets. Plans from $25/month. Cancel anytime.</p>
        </div>
        <div className="relative"><PhoneMock /></div>
      </section>

      {/* marquee */}
      <div className="border-y border-white/5 bg-ink-2 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-10 gap-y-2 px-6 text-sm uppercase tracking-[0.25em] text-bone-mute">
          <span>Veg · Vegan · Everything</span><span className="text-blood">●</span><span>Gym · Home · Bodyweight</span><span className="text-blood">●</span><span>Shift-work friendly</span>
        </div>
      </div>

      {/* how */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <p className="eyebrow">How it works</p>
        <h2 className="h-display mt-3 max-w-2xl text-5xl leading-[0.95]">From intake to results in four steps.</h2>
        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/5 bg-white/5 md:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="bg-ink p-7">
              <div className="h-display text-4xl text-blood">{s.n}</div>
              <h3 className="mt-6 text-lg font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-bone-dim">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* coach */}
      <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-24 md:grid-cols-2 md:items-center">
        <div>
          <p className="eyebrow">Elite · Fit&amp;Sync Coach</p>
          <h2 className="h-display mt-3 text-5xl leading-[0.95]">Feedback that sounds like it came from someone who&apos;s seen it all.</h2>
          <p className="mt-5 text-bone-dim">
            Every Monday, our AI coach reviews your food, training, sleep and notes, then tells you what&apos;s working, the three things to fix, and how to adjust your plan. Ask for a check-in any time.
          </p>
        </div>
        <div className="card !p-7 text-[15px] leading-relaxed text-bone-dim">
          <div className="mb-3 text-xs uppercase tracking-widest text-blood">Weekly review · sample</div>
          <h3 className="h-display text-2xl text-bone">Protein&apos;s locked in. Now earn the next kilo.</h3>
          <p className="mt-3"><strong className="text-bone">What&apos;s working:</strong> 6 of 7 days over 140 g protein, and you trained 4 of 4. Down 0.6 kg, right on pace.</p>
          <p className="mt-3"><strong className="text-bone">Fix this week:</strong> Your two night shifts averaged 2,650 kcal against a 2,150 target. <strong className="text-bone">Pack a 400 kcal pre-shift meal</strong> so the 2am vending machine loses.</p>
          <p className="mt-3"><strong className="text-bone">One question:</strong> how did your knee feel on split squats?</p>
        </div>
      </section>

      {/* pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="text-center">
          <p className="eyebrow">Pricing</p>
          <h2 className="h-display mt-3 text-5xl">Pick your level of support.</h2>
        </div>
        <div className="mt-14"><PricingCards mode="public" /></div>
      </section>

      {/* faq */}
      <section className="mx-auto max-w-3xl px-6 pb-24">
        <h2 className="h-display text-4xl">Questions</h2>
        <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-semibold">
                {f.q}<span className="text-blood transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-bone-dim">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* cta */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="relative overflow-hidden rounded-[36px] bg-blood px-8 py-16 text-center">
          <h2 className="h-display text-5xl text-white md:text-6xl">Your plan is two minutes away.</h2>
          <Link href="/signup" className="btn mt-8 bg-ink !px-8 !py-4 text-base text-bone hover:bg-ink-3">Start free intake</Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-4 border-t border-white/5 px-6 py-10 text-sm text-bone-mute md:flex-row md:justify-between">
        <div><Logo /><p className="mt-3 max-w-md text-xs">Fit&amp;Sync provides general fitness and nutrition guidance and is not a substitute for medical advice. Fit&amp;Sync Coach is an AI.</p></div>
        <div className="flex gap-6"><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><a href="mailto:hello@fitsync.app">Contact</a></div>
      </footer>
    </main>
  );
}
