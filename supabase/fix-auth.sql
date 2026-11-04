-- Run this if you already ran schema.sql before the sign-in fix.
drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert" on public.profiles for insert with check (auth.uid() = id and coalesce(tier, 'free') = 'free');

insert into public.profiles (id, email, full_name)
select id, email, coalesce(raw_user_meta_data->>'full_name', '') from auth.users
on conflict (id) do nothing;

-- Allow the SQL Editor / Table Editor to change tier (only signed-in app users are blocked)
create or replace function public.protect_billing_columns()
returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.tier := old.tier;
    new.stripe_customer_id := old.stripe_customer_id;
    new.stripe_subscription_id := old.stripe_subscription_id;
    new.subscription_status := old.subscription_status;
  end if;
  new.updated_at := now();
  return new;
end $$;
