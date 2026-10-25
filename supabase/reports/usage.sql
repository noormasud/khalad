-- Khalad usage reports. Paste any block into Supabase → SQL Editor and Run.
-- Read-only queries. (Deliberately NOT views: a view in the public schema could become readable by the app.)

-- 1) Daily active users (people who opened the app that day)
select date(created_at) as day, count(distinct anon_id) as users
from events where name = 'app_open'
group by 1 order by 1 desc limit 60;

-- 2) Which features get used (last 30 days): screens by number of different people
select props->>'screen' as screen, count(distinct anon_id) as people, count(*) as views
from events
where name = 'screen_view' and created_at > now() - interval '30 days'
group by 1 order by people desc;

-- 3) What does NOT get used: screens fewer than 5% of active users opened (last 30 days)
with active as (select count(distinct anon_id) n from events where created_at > now() - interval '30 days')
select props->>'screen' as screen, count(distinct anon_id) as people,
       round(100.0 * count(distinct anon_id) / nullif((select n from active), 0), 1) as pct_of_users
from events
where name = 'screen_view' and created_at > now() - interval '30 days'
group by 1 having count(distinct anon_id) < 0.05 * (select n from active)
order by people;

-- 4) Most opened surahs and adhkar/duas
select props->>'screen' as kind, props->>'id' as item, count(distinct anon_id) as people
from events where name = 'screen_view' and props->>'screen' in ('surah', 'adhkar')
group by 1, 2 order by people desc limit 40;

-- 5) Adhkar actually completed (not just opened)
select props->>'set' as set, count(*) as completions, count(distinct anon_id) as people
from events where name = 'adhkar_done' group by 1 order by completions desc;

-- 6) Reading: sessions per day, and how many people met their goal
select date(created_at) as day,
       count(*) filter (where name = 'read_session') as reading_sessions,
       count(distinct anon_id) filter (where name = 'goal_met') as met_goal
from events group by 1 order by 1 desc limit 60;

-- 7) Streaks: distribution of current streaks (latest app_open per person)
select streak, count(*) as people from (
  select distinct on (anon_id) (props->>'streak')::int as streak
  from events where name = 'app_open' order by anon_id, created_at desc
) s group by 1 order by 1;

-- 8) Which reminders bring people back (notification taps)
select props->>'target' as opened, count(*) as taps
from events where name = 'notification_tap' group by 1 order by taps desc;

-- 9) Reminders switched on vs off
select props->>'key' as reminder,
       count(*) filter (where props->>'on' = 'true')  as turned_on,
       count(*) filter (where props->>'on' = 'false') as turned_off
from events where name = 'reminder_toggle' group by 1;

-- 10) Preferences (latest snapshot per person): translation language, text size, dark mode, lock-screen line
select props->>'tr_lang' as lang, props->>'text_size' as size, props->>'dark' as dark,
       props->>'lock_line' as lock_line, count(*) as people
from (select distinct on (anon_id) props from events where name = 'app_open' order by anon_id, created_at desc) p
group by 1, 2, 3, 4 order by people desc;

-- 11) Onboarding funnel: how far people get
select props->>'screen' as step, count(distinct anon_id) as people
from events
where name = 'screen_view' and props->>'screen' like 'onboarding%'
group by 1 order by people desc;

-- 12) Settings people change most
select props->>'key' as setting, props->>'value' as value, count(*) as changes
from events where name = 'setting_change' group by 1, 2 order by changes desc limit 40;

-- 13) Return rate: of people first seen in a week, how many came back the next week
with first_seen as (select anon_id, min(date(created_at)) d from events group by 1)
select date_trunc('week', f.d)::date as cohort_week, count(*) as new_people,
       count(*) filter (where exists (
         select 1 from events e where e.anon_id = f.anon_id
           and date(e.created_at) between f.d + 7 and f.d + 13)) as came_back_week_2
from first_seen f group by 1 order by 1 desc;

-- 14) Supporter interest and Today taps
select name, props->>'slot' as slot, props->>'target' as target, count(*)
from events where name in ('supporter_interest', 'today_tap') group by 1, 2, 3 order by 4 desc;

-- 15) Long-term trends (kept forever, after raw events are pruned at 90 days; needs migration 0005)
select day, name, screen, people, events from events_daily order by day desc, people desc limit 200;
