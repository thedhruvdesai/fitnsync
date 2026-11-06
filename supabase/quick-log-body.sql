-- Favourite foods + body tracking (measurements & progress photos).
-- Run once in Supabase → SQL Editor. Safe to run again.

-- 1) Favourite foods ------------------------------------------------------
create table if not exists public.food_favorites (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  item jsonb not null,               -- {name, kcal, protein, carbs, fat, fibre?, sugar?, sat_fat?, sodium?}
  created_at timestamptz default now(),
  unique (user_id, name)
);
alter table public.food_favorites enable row level security;
drop policy if exists "favorites self all" on public.food_favorites;
create policy "favorites self all" on public.food_favorites for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2) Body check-ins -------------------------------------------------------
create table if not exists public.body_checkins (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null,
  weight_kg numeric,
  body_fat numeric,
  waist_cm numeric,
  chest_cm numeric,
  hips_cm numeric,
  arm_cm numeric,
  thigh_cm numeric,
  photos jsonb default '{}'::jsonb,  -- {"front": "user-id/2026-11-06-front-xyz.jpg", "side": ..., "back": ...}
  notes text,
  updated_at timestamptz default now(),
  unique (user_id, checkin_date)
);
create index if not exists body_checkins_user_date on public.body_checkins (user_id, checkin_date desc);
alter table public.body_checkins enable row level security;
drop policy if exists "body self all" on public.body_checkins;
create policy "body self all" on public.body_checkins for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3) Private storage bucket for progress photos ---------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('progress-photos', 'progress-photos', false, 3145728, array['image/jpeg','image/webp','image/png'])
on conflict (id) do update set public = false;

-- Each user can only touch files inside their own folder: <user-id>/...
drop policy if exists "progress photos read own" on storage.objects;
create policy "progress photos read own" on storage.objects for select
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "progress photos insert own" on storage.objects;
create policy "progress photos insert own" on storage.objects for insert
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "progress photos update own" on storage.objects;
create policy "progress photos update own" on storage.objects for update
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "progress photos delete own" on storage.objects;
create policy "progress photos delete own" on storage.objects for delete
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);
