# Fit&Sync: subscription fitness & nutrition coaching

A production-ready Next.js 14 app with:

- **Email sign-up / sign-in / password reset** (Supabase Auth)
- **Onboarding intake** → personal calorie & macro targets, a 7-day meal plan (veg, vegan, eggetarian, pescatarian or everything, with dislikes excluded) and a training program (2–6 days, gym/home/bodyweight)
- **Daily logging**: food (from plan, quick-add or custom), workout tick-offs, water, weight, sleep, energy, notes
- **Progress**: 30-day weight trend, calorie & protein bars, streaks
- **Reports (Pro)**: weekly consistency score, adherence, day-by-day table, PDF via print
- **Fit&Sync Coach (Elite)**: Claude writes an expert-voice weekly review plus up to 8 on-demand check-ins a month, clearly labelled as AI
- **Weekly email every Monday** (Resend); depth depends on tier, and Elite gets the coach review inline
- **Stripe subscriptions**: Starter $9.99, Pro $19.99, Elite $39 (AUD/month), each with a 7-day free trial for first-time subscribers, plus a customer portal for upgrades and cancellations

## Tier features

| | Free | Starter $9.99 | Pro $19.99 | Elite $39 |
|---|---|---|---|---|
| Intake + targets + daily logging | ✓ | ✓ | ✓ | ✓ |
| Meal plan + training program | | ✓ | ✓ | ✓ |
| Progress charts | | ✓ | ✓ | ✓ |
| Weekly email (short) | ✓ | ✓ | full report | full report + coach |
| Reports & PDF | | | ✓ | ✓ |
| AI coach weekly review + 8 check-ins/mo | | | | ✓ |

Edit features, prices and `TRIAL_DAYS` in `src/lib/tiers.ts`. For a founding-member discount, create a coupon and promotion code in Stripe (e.g. `FOUNDING50`); checkout already accepts promo codes.

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

### 3. Stripe (payments)
1. **Product catalogue → Add product** three times: Starter $9.99, Pro $19.99, Elite $39. Each is **Recurring, monthly, AUD**. The app adds the 7-day trial at checkout, so don't add a trial to the Stripe price. Copy each `price_...` ID into `STRIPE_PRICE_STARTER/PRO/ELITE`.
2. **Developers → API keys** → `STRIPE_SECRET_KEY`.
3. **Settings → Billing → Customer portal** → turn on: switch plans (add all 3 prices), cancel, update payment method.
4. **Developers → Webhooks → Add endpoint** `https://YOURDOMAIN/api/stripe/webhook` with events:
   `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted` → copy the signing secret to `STRIPE_WEBHOOK_SECRET`.
   - Local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
5. Turn on **Tax → Australian GST** if you're GST-registered.

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
2. Upgrade with Stripe test card `4242 4242 4242 4242` → tier updates to Elite.
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
src/app/api/           onboarding, coach, stripe (checkout/portal/webhook), cron/weekly
supabase/schema.sql    tables, RLS, billing-column protection, auto profile
```

## Before you launch: compliance checklist
- **AI disclosure**: the coach is labelled AI everywhere (app, emails, terms). Keep it that way. Presenting AI feedback as a human expert to paying customers risks misleading-conduct claims under the Australian Consumer Law.
- **Titles**: don't call the service a "dietitian" (a protected title). "Coach" and "guidance" are fine.
- **Health data**: you're storing health information. Have the Terms and Privacy templates reviewed, and add a contact email for privacy requests.
- **Age**: the terms require users to be 18+.
- The coach prompt already includes safety rules: no calorie targets below the floor, referral to a GP or physio for pain, and Butterfly Foundation info if notes suggest disordered eating.
