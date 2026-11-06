-- Each user's time zone (IANA name, e.g. "Australia/Brisbane"), set automatically by the app.
-- Used for "today", calendars and sending the weekly email on the user's own Monday morning.
alter table public.profiles add column if not exists timezone text;
