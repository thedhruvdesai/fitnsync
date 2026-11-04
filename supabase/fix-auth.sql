-- Run this if you already ran schema.sql before the sign-in fix.
drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert" on public.profiles for insert with check (auth.uid() = id and coalesce(tier, 'free') = 'free');

insert into public.profiles (id, email, full_name)
select id, email, coalesce(raw_user_meta_data->>'full_name', '') from auth.users
on conflict (id) do nothing;
