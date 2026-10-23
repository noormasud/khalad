-- Fast reminders: store the FAST days and remind the evening before.
-- Safe to run more than once.
alter table public.sunnah_reminders
  add column if not exists day_before boolean not null default false;

update public.sunnah_reminders
   set weekdays = array[1,4]::smallint[], day_before = true,
       subtitle = 'Reminder the evening before, after Maghrib'
 where key = 'fast_mon_thu';

update public.sunnah_reminders
   set hijri_days = array[13,14,15]::smallint[], day_before = true,
       subtitle = '13th–15th Hijri · reminder the evening before'
 where key = 'white_days';
