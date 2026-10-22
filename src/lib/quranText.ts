// Pure helpers for Quran text from the Quran.com API (no React Native imports, so they are unit-tested).

export type Verse = {
  key: string; // "2:255"
  number: number; // verse number within the surah
  page: number; // Madani mushaf page (1..604)
  juz: number;
  arabic: string; // text_uthmani, exactly as supplied
  translations: Record<string, string>; // by translation resource id
};

export type TranslationInfo = { id: number; name: string; language: string };

export type SurahData = {
  surah: number;
  verses: Verse[];
  translations: TranslationInfo[];
  fetchedAt: number;
};

/**
 * Translation text from the API can contain footnote markers like
 * <sup foot_note=123>1</sup>. Drop footnotes, then any other tags, and decode
 * the few entities the API uses. Never touches the Arabic Quran text.
 */
export function cleanTranslation(html: string): string {
  return html
    .replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Check that a downloaded surah is complete and in order before we trust or cache it. */
export function validateSurah(data: SurahData, expectedVerses: number, from = 1, to = expectedVerses): string | null {
  const want = to - from + 1;
  if (!Array.isArray(data.verses) || data.verses.length !== want) {
    return `expected ${want} verses, got ${data.verses?.length ?? 0}`;
  }
  for (let i = 0; i < data.verses.length; i++) {
    const v = data.verses[i];
    const n = from + i;
    if (v.number !== n || v.key !== `${data.surah}:${n}`) return `verse order broken at ${data.surah}:${n}`;
    if (typeof v.arabic !== 'string' || v.arabic.trim().length === 0) return `missing text at ${v.key}`;
    if (!(v.page >= 1 && v.page <= 604)) return `bad page at ${v.key}`;
  }
  return null;
}

type ApiVerse = {
  verse_key: string;
  verse_number: number;
  page_number: number;
  juz_number: number;
  text_uthmani: string;
  translations?: { resource_id: number; text: string; resource_name?: string; language_name?: string }[];
};

export function mapApiVerses(raw: ApiVerse[]): { verses: Verse[]; translations: TranslationInfo[] } {
  const infos = new Map<number, TranslationInfo>();
  const verses = raw.map((v) => {
    const tr: Record<string, string> = {};
    for (const t of v.translations ?? []) {
      tr[String(t.resource_id)] = cleanTranslation(t.text ?? '');
      if (!infos.has(t.resource_id)) {
        infos.set(t.resource_id, {
          id: t.resource_id,
          name: t.resource_name ?? `Translation ${t.resource_id}`,
          language: t.language_name ?? '',
        });
      }
    }
    return {
      key: v.verse_key,
      number: v.verse_number,
      page: v.page_number,
      juz: v.juz_number,
      arabic: v.text_uthmani,
      translations: tr,
    };
  });
  return { verses, translations: [...infos.values()] };
}

/** Pages touched by a set of read verse keys, using the page map of loaded verses. */
export function pagesRead(readKeys: Iterable<string>, pageOf: (key: string) => number | undefined): number {
  const pages = new Set<number>();
  for (const k of readKeys) {
    const p = pageOf(k);
    if (p) pages.add(p);
  }
  return pages.size;
}
