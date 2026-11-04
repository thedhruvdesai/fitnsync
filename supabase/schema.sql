-- =====================================================================
-- Fit&Sync database schema
-- Run this once in Supabase: SQL Editor > New query > paste > Run
-- =====================================================================

-- ---------- Profiles: one row per user ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  -- intake
  sex text check (sex in ('male','female')),
  birth_year int,
  height_cm numeric,
  weight_kg numeric,
  goal_weight_kg numeric,
  goal text check (goal in ('lose_fat','build_muscle','recomp','performance','general_health')),
  activity text check (activity in ('sedentary','light','moderate','active','very_active')),
  experience text check (experience in ('beginner','intermediate','advanced')),
  diet text check (diet in ('vegetarian','vegan','eggetarian','pescatarian','non_veg')),
  equipment text check (equipment in ('none','home','gym')),
  training_days int default 4,
  meals_per_day int default 3,
  dislikes text,
  constraints text,           -- injuries / things to avoid (user-written)
  -- generated plan (targets + meal + workout plans)
  plan jsonb,
  onboarded boolean default false,
  -- billing
  tier text default 'free' check (tier in ('free','starter','pro','elite')),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  subscription_status text,
  weekly_email boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- Daily logs: one row per user per day ----------
create table if not exists public.daily_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  meals jsonb default '[]'::jsonb,      -- [{name, kcal, protein, carbs, fat, slot}]
  workouts jsonb default '[]'::jsonb,   -- [{name, sets, reps, weight, minutes, done}]
  water_ml int default 0,
  weight_kg numeric,
  sleep_hours numeric,
  energy int check (energy between 1 and 5),
  notes text,
  updated_at timestamptz default now(),
  unique (user_id, log_date)
);
create index if not exists daily_logs_user_date on public.daily_logs (user_id, log_date desc);

-- ---------- Coach feedback (AI, Elite tier) ----------
create table if not exists public.coach_feedback (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  kind text default 'weekly' check (kind in ('weekly','on_demand')),
  content text not null,
  created_at timestamptz default now()
);
create index if not exists coach_feedback_user on public.coach_feedback (user_id, created_at desc);

-- ---------- Weekly email log (prevents double sends) ----------
create table if not exists public.email_log (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  sent_at timestamptz default now(),
  unique (user_id, week_start)
);

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.daily_logs enable row level security;
alter table public.coach_feedback enable row level security;
alter table public.email_log enable row level security;

-- Profiles: users read/update their own row. Billing columns are protected by trigger below.
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert" on public.profiles for insert with check (auth.uid() = id and coalesce(tier, 'free') = 'free');
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);

drop policy if exists "logs self all" on public.daily_logs;
create policy "logs self all" on public.daily_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "feedback self read" on public.coach_feedback;
create policy "feedback self read" on public.coach_feedback for select using (auth.uid() = user_id);
-- inserts into coach_feedback / email_log happen server-side with the service role only

-- Stop users from upgrading themselves: billing columns can only change via service role
create or replace function public.protect_billing_columns()
returns trigger language plpgsql as $$
begin
  if coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '') <> 'service_role' then
    new.tier := old.tier;
    new.stripe_customer_id := old.stripe_customer_id;
    new.stripe_subscription_id := old.stripe_subscription_id;
    new.subscription_status := old.subscription_status;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists protect_billing on public.profiles;
create trigger protect_billing before update on public.profiles
  for each row execute function public.protect_billing_columns();

-- Auto-create a profile when someone signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for anyone who signed up before this script was run
insert into public.profiles (id, email, full_name)
select id, email, coalesce(raw_user_meta_data->>'full_name', '') from auth.users
on conflict (id) do nothing;
