// What the home-screen widgets show. Pure (no React Native imports) so it is unit-tested
// and can run in the app or in the background widget task.
import { BUNDLED, type Content, dailyPick, type DailyItem } from '../lib/content';
import { dayKey, formatTime } from '../lib/dates';
import { PRAYER_LABELS, SALAH, timesFor, type PrayerName } from '../lib/prayer';
import { computeStreak } from '../lib/streak';
import { chapter } from '../data/chapters';
import { GOALS, type Progress, type Settings } from '../state/model';

export type WidgetData = {
  daily: DailyItem | null;
  /** Null until a location is set. `then` is shown too, so the widget stays useful between its 30-minute refreshes. */
  prayer: { next: string; then: string; place: string } | null;
  reading: {
    title: string;
    detail: string;
    progress: number; // 0..1
    met: boolean;
    streak: number;
    uri: string;
  };
};

export function buildWidgetData(settings: Settings, progress: Progress, content: Content, now: Date = new Date()): WidgetData {
  const today = dayKey(now);
  const items = content.daily_items?.length ? content.daily_items : BUNDLED.daily_items;
  const goal = GOALS[settings.goal] ?? GOALS.page;
  const target = goal.pages > 0 ? goal.pages : goal.verses;
  const done = goal.pages > 0 ? progress.pagesByDay[today]?.length ?? 0 : progress.versesByDay[today]?.length ?? 0;
  const met = progress.metDays.includes(today);
  const streak = computeStreak({ metDays: progress.metDays, pausedDays: progress.pausedDays, freezesPerMonth: 2, today }).current;
  const last = progress.lastRead;
  const ch = chapter(last?.surah ?? 1);
  const unit = goal.pages > 0 ? (target === 1 ? 'page' : 'pages') : 'ayah';
  return {
    daily: dailyPick(items, now),
    prayer: upcomingPrayers(settings, now),
    reading: {
      title: met ? 'Goal done · MashaAllah' : last ? `Continue ${ch?.name ?? 'reading'}` : 'Start with Al-Fatihah',
      detail: `${Math.min(done, target)} of ${target} ${unit}`,
      progress: target > 0 ? Math.min(1, done / target) : 0,
      met,
      streak,
      uri: last ? `khalad://surah/${last.surah}?verse=${last.verse}` : 'khalad://surah/1',
    },
  };
}

/** The next two of the five prayers after `now`, e.g. "Asr 4:27 pm" then "Maghrib 5:40 pm". */
export function upcomingPrayers(settings: Settings, now: Date): WidgetData['prayer'] {
  const loc = settings.location;
  if (!loc) return null;
  try {
    const cfg = { latitude: loc.lat, longitude: loc.lng, method: settings.method, hanafi: settings.hanafi, adjustments: settings.adjustments };
    const today = timesFor(cfg, now);
    const tomorrow = timesFor(cfg, new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12));
    const list: { name: PrayerName; time: Date }[] = [
      ...SALAH.map((name) => ({ name, time: today[name] })),
      ...SALAH.map((name) => ({ name, time: tomorrow[name] })),
    ].filter((p) => p.time.getTime() > now.getTime());
    const [a, b] = list;
    if (!a || !b) return null;
    const label = (p: { name: PrayerName; time: Date }) => `${PRAYER_LABELS[p.name]} ${formatTime(p.time, settings.use24h)}`;
    return { next: label(a), then: label(b), place: loc.label };
  } catch {
    return null;
  }
}
