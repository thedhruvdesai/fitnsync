# Fit&Sync: subscription fitness & nutrition coaching

A production-ready Next.js 14 app with:

- **Email sign-up / sign-in / password reset** (Supabase Auth)
- **Onboarding intake** → personal calorie & macro targets, a 7-day meal plan (veg, vegan, eggetarian, pescatarian or everything, with dislikes excluded) and a training program (2–6 days, gym/home/bodyweight)
- **Daily logging**: food (from plan, quick-add or custom), workout tick-offs, water, weight, sleep, energy, notes
- **Progress**: 30-day weight trend, calorie & protein bars, streaks
- **Reports (Pro)**: weekly consistency score, adherence, day-by-day table, PDF via print
- **Fit&Sync Coach (Elite)**: Claude writes an expert-voice weekly review plus up to 8 on-demand check-ins a month, clearly labelled as AI
- **Weekly email every Monday** (Resend); depth depends on tier, and Elite gets the coach review inline
- **Paddle subscriptions** (merchant of record, handles worldwide tax): Starter $9.99, Pro $19.99, Elite $39 AUD/month, with local prices in 10+ regions, a 7-day free trial, and a customer portal

## Tier features

| | Free | Starter $9.99 | Pro $19.99 | Elite $39 |
|---|---|---|---|---|
| Intake + targets + daily logging | ✓ | ✓ | ✓ | ✓ |
| Meal plan + training program | | ✓ | ✓ | ✓ |
| Progress charts | | ✓ | ✓ | ✓ |
| Weekly email (short) | ✓ | ✓ | full report | full report + coach |
| Reports & PDF | | | ✓ | ✓ |
| AI coach weekly review + 8 check-ins/mo | | | | ✓ |

Edit features, prices and `TRIAL_DAYS` in `src/lib/tiers.ts`. For a founding-member deal, create a discount code in Paddle (Catalog → Discounts, e.g. `FOUNDING50`); customers can enter it at checkout.

---

## Go live in about an hour

### 1. Run it locally
```bash
npm install
cp .env.example .env.local   # fill in as you go
npm run dev                  # http://localhost:3000
```

### 2. Supabase (database + login)
1. Create a project at supabase.com (region: Sydney).
2. **SQL Editor → New query** → paste `supabase/schema.sql` → **Run**.
3. **Project Settings → API**: copy the URL, the anon/publishable key and the service-role key into `.env.local`.
4. **Authentication → URL Configuration**: set Site URL to your domain and add `https://YOURDOMAIN/auth/callback` (plus `http://localhost:3000/auth/callback`) to Redirect URLs.
5. **Authentication → Emails → Templates** (this makes confirmation links work even when opened on another phone or browser):
   - *Confirm signup*: change the link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/onboarding`
   - *Reset password*: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset`
   - *Magic link*: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink&next=/app`
6. Optional: **Authentication → Emails → SMTP** → plug in Resend's SMTP so confirmation emails come from your domain.

### 3. Paddle (payments + worldwide tax)
Paddle is the **merchant of record**: it's the legal seller, so it collects and pays VAT, GST and sales tax in every country. You get paid out by Paddle. A sole trader ABN is fine. Fee: 5% + 50¢ per transaction, no monthly fee.

1. Sign up at **paddle.com** and open a **Sandbox** account for testing (sandbox-vendors.paddle.com). Use the live account once Paddle approves your website.
2. **Checkout → Checkout settings → Default payment link**: set it to your site URL (e.g. `https://syncnfit.netlify.app`).
3. **Developer tools → Authentication**: create a **client-side token** for `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` and an **API key** for `PADDLE_API_KEY`.
4. **Developer tools → Notifications → New destination**: URL `https://YOURDOMAIN/api/paddle/webhook`, type webhook, and select the `subscription.*` events (created, updated, activated, canceled, past_due, paused, resumed, trialing). Copy the secret key into `PADDLE_WEBHOOK_SECRET`.
5. Set `CRON_SECRET`, redeploy, then open once:
   `https://YOURDOMAIN/api/admin/paddle-setup?secret=YOUR_CRON_SECRET`
   This creates Starter, Pro and Elite with a 7-day trial and a local price for every region.
6. In Supabase, run `supabase/paddle.sql` once (adds the Paddle columns).
7. Test with card `4242 4242 4242 4242`, any future date, CVC `100`.
8. Before going live, Paddle reviews your website. Make sure the Terms, Privacy, pricing and a refund policy are visible, then switch `NEXT_PUBLIC_PADDLE_ENV=production` and use your live keys.

#### Regional pricing
Visitors see prices in their own currency. The country comes from Netlify's geo header, with the browser language as a fallback. First-time visitors get a "Looks like you're in India. Show prices in INR?" prompt, and the 🌐 picker in the nav lets anyone change country. Paddle charges in the customer's local currency, based on where they actually are.

| Region | Currency | Starter | Pro | Elite |
|---|---|---|---|---|
| Australia | AUD | 9.99 | 19.99 | 39 |
| New Zealand | NZD | 10.99 | 21.99 | 42.99 |
| United States | USD | 6.99 | 12.99 | 24.99 |
| Canada | CAD | 8.99 | 17.99 | 34.99 |
| United Kingdom | GBP | 5.99 | 10.99 | 19.99 |
| Eurozone | EUR | 6.99 | 12.99 | 22.99 |
| India | INR | 199 | 399 | 799 |
| Singapore | SGD | 8.99 | 16.99 | 32.99 |
| UAE | USD | 6.99 | 12.99 | 24.99 |
| South Africa | ZAR | 79 | 149 | 299 |
| Rest of world | USD | 6.99 | 12.99 | 24.99 |

Edit them in `src/lib/regions.ts`, push, then rerun the setup link. Note that Paddle's fee is 5% + 50¢, so the 50¢ part is a big share of very cheap plans (e.g. India).

### 4. Resend (weekly emails)
Create an API key → `RESEND_API_KEY`. Verify your domain and set `EMAIL_FROM`.

### 5. Anthropic (AI coach)
Create a key at console.anthropic.com → `ANTHROPIC_API_KEY`. Default model is `claude-sonnet-5-5` (override with `ANTHROPIC_MODEL`). Cost is roughly a few cents per review. Even 8 check-ins plus 4 weekly reviews a month is a tiny fraction of the $39 Elite price.

### 6. Deploy (Netlify or Vercel)
- Push this folder to a **new private GitHub repo**, then import it in Netlify (or Vercel). `netlify.toml` is included.
- Add every variable from `.env.example` in the host's environment settings. Set `NEXT_PUBLIC_SITE_URL` to your live URL.
- Make a long random `CRON_SECRET`.

### 7. Turn on the Monday email
`.github/workflows/weekly-email.yml` calls `/api/cron/weekly` every Monday at 7am Brisbane time and loops until every user is processed. In the GitHub repo, go to **Settings → Secrets → Actions** and add `SITE_URL` and `CRON_SECRET`. Use **Actions → Weekly email → Run workflow** to test it.
(Alternatively, point cron-job.org at the same URL with header `Authorization: Bearer <CRON_SECRET>`.)

### 8. Test the full flow
1. Sign up → confirm email → finish intake → see targets.
2. Upgrade with Paddle's test card `4242 4242 4242 4242` → tier updates to Elite.
3. Log a few days → Coach → **Get feedback**.
4. Run the weekly workflow → check your inbox.

---

## Sign-in troubleshooting
| Symptom | Fix |
|---|---|
| "Login isn't connected yet" banner | Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Netlify, then **Deploys → Trigger deploy → Clear cache and deploy**. `NEXT_PUBLIC_` values are baked in at build time. |
| Confirmation link goes to localhost | Supabase → Authentication → URL Configuration → set **Site URL** to the live domain. Set `NEXT_PUBLIC_SITE_URL` to it as well. |
| Link opens but you're still logged out | Update the email templates (step 2.5). The old link only works in the same browser you signed up in. |
| "Email not confirmed" | Use the **Resend confirmation email** button on the sign-in page, or for testing turn off Authentication → Providers → Email → *Confirm email*. |
| Page keeps reloading or bounces after login | Run `supabase/fix-auth.sql` once. It creates missing profile rows. |
| No emails arrive | Supabase's built-in mailer allows only a few emails an hour. Add Resend SMTP (step 2.6). |

## Project map
```
src/lib/plan.ts        targets (Mifflin-St Jeor), meal plan, training program
src/lib/foods.ts       meal library by diet + quick-add foods
src/lib/coach.ts       Fit&Sync Coach prompt + Claude call
src/lib/report.ts      weekly summary / consistency score
src/lib/email.ts       weekly email HTML
src/lib/tiers.ts       plans, prices, feature gating
src/app/               pages: landing, auth, onboarding, /app/*
src/app/api/           onboarding, coach, paddle (checkout/portal/webhook), admin/paddle-setup, cron/weekly
supabase/schema.sql    tables, RLS, billing-column protection, auto profile
```

## Before you launch: compliance checklist
- **AI disclosure**: the coach is labelled AI everywhere (app, emails, terms). Keep it that way. Presenting AI feedback as a human expert to paying customers risks misleading-conduct claims under the Australian Consumer Law.
- **Titles**: don't call the service a "dietitian" (a protected title). "Coach" and "guidance" are fine.
- **Health data**: you're storing health information. Have the Terms and Privacy templates reviewed, and add a contact email for privacy requests.
- **Age**: the terms require users to be 18+.
- The coach prompt already includes safety rules: no calorie targets below the floor, referral to a GP or physio for pain, and Butterfly Foundation info if notes suggest disordered eating.

## Exercise library

`/app/exercises` lists 161 common gym and home exercises with real start/finish photos (crossfaded as a rep), step-by-step instructions, coach cues, and per-exercise PR charts (heaviest weight, estimated 1RM, best volume, reps — Starter tier and up).

Source: [yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db), public domain (Unlicense), so it's fine for commercial use. To change the list, edit `PICK` in `scripts/build-exercise-library.py`, then:

```bash
git clone --depth 1 https://github.com/yuhonas/free-exercise-db /tmp/fedb
pip install pillow
python3 scripts/build-exercise-library.py /tmp/fedb   # writes src/data/exercises.json + public/ex/*.webp
```

Workout sets are stored per set in `daily_logs.workouts[].set_list` (`{w, r}`), with `ex` = library id.

## Quick logging, barcode & body tracking

Run `supabase/quick-log-body.sql` once in Supabase → SQL Editor. It creates `food_favorites`, `body_checkins` and the private `progress-photos` storage bucket (each user can only read/write their own folder).

- Barcode lookups use [Open Food Facts](https://openfoodfacts.org) (free, ODbL; attribute in the UI) via `/api/food/barcode`. Camera scanning uses the browser BarcodeDetector where available, otherwise ZXing.
- Recent foods come from the last 30 days of `daily_logs`; "Copy yesterday" duplicates yesterday's meals.
