-- Khalad content + community schema.
-- Run once in the Supabase SQL editor (or `supabase db push`).
--
-- Security model
--   * The app ships only the publishable (anon) key.
--   * Every table has Row Level Security ON.
--   * Content tables are READ-ONLY for the app, and only rows marked
--     active (and, for hadith/sunnah, verified) are visible.
--   * You edit content in the Supabase dashboard / future admin panel,
--     which uses your own login or the service role (bypasses RLS).
--   * Ummah-goal counts can only change through the `contribute` function,
--     which needs a (possibly anonymous) signed-in user and caps daily counts.
--   * Analytics events are insert-only and size-limited; the app can never read them.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Daily hadith / sunnah
-- ---------------------------------------------------------------------------
create table if not exists public.daily_items (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('hadith', 'sunnah')),
  text        text not null check (char_length(text) between 3 and 1000),
  reference   text check (char_length(reference) <= 120),
  lang        text not null default 'en' check (lang in ('en', 'ur')),
  verified    boolean not null default false,   -- only verified rows reach the app
  verified_by text,                              -- e.g. scholar's name, for your records
  active      boolean not null default true,
  sort        integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Adhkar / duas, grouped in sets
-- ---------------------------------------------------------------------------
create table if not exists public.adhkar_sets (
  key         text primary key check (key ~ '^[a-z0-9_]{2,40}$'),
  title       text not null,
  subtitle    text,
  category    text not null check (category in ('daily', 'duas', 'after_salah', 'seasonal')),
  time_of_day text check (time_of_day in ('morning', 'evening', 'night', 'any')),
  weekdays    smallint[],                        -- 0=Sun..6=Sat; null = every day
  active      boolean not null default true,
  sort        integer not null default 0,
  updated_at  timestamptz not null default now()
);

create table if not exists public.adhkar_items (
  id              uuid primary key default gen_random_uuid(),
  set_key         text not null references public.adhkar_sets(key) on delete cascade,
  sort            integer not null default 0,
  type            text not null check (type in ('dua', 'quran')),
  title           text not null,
  arabic          text,
  translation     text,
  transliteration text,
  reference       text,
  repeat          smallint not null default 1 check (repeat between 1 and 1000),
  surah           smallint check (surah between 1 and 114),
  verse_from      smallint check (verse_from >= 1),
  verse_to        smallint check (verse_to >= 1),
  active          boolean not null default true,
  updated_at      timestamptz not null default now(),
  constraint quran_needs_range check (
    type <> 'quran' or (surah is not null and verse_from is not null and verse_to is not null and verse_to >= verse_from)
  ),
  constraint dua_needs_arabic check (type <> 'dua' or arabic is not null)
);
create index if not exists adhkar_items_set_idx on public.adhkar_items (set_key, sort);

-- ---------------------------------------------------------------------------
-- Sunnah reminders (rule-driven, so new ones need no app update)
-- ---------------------------------------------------------------------------
create table if not exists public.sunnah_reminders (
  key           text primary key check (key ~ '^[a-z0-9_]{2,40}$'),
  title         text not null,
  subtitle      text,
  rule          text not null check (rule in ('daily', 'weekly', 'hijri_monthly')),
  weekdays      smallint[],      -- for 'weekly': 0=Sun..6=Sat
  hijri_days    smallint[],      -- for 'hijri_monthly'
  anchor        text not null default 'isha' check (anchor in ('fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha')),
  offset_min    smallint not null default 30 check (offset_min between -180 and 300),
  surah         smallint check (surah between 1 and 114),   -- opens this surah when tapped
  set_key       text references public.adhkar_sets(key),     -- or opens this adhkar set
  on_by_default boolean not null default false,
  active        boolean not null default true,
  sort          integer not null default 0,
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Seasonal challenges (e.g. first 10 days of Dhul Hijjah)
-- ---------------------------------------------------------------------------
create table if not exists public.seasonal_challenges (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  subtitle    text,
  hijri_month smallint not null check (hijri_month between 1 and 12),
  hijri_days  smallint[] not null,
  set_key     text references public.adhkar_sets(key),
  surah       smallint check (surah between 1 and 114),
  active      boolean not null default true,
  sort        integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Ummah goals: one shared counter everyone adds to
-- ---------------------------------------------------------------------------
create table if not exists public.ummah_goals (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  subtitle   text,
  unit       text not null default 'recitations',
  target     bigint not null check (target > 0),
  starts_on  date not null,
  ends_on    date not null check (ends_on >= starts_on),
  surah      smallint check (surah between 1 and 114),
  verse_from smallint,
  verse_to   smallint,
  active     boolean not null default true,
  sort       integer not null default 0
);

create table if not exists public.goal_contributions (
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.ummah_goals(id) on delete cascade,
  day     date not null default (now() at time zone 'utc')::date,
  count   integer not null default 0 check (count between 0 and 500),
  primary key (user_id, goal_id, day)
);

-- ---------------------------------------------------------------------------
-- App config (feature switches without an app update)
-- ---------------------------------------------------------------------------
create table if not exists public.app_config (
  key   text primary key,
  value jsonb not null
);

-- ---------------------------------------------------------------------------
-- Opt-in, anonymous analytics
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id         bigint generated always as identity primary key,
  anon_id    text not null check (char_length(anon_id) between 8 and 64),
  name       text not null check (name ~ '^[a-z0-9_]{2,48}$'),
  props      jsonb not null default '{}'::jsonb check (pg_column_size(props) < 2048),
  app_version text check (char_length(app_version) <= 20),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.daily_items         enable row level security;
alter table public.adhkar_sets         enable row level security;
alter table public.adhkar_items        enable row level security;
alter table public.sunnah_reminders    enable row level security;
alter table public.seasonal_challenges enable row level security;
alter table public.ummah_goals         enable row level security;
alter table public.goal_contributions  enable row level security;
alter table public.app_config          enable row level security;
alter table public.events              enable row level security;

-- Read-only content
create policy "read verified daily items" on public.daily_items
  for select to anon, authenticated using (active and verified);
create policy "read active sets" on public.adhkar_sets
  for select to anon, authenticated using (active);
create policy "read active items" on public.adhkar_items
  for select to anon, authenticated using (
    active and exists (select 1 from public.adhkar_sets s where s.key = set_key and s.active)
  );
create policy "read active reminders" on public.sunnah_reminders
  for select to anon, authenticated using (active);
create policy "read active challenges" on public.seasonal_challenges
  for select to anon, authenticated using (active);
create policy "read active goals" on public.ummah_goals
  for select to anon, authenticated using (active);
create policy "read config" on public.app_config
  for select to anon, authenticated using (true);

-- Contributions: users may read only their own rows; writes only via contribute()
create policy "read own contributions" on public.goal_contributions
  for select to authenticated using (user_id = auth.uid());

-- Analytics: insert only, never readable from the app
create policy "insert events" on public.events
  for insert to anon, authenticated with check (true);

-- Lock down table privileges to exactly what the policies need
revoke all on all tables in schema public from anon, authenticated;
grant select on public.daily_items, public.adhkar_sets, public.adhkar_items,
               public.sunnah_reminders, public.seasonal_challenges,
               public.ummah_goals, public.app_config to anon, authenticated;
grant select on public.goal_contributions to authenticated;
grant insert (anon_id, name, props, app_version) on public.events to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------
-- Add to an Ummah goal. Caps each user at 500 per goal per day.
create or replace function public.contribute(p_goal uuid, p_count integer)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := (now() at time zone 'utc')::date;
  v_goal public.ummah_goals%rowtype;
  v_total bigint;
begin
  if v_uid is null then
    raise exception 'not signed in';
  end if;
  if p_count is null or p_count < 1 or p_count > 100 then
    raise exception 'invalid count';
  end if;
  select * into v_goal from public.ummah_goals where id = p_goal and active;
  if not found or v_today < v_goal.starts_on or v_today > v_goal.ends_on then
    raise exception 'goal not open';
  end if;

  insert into public.goal_contributions (user_id, goal_id, day, count)
  values (v_uid, p_goal, v_today, least(p_count, 500))
  on conflict (user_id, goal_id, day)
  do update set count = least(public.goal_contributions.count + excluded.count, 500);

  select coalesce(sum(count), 0) into v_total from public.goal_contributions where goal_id = p_goal;
  return v_total;
end;
$$;

-- Public totals for active goals (no per-user data exposed)
create or replace function public.goal_totals()
returns table (goal_id uuid, total bigint)
language sql
stable
security definer
set search_path = public
as $$
  select g.id, coalesce(sum(c.count), 0)::bigint
  from public.ummah_goals g
  left join public.goal_contributions c on c.goal_id = g.id
  where g.active
  group by g.id;
$$;

revoke all on function public.contribute(uuid, integer) from public;
revoke all on function public.goal_totals() from public;
grant execute on function public.contribute(uuid, integer) to authenticated;
grant execute on function public.goal_totals() to anon, authenticated;

-- Keep updated_at fresh so the app can tell when content changed
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

create trigger daily_items_touch      before update on public.daily_items      for each row execute function public.touch_updated_at();
create trigger adhkar_sets_touch      before update on public.adhkar_sets      for each row execute function public.touch_updated_at();
create trigger adhkar_items_touch     before update on public.adhkar_items     for each row execute function public.touch_updated_at();
create trigger sunnah_reminders_touch before update on public.sunnah_reminders for each row execute function public.touch_updated_at();
