import * as FileSystem from 'expo-file-system/legacy';
import { QURAN_API } from './config';
import { chapter } from '../data/chapters';
import { mapApiVerses, type SurahData, type TranslationInfo, validateSurah, type Verse } from './quranText';

// Quran text comes only from the Quran.com API (Quran Foundation), unchanged.
// Each surah is downloaded once, checked for completeness and order, then kept on the phone.

const DIR = `${FileSystem.documentDirectory ?? ''}quran/`;
const PER_PAGE = 50; // the API's maximum page size
const TIMEOUT_MS = 15000;

async function fetchJson(url: string): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Quran service returned ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function fileFor(surah: number, ids: number[]): string {
  return `${DIR}s${surah}-t${[...ids].sort((a, b) => a - b).join('_')}.json`;
}

async function readCached(path: string): Promise<SurahData | null> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;
    return JSON.parse(await FileSystem.readAsStringAsync(path)) as SurahData;
  } catch {
    return null;
  }
}

async function download(surah: number, ids: number[]): Promise<SurahData> {
  const all: Verse[] = [];
  const infos = new Map<number, TranslationInfo>();
  let page = 1;
  for (let guard = 0; guard < 10; guard++) {
    const params = new URLSearchParams({
      language: 'en',
      words: 'false',
      fields: 'text_uthmani',
      per_page: String(PER_PAGE),
      page: String(page),
    });
    if (ids.length) {
      params.set('translations', ids.join(','));
      params.set('translation_fields', 'resource_name,language_name');
    }
    const json = await fetchJson(`${QURAN_API}/verses/by_chapter/${surah}?${params.toString()}`);
    const { verses, translations } = mapApiVerses(json.verses ?? []);
    all.push(...verses);
    translations.forEach((t) => infos.set(t.id, t));
    const next = json.pagination?.next_page;
    if (!next) break;
    page = next;
  }
  return { surah, verses: all, translations: [...infos.values()], fetchedAt: Date.now() };
}

/** Full surah with the requested translations. Uses the phone copy when available. */
export async function getSurah(surah: number, translationIds: number[]): Promise<SurahData> {
  const ch = chapter(surah);
  if (!ch) throw new Error('Unknown surah');
  const path = fileFor(surah, translationIds);
  const cached = await readCached(path);
  if (cached && !validateSurah(cached, ch.verses)) return cached;

  const fresh = await download(surah, translationIds);
  const problem = validateSurah(fresh, ch.verses);
  if (problem) throw new Error(`Downloaded text failed a check (${problem}). Please try again.`);
  try {
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
    await FileSystem.writeAsStringAsync(path, JSON.stringify(fresh));
  } catch {
    // Could not cache; still show the text.
  }
  return fresh;
}

/** A verse range (for adhkar and challenges), taken from the full, validated surah. */
export async function getVerses(surah: number, from: number, to: number, translationIds: number[]): Promise<Verse[]> {
  const data = await getSurah(surah, translationIds);
  return data.verses.filter((v) => v.number >= from && v.number <= to);
}

export type TranslationOption = { id: number; name: string; author: string; language: string };

/** Urdu and English translations offered by Quran.com, for the settings picker. */
export async function listTranslations(): Promise<TranslationOption[]> {
  const json = await fetchJson(`${QURAN_API}/resources/translations`);
  const list: any[] = json.translations ?? [];
  return list
    .filter((t) => ['english', 'urdu'].includes(String(t.language_name).toLowerCase()))
    .map((t) => ({
      id: Number(t.id),
      name: String(t.translated_name?.name ?? t.name ?? ''),
      author: String(t.author_name ?? ''),
      language: String(t.language_name),
    }))
    .filter((t) => Number.isFinite(t.id) && t.name);
}

export async function clearQuranCache(): Promise<void> {
  try {
    await FileSystem.deleteAsync(DIR, { idempotent: true });
  } catch {
    // ignore
  }
}
