import { readJson, writeJson } from './storage';
import { supabase } from './supabase';
import bundled from '../data/bundled-content.json';
import type { ReminderRule } from './schedule';

// Content (adhkar, duas, reminders, challenges, hadith, goals) is managed in Supabase.
// The app keeps the last good copy on the phone and ships with a bundled copy,
// so it works on first launch and offline. New rows appear without an app update.

export type AdhkarSet = {
  key: string;
  title: string;
  subtitle: string | null;
  category: 'daily' | 'duas' | 'after_salah' | 'seasonal';
  time_of_day: 'morning' | 'evening' | 'night' | 'any' | null;
  weekdays: number[] | null;
  sort: number;
};

export type AdhkarItem = {
  set_key: string;
  sort: number;
  type: 'dua' | 'quran';
  title: string;
  arabic: string | null;
  translation: string | null;
  transliteration: string | null;
  reference: string | null;
  repeat: number;
  surah: number | null;
  verse_from: number | null;
  verse_to: number | null;
};

export type DailyItem = { id?: string; kind: 'hadith' | 'sunnah'; text: string; reference: string | null; sort?: number };

export type SeasonalChallenge = {
  title: string;
  subtitle: string | null;
  hijri_month: number;
  hijri_days: number[];
  set_key: string | null;
  surah?: number | null;
  sort: number;
};

export type UmmahGoal = {
  id: string;
  title: string;
  subtitle: string | null;
  unit: string;
  target: number;
  starts_on: string;
  ends_on: string;
  surah: number | null;
  verse_from: number | null;
  verse_to: number | null;
  sort: number;
};

export type Content = {
  version: number;
  adhkar_sets: AdhkarSet[];
  adhkar_items: AdhkarItem[];
  sunnah_reminders: (ReminderRule & { on_by_default: boolean; sort: number })[];
  seasonal_challenges: SeasonalChallenge[];
  daily_items: DailyItem[];
  ummah_goals: UmmahGoal[];
  fetchedAt?: number;
  /** Server's content_version when this copy was downloaded (bumped automatically on any content edit). */
  contentVersion?: number;
};

const KEY = 'khalad.content.v1';
export const BUNDLED = bundled as unknown as Content;

function isContent(x: unknown): x is Content {
  const c = x as Content;
  return !!c && Array.isArray(c.adhkar_sets) && Array.isArray(c.adhkar_items) && Array.isArray(c.sunnah_reminders);
}

export async function loadCachedContent(): Promise<Content> {
  const cached = await readJson<unknown>(KEY, null as unknown);
  return isContent(cached) ? cached : BUNDLED;
}

const REMINDER_COLS = 'key,title,subtitle,rule,weekdays,hijri_days,anchor,offset_min,surah,set_key,on_by_default,sort';

/** Reminders, including `day_before` once migration 0002 has run (older databases still work without it). */
async function fetchReminders() {
  const withFlag = await supabase.from('sunnah_reminders').select(`${REMINDER_COLS},day_before`).order('sort');
  if (!withFlag.error) return withFlag;
  return supabase.from('sunnah_reminders').select(REMINDER_COLS).order('sort');
}

/** The server's content version: a tiny request. Null when unknown (offline / not set up). */
export async function fetchContentVersion(): Promise<number | null> {
  try {
    const { data, error } = await supabase.from('app_config').select('value').eq('key', 'content_version').maybeSingle();
    if (error || data == null) return null;
    const v = Number(data.value);
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

/**
 * Download content only when it changed on the server. If the version matches the copy on the
 * phone, just mark it as checked (a few bytes instead of the whole set).
 */
export async function refreshContent(current: Content): Promise<Content | null> {
  const version = await fetchContentVersion();
  if (version != null && current.contentVersion === version && current.fetchedAt) {
    const touched = { ...current, fetchedAt: Date.now() };
    await writeJson(KEY, touched);
    return touched;
  }
  const fresh = await fetchContent();
  if (!fresh) return null;
  const withVersion = version != null ? { ...fresh, contentVersion: version } : fresh;
  if (version != null) await writeJson(KEY, withVersion);
  return withVersion;
}

/** Fetch fresh content. Returns null (keeping the cached copy) on any failure. */
export async function fetchContent(): Promise<Content | null> {
  try {
    const [sets, items, reminders, challenges, daily, goals] = await Promise.all([
      supabase.from('adhkar_sets').select('key,title,subtitle,category,time_of_day,weekdays,sort').order('sort'),
      supabase
        .from('adhkar_items')
        .select('set_key,sort,type,title,arabic,translation,transliteration,reference,repeat,surah,verse_from,verse_to')
        .order('sort'),
      fetchReminders(),
      supabase.from('seasonal_challenges').select('title,subtitle,hijri_month,hijri_days,set_key,surah,sort').order('sort'),
      supabase.from('daily_items').select('id,kind,text,reference,sort').order('sort'),
      supabase.from('ummah_goals').select('id,title,subtitle,unit,target,starts_on,ends_on,surah,verse_from,verse_to,sort').order('sort'),
    ]);
    const failed = [sets, items, reminders, challenges, daily, goals].find((r) => r.error);
    if (failed) return null;
    const content: Content = {
      version: 1,
      adhkar_sets: (sets.data ?? []) as AdhkarSet[],
      adhkar_items: (items.data ?? []) as AdhkarItem[],
      sunnah_reminders: (reminders.data ?? []) as Content['sunnah_reminders'],
      seasonal_challenges: (challenges.data ?? []) as SeasonalChallenge[],
      daily_items: (daily.data ?? []) as DailyItem[],
      ummah_goals: (goals.data ?? []) as UmmahGoal[],
      fetchedAt: Date.now(),
    };
    // An empty server (not set up yet) should not wipe the bundled adhkar.
    if (content.adhkar_sets.length === 0) {
      content.adhkar_sets = BUNDLED.adhkar_sets;
      content.adhkar_items = BUNDLED.adhkar_items;
    }
    if (content.sunnah_reminders.length === 0) content.sunnah_reminders = BUNDLED.sunnah_reminders;
    if (content.daily_items.length === 0) content.daily_items = BUNDLED.daily_items;
    await writeJson(KEY, content);
    return content;
  } catch {
    return null;
  }
}

export function itemsFor(content: Content, setKey: string): AdhkarItem[] {
  return content.adhkar_items.filter((i) => i.set_key === setKey).sort((a, b) => a.sort - b.sort);
}

/** Same item every day for everyone, rotating through the list. */
export function dailyPick(items: DailyItem[], date: Date): DailyItem | null {
  if (items.length === 0) return null;
  const start = new Date(date.getFullYear(), 0, 0);
  const doy = Math.floor((date.getTime() - start.getTime()) / 86400000);
  const idx = (date.getFullYear() * 366 + doy) % items.length;
  return items[idx];
}

export async function goalTotals(): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase.rpc('goal_totals');
    if (error || !Array.isArray(data)) return {};
    return Object.fromEntries(data.map((r: { goal_id: string; total: number }) => [r.goal_id, Number(r.total)]));
  } catch {
    return {};
  }
}
