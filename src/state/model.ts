// App data shapes, defaults and pure update helpers (unit-tested; no React Native imports).
import type { Adjustments, MethodKey } from '../lib/prayer';

export type GoalKind = 'ayah' | 'page' | 'two' | 'juz';
export const GOALS: Record<GoalKind, { label: string; sub: string; pages: number; verses: number }> = {
  ayah: { label: '1 ayah', sub: 'Gentle start', pages: 0, verses: 1 },
  page: { label: '1 page', sub: 'About 5 minutes', pages: 1, verses: 1 },
  two: { label: '2 pages', sub: 'About 10 minutes', pages: 2, verses: 1 },
  juz: { label: '1 juz', sub: 'Khatam in a month', pages: 20, verses: 1 },
};

export type SavedLocation = { lat: number; lng: number; label: string; source: 'gps' | 'city'; tz: string };

export type Settings = {
  v: 1;
  onboarded: boolean;
  location: SavedLocation | null;
  method: MethodKey;
  hanafi: boolean;
  adjustments: Adjustments;
  hijriAdjust: number;
  goal: GoalKind;
  prayerLine: boolean;
  reminders: Record<string, boolean>;
  salahChecklist: boolean;
  analytics: boolean;
  anonId: string;
  theme: 'system' | 'light' | 'dark';
  arabicFont: 'noto' | 'amiri' | 'scheherazade';
  arabicSize: 'small' | 'medium' | 'large' | 'extraLarge' | 'huge';
  /** Adhkar & duas: meaning hidden by default to keep the Arabic in focus. */
  adhkarMeaning: boolean;
  adhkarTransliteration: boolean;
  /** The one-time "add a widget" card on Today has been dealt with. */
  widgetPromptDone: boolean;
  showTranslation: boolean;
  translationLang: 'ur' | 'en';
  translationIds: { en: number; ur: number };
  keepAwake: boolean;
  use24h: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  v: 1,
  onboarded: false,
  location: null,
  method: 'MuslimWorldLeague',
  hanafi: false,
  adjustments: {},
  hijriAdjust: 0,
  goal: 'page',
  prayerLine: false,
  reminders: {},
  salahChecklist: false,
  analytics: true, // anonymous usage, on by default; off switch in More
  anonId: '',
  theme: 'system',
  arabicFont: 'noto',
  arabicSize: 'medium',
  adhkarMeaning: false,
  adhkarTransliteration: true,
  widgetPromptDone: false,
  showTranslation: true,
  translationLang: 'ur',
  // Quran.com translation resource ids. The app always shows the name the API returns.
  translationIds: { en: 20, ur: 97 },
  keepAwake: false,
  use24h: false,
};

export type Progress = {
  v: 1;
  /** Verse keys read per day, e.g. { "2026-10-22": ["2:142", "2:143"] } */
  versesByDay: Record<string, string[]>;
  /** Mushaf pages touched per day. */
  pagesByDay: Record<string, number[]>;
  metDays: string[];
  pausedDays: string[];
  paused: boolean;
  lastRead: { surah: number; verse: number } | null;
  /** Unique verse keys read in the current khatam. */
  khatam: string[];
  khatamsDone: number;
  adhkarDone: Record<string, string[]>;
  surahDone: Record<string, number[]>;
  salah: Record<string, string[]>;
  tasbih: { day: string; count: number };
  sadaqah: Sadaqah;
};

export type SadaqahMonth = { month: string; target: number; paid: number; currency: string };
/** The current month plus closed months. A closed month keeps the goal it had, so editing the goal never rewrites the past. */
export type Sadaqah = SadaqahMonth & { history: SadaqahMonth[]; recapSeen: string };

export const DEFAULT_PROGRESS: Progress = {
  v: 1,
  versesByDay: {},
  pagesByDay: {},
  metDays: [],
  pausedDays: [],
  paused: false,
  lastRead: null,
  khatam: [],
  khatamsDone: 0,
  adhkarDone: {},
  surahDone: {},
  salah: {},
  tasbih: { day: '', count: 0 },
  sadaqah: { month: '', target: 0, paid: 0, currency: 'PKR', history: [], recapSeen: '' },
};

const SADAQAH_HISTORY = 36;

/** Fill in fields older app versions didn't store. */
export function normalizeSadaqah(raw: unknown): Sadaqah {
  const d = DEFAULT_PROGRESS.sadaqah;
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
  const str = (v: unknown, f: string) => (typeof v === 'string' ? v : f);
  const history = Array.isArray(r.history)
    ? (r.history as unknown[])
        .filter((h): h is Record<string, unknown> => !!h && typeof h === 'object' && typeof (h as any).month === 'string')
        .map((h) => ({ month: h.month as string, target: num(h.target), paid: num(h.paid), currency: str(h.currency, d.currency) }))
    : [];
  return { month: str(r.month, ''), target: num(r.target), paid: num(r.paid), currency: str(r.currency, d.currency), history, recapSeen: str(r.recapSeen, '') };
}

/**
 * Move to `month` ("YYYY-MM"). A finished month is filed into history with the goal it had;
 * the goal and currency carry forward and the running total starts again at 0.
 */
export function rollSadaqah(raw: Sadaqah, month: string): Sadaqah {
  const s = normalizeSadaqah(raw);
  if (s.month === month) return s;
  if (!s.month) return { ...s, month, paid: 0 };
  if (s.month > month) return { ...s, month }; // phone clock went backwards: keep the total rather than lose it
  const used = s.paid > 0 || s.target > 0;
  const history = used
    ? [{ month: s.month, target: s.target, paid: s.paid, currency: s.currency }, ...s.history.filter((h) => h.month !== s.month)]
        .sort((a, b) => (a.month < b.month ? 1 : -1))
        .slice(0, SADAQAH_HISTORY)
    : s.history;
  return { ...s, month, paid: 0, history };
}

/** "YYYY-MM" for the month before `month`. */
export function previousMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}

/** Merge stored data over defaults so new fields added in later versions get sensible values. */
export function hydrate<T extends object>(defaults: T, stored: unknown): T {
  if (!stored || typeof stored !== 'object') return { ...defaults };
  const out = { ...defaults } as Record<string, unknown>;
  for (const k of Object.keys(defaults)) {
    const v = (stored as Record<string, unknown>)[k];
    const d = (defaults as Record<string, unknown>)[k];
    if (v === undefined) continue;
    if (d === null || typeof v === typeof d) out[k] = v;
  }
  return out as T;
}

export function goalMet(goal: GoalKind, verses: number, pages: number): boolean {
  const g = GOALS[goal];
  return verses >= g.verses && pages >= g.pages;
}

/** Record verses read today; returns a new Progress (never mutates). */
export function recordVerses(
  p: Progress,
  today: string,
  verses: { key: string; page: number }[],
  goal: GoalKind,
): Progress {
  if (verses.length === 0) return p;
  const dayVerses = new Set(p.versesByDay[today] ?? []);
  const dayPages = new Set(p.pagesByDay[today] ?? []);
  const khatam = new Set(p.khatam);
  let changed = false;
  for (const v of verses) {
    if (!dayVerses.has(v.key)) {
      dayVerses.add(v.key);
      changed = true;
    }
    if (v.page >= 1 && v.page <= 604 && !dayPages.has(v.page)) {
      dayPages.add(v.page);
      changed = true;
    }
    khatam.add(v.key);
  }
  if (!changed && khatam.size === p.khatam.length) return p;

  let khatamsDone = p.khatamsDone;
  let khatamList = [...khatam];
  if (khatamList.length >= 6236) {
    khatamsDone += 1;
    khatamList = [];
  }
  const met = goalMet(goal, dayVerses.size, dayPages.size);
  const metDays = met && !p.metDays.includes(today) ? [...p.metDays, today] : p.metDays;
  return prune({
    ...p,
    versesByDay: { ...p.versesByDay, [today]: [...dayVerses] },
    pagesByDay: { ...p.pagesByDay, [today]: [...dayPages] },
    metDays,
    khatam: khatamList,
    khatamsDone,
  });
}

export function toggleInDay<T>(map: Record<string, T[]>, day: string, value: T): Record<string, T[]> {
  const list = map[day] ?? [];
  const next = list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
  return { ...map, [day]: next };
}

export function addToDay<T>(map: Record<string, T[]>, day: string, value: T): Record<string, T[]> {
  const list = map[day] ?? [];
  return list.includes(value) ? map : { ...map, [day]: [...list, value] };
}

const KEEP_DAYS = 400;

/** Keep per-day maps from growing forever. */
export function prune(p: Progress): Progress {
  const trim = <T>(m: Record<string, T>): Record<string, T> => {
    const keys = Object.keys(m).sort();
    if (keys.length <= KEEP_DAYS) return m;
    const keep = new Set(keys.slice(-KEEP_DAYS));
    return Object.fromEntries(Object.entries(m).filter(([k]) => keep.has(k)));
  };
  // Only today's verse list is needed in full; older days keep page lists only.
  const vKeys = Object.keys(p.versesByDay).sort();
  const versesByDay = vKeys.length > 2 ? Object.fromEntries(vKeys.slice(-2).map((k) => [k, p.versesByDay[k]])) : p.versesByDay;
  return {
    ...p,
    versesByDay,
    pagesByDay: trim(p.pagesByDay),
    adhkarDone: trim(p.adhkarDone),
    surahDone: trim(p.surahDone),
    salah: trim(p.salah),
    metDays: p.metDays.slice(-KEEP_DAYS * 2),
    pausedDays: p.pausedDays.slice(-KEEP_DAYS),
  };
}
