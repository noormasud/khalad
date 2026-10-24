// Works out WHEN quiet notifications should fire. Pure logic (no Expo imports) so it is unit-tested.
import { addDays, formatTime } from './dates';
import { HIJRI_MONTHS, type HijriDate, toHijri } from './hijri';
import { type DayTimes, PRAYER_LABELS, type PrayerName, SALAH } from './prayer';

export type ReminderRule = {
  key: string;
  title: string;
  subtitle?: string | null;
  rule: 'daily' | 'weekly' | 'hijri_monthly';
  weekdays?: number[] | null;
  hijri_days?: number[] | null;
  anchor: PrayerName;
  offset_min: number;
  surah?: number | null;
  set_key?: string | null;
  /**
   * For fasts: `weekdays` / `hijri_days` name the FAST days, and the reminder fires
   * the evening BEFORE (anchor + offset on the previous day), since the fast begins at Fajr.
   */
  day_before?: boolean | null;
};

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Days on which a voluntary fast must not be kept, plus Ramadan (already fasting). */
export function noVoluntaryFast(h: HijriDate): boolean {
  if (h.month === 9) return true; // Ramadan
  if (h.month === 10 && h.day === 1) return true; // Eid al-Fitr
  if (h.month === 12 && h.day >= 10 && h.day <= 13) return true; // Eid al-Adha + days of Tashriq
  return false;
}

export type PlannedNotification = {
  id: string;
  at: Date;
  title: string;
  body: string;
  channel: 'prayer' | 'reminders';
  data: { route: string };
};

export type PlanInput = {
  now: Date;
  days: number;
  timesForDate: (d: Date) => DayTimes;
  prayerLine: boolean;
  reminders: ReminderRule[];
  enabledReminders: Record<string, boolean>;
  hijriAdjust: number;
  use24h?: boolean;
};

/** Plans notifications for the next `days` days, soonest first. Android caps alarms, so keep `days` small. */
export function planNotifications(input: PlanInput): PlannedNotification[] {
  const out: PlannedNotification[] = [];
  const start = new Date(input.now.getFullYear(), input.now.getMonth(), input.now.getDate(), 12);

  for (let i = 0; i < input.days; i++) {
    const day = addDays(start, i);
    day.setHours(12);
    const times = input.timesForDate(day);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    next.setHours(12);
    const tomorrowFajr = input.timesForDate(next).fajr;

    if (input.prayerLine) {
      // At each prayer time, post a silent line naming the NEXT prayer.
      SALAH.forEach((name, idx) => {
        const nextName = SALAH[idx + 1] ?? 'fajr';
        const nextTime = nextName === 'fajr' ? tomorrowFajr : times[nextName];
        out.push({
          id: `prayer-${times[name].getTime()}`,
          at: times[name],
          title: `${PRAYER_LABELS[nextName]} ${formatTime(nextTime, input.use24h)}`,
          body: `Next prayer · now ${PRAYER_LABELS[name]}`,
          channel: 'prayer',
          data: { route: '/' },
        });
      });
    }

    const hijri = toHijri(day, input.hijriAdjust);
    const hijriNext = toHijri(next, input.hijriAdjust);
    for (const r of input.reminders) {
      if (!input.enabledReminders[r.key]) continue;
      const before = !!r.day_before;
      // The day the deed belongs to: today, or tomorrow for a fast reminded the evening before.
      const target = before ? next : day;
      const h = before ? hijriNext : hijri;
      const due =
        r.rule === 'daily' ||
        (r.rule === 'weekly' && (r.weekdays ?? []).includes(target.getDay())) ||
        (r.rule === 'hijri_monthly' && (r.hijri_days ?? []).includes(h.day));
      const anchor = times[r.anchor];
      if (!due || !anchor || !Number.isFinite(r.offset_min)) continue;
      if (before && noVoluntaryFast(h)) continue;
      const at = new Date(anchor.getTime() + r.offset_min * 60000);
      const route = r.surah ? `/surah/${r.surah}?mark=1` : r.set_key ? `/adhkar/${r.set_key}` : '/deeds';
      const label = r.rule === 'hijri_monthly' ? `${h.day} ${HIJRI_MONTHS[h.month - 1]}` : WEEKDAYS[target.getDay()];
      out.push({
        id: `rem-${r.key}-${at.getTime()}`,
        at,
        title: before ? `Sunnah fast tomorrow · ${label}` : r.title,
        body: before ? `${r.title}. Suhoor ends at Fajr, ${formatTime(tomorrowFajr, input.use24h)}.` : r.subtitle ?? '',
        channel: 'reminders',
        data: { route },
      });
    }
  }

  return out.filter((n) => n.at.getTime() > input.now.getTime() + 30000).sort((a, b) => a.at.getTime() - b.at.getTime());
}
