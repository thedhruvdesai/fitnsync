-- AI food scan usage (daily limits). Run once in Supabase SQL Editor.
create table if not exists public.food_scans (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('photo','text')),
  created_at timestamptz default now()
);
create index if not exists food_scans_user_time on public.food_scans (user_id, created_at desc);
alter table public.food_scans enable row level security;
drop policy if exists "food scans self read" on public.food_scans;
create policy "food scans self read" on public.food_scans for select using (auth.uid() = user_id);
