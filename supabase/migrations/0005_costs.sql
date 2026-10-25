-- Keep Supabase within the free plan as usage grows. Safe to run more than once.
--
-- 1) content_version: bumped automatically whenever content changes, so phones download content
--    only when something actually changed (otherwise a few-byte check).
-- 2) Usage events: summarised into events_daily every night, raw rows kept 90 days.

-- 1) Content version ---------------------------------------------------------
insert into public.app_config (key, value)
values ('content_version', to_jsonb(extract(epoch from now())::bigint))
on conflict (key) do nothing;

create or replace function public.bump_content_version() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.app_config (key, value)
  values ('content_version', to_jsonb(extract(epoch from clock_timestamp())::bigint))
  on conflict (key) do update set value = excluded.value;
  return null;
end $$;
revoke all on function public.bump_content_version() from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['daily_items', 'adhkar_sets', 'adhkar_items', 'sunnah_reminders', 'seasonal_challenges', 'ummah_goals'] loop
    execute format('drop trigger if exists bump_content_version on public.%I', t);
    execute format('create trigger bump_content_version after insert or update or delete or truncate on public.%I '
                   'for each statement execute function public.bump_content_version()', t);
  end loop;
end $$;

-- 2) Usage events: daily summary + 90-day retention --------------------------
create index if not exists events_created_at_idx on public.events (created_at);

create table if not exists public.events_daily (
  day     date not null,
  name    text not null,
  screen  text not null default '',
  people  integer not null,
  events  integer not null,
  primary key (day, name, screen)
);
alter table public.events_daily enable row level security;      -- no policies: the app can't read or write it
revoke all on public.events_daily from anon, authenticated;

create or replace function public.rollup_and_prune_events() returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.events_daily (day, name, screen, people, events)
  select date(created_at), name, coalesce(props->>'screen', ''), count(distinct anon_id), count(*)
  from public.events
  where created_at < date_trunc('day', now())
  group by 1, 2, 3
  on conflict (day, name, screen) do update set people = excluded.people, events = excluded.events;

  delete from public.events where created_at < now() - interval '90 days';
end $$;
revoke all on function public.rollup_and_prune_events() from public, anon, authenticated;

-- Nightly at 00:15 UTC (pg_cron is available on every Supabase plan).
create extension if not exists pg_cron;
select cron.schedule('khalad-events-rollup', '15 0 * * *', $$select public.rollup_and_prune_events()$$);
