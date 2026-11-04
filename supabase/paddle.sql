-- Run once in Supabase SQL Editor to switch billing from Stripe to Paddle.
alter table public.profiles add column if not exists paddle_customer_id text;
alter table public.profiles add column if not exists paddle_subscription_id text;
create index if not exists profiles_paddle_customer on public.profiles (paddle_customer_id);

create or replace function public.protect_billing_columns()
returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.tier := old.tier;
    new.paddle_customer_id := old.paddle_customer_id;
    new.paddle_subscription_id := old.paddle_subscription_id;
    new.subscription_status := old.subscription_status;
  end if;
  new.updated_at := now();
  return new;
end $$;
