// Unit tests for the pure logic. Runs under Jest (`npm test`).
import { computeStreak } from '../src/lib/streak';
import { toHijri } from '../src/lib/hijri';
import { addDays, dayKey, formatTime } from '../src/lib/dates';
import { cleanTranslation, mapApiVerses, validateSurah } from '../src/lib/quranText';
import { planNotifications } from '../src/lib/schedule';
import { DEFAULT_PROGRESS, DEFAULT_SETTINGS, hydrate, recordVerses } from '../src/state/model';
import { CHAPTERS, TOTAL_VERSES } from '../src/data/chapters';
import { placeLabel } from '../src/data/cities';
import { methodForTimeZone, hanafiDefaultForTimeZone } from '../src/lib/prayer';
import bundled from '../src/data/bundled-content.json';

const D = (s: string) => s;

describe('chapters', () => {
  it('has 114 surahs and 6236 verses', () => {
    expect(CHAPTERS).toHaveLength(114);
    expect(CHAPTERS.reduce((n, c) => n + c.verses, 0)).toBe(TOTAL_VERSES);
  });
});

describe('streak', () => {
  const base = { pausedDays: [] as string[], freezesPerMonth: 2 };
  it('counts consecutive met days ending today', () => {
    const r = computeStreak({ ...base, metDays: [D('2026-10-20'), D('2026-10-21'), D('2026-10-22')], today: '2026-10-22' });
    expect(r.current).toBe(3);
  });
  it('does not break when today is not met yet', () => {
    const r = computeStreak({ ...base, metDays: ['2026-10-20', '2026-10-21'], today: '2026-10-22' });
    expect(r.current).toBe(2);
  });
  it('covers a single missed day with a freeze', () => {
    const r = computeStreak({ ...base, metDays: ['2026-10-18', '2026-10-19', '2026-10-21', '2026-10-22'], today: '2026-10-22' });
    expect(r.current).toBe(4);
    expect(r.frozenDays).toEqual(['2026-10-20']);
    expect(r.freezesLeftThisMonth).toBe(1);
  });
  it('breaks on a gap longer than the freezes left, without wasting freezes', () => {
    const r = computeStreak({ ...base, metDays: ['2026-10-15', '2026-10-22'], today: '2026-10-22' });
    expect(r.current).toBe(1);
    expect(r.frozenDays).toEqual([]);
    expect(r.freezesLeftThisMonth).toBe(2);
  });
  it('skips paused days', () => {
    const r = computeStreak({ ...base, freezesPerMonth: 0, metDays: ['2026-10-18', '2026-10-22'], pausedDays: ['2026-10-19', '2026-10-20', '2026-10-21'], today: '2026-10-22' });
    expect(r.current).toBe(2);
  });
  it('is zero with no reading', () => {
    expect(computeStreak({ ...base, metDays: [], today: '2026-10-22' }).current).toBe(0);
  });
});

describe('hijri', () => {
  it('matches known dates', () => {
    expect(toHijri(new Date(2025, 2, 1))).toEqual({ year: 1446, month: 9, day: 1 });
    expect(toHijri(new Date(2026, 1, 18))).toEqual({ year: 1447, month: 9, day: 1 });
  });
  it('applies the user adjustment', () => {
    expect(toHijri(new Date(2026, 1, 18), 1).day).toBe(2);
  });
});

describe('dates', () => {
  it('formats keys and times', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(dayKey(addDays(new Date(2026, 0, 31), 1))).toBe('2026-02-01');
    expect(formatTime(new Date(2026, 0, 1, 0, 5))).toBe('12:05 am');
    expect(formatTime(new Date(2026, 0, 1, 16, 27))).toBe('4:27 pm');
    expect(formatTime(new Date(2026, 0, 1, 16, 27), true)).toBe('16:27');
  });
});

describe('quran text', () => {
  it('removes footnotes and tags from translations only', () => {
    expect(cleanTranslation('Praise be to Allah<sup foot_note=1>1</sup>, Lord &amp; <i>Sustainer</i>')).toBe('Praise be to Allah, Lord & Sustainer');
  });
  it('validates completeness and order', () => {
    const raw = Array.from({ length: 7 }, (_, i) => ({
      verse_key: `1:${i + 1}`,
      verse_number: i + 1,
      page_number: 1,
      juz_number: 1,
      text_uthmani: 'ٱلْحَمْدُ',
      translations: [{ resource_id: 20, text: 'x', resource_name: 'Saheeh International', language_name: 'english' }],
    }));
    const { verses, translations } = mapApiVerses(raw);
    expect(translations[0].name).toBe('Saheeh International');
    expect(validateSurah({ surah: 1, verses, translations, fetchedAt: 0 }, 7)).toBeNull();
    expect(validateSurah({ surah: 1, verses: verses.slice(0, 5), translations, fetchedAt: 0 }, 7)).toMatch(/expected 7/);
    const swapped = [...verses];
    [swapped[1], swapped[2]] = [swapped[2], swapped[1]];
    expect(validateSurah({ surah: 1, verses: swapped, translations, fetchedAt: 0 }, 7)).toMatch(/order/);
  });
});

describe('progress model', () => {
  it('meets a one-page goal and records khatam progress', () => {
    const p = recordVerses(DEFAULT_PROGRESS, '2026-10-22', [{ key: '2:1', page: 2 }, { key: '2:2', page: 2 }], 'page');
    expect(p.metDays).toContain('2026-10-22');
    expect(p.khatam).toHaveLength(2);
    expect(DEFAULT_PROGRESS.metDays).toHaveLength(0); // never mutates
  });
  it('does not meet a two-page goal with one page', () => {
    const p = recordVerses(DEFAULT_PROGRESS, '2026-10-22', [{ key: '2:1', page: 2 }], 'two');
    expect(p.metDays).toHaveLength(0);
  });
  it('hydrates old or corrupt saved data safely', () => {
    expect(hydrate(DEFAULT_SETTINGS, null)).toEqual(DEFAULT_SETTINGS);
    const h = hydrate(DEFAULT_SETTINGS, { goal: 'juz', hanafi: 'yes', unknown: 1 });
    expect(h.goal).toBe('juz');
    expect(h.hanafi).toBe(false);
    expect((h as Record<string, unknown>).unknown).toBeUndefined();
  });
});

describe('location helpers', () => {
  it('names nearby cities offline', () => {
    expect(placeLabel(31.52, 74.36)).toBe('Lahore');
    expect(placeLabel(0, 0)).toBe('Your location');
  });
  it('picks methods from the time zone', () => {
    expect(methodForTimeZone('Asia/Karachi')).toBe('Karachi');
    expect(methodForTimeZone('America/Chicago')).toBe('NorthAmerica');
    expect(methodForTimeZone('Europe/London')).toBe('MoonsightingCommittee');
    expect(methodForTimeZone(undefined)).toBe('MuslimWorldLeague');
    expect(hanafiDefaultForTimeZone('Asia/Karachi')).toBe(true);
    expect(hanafiDefaultForTimeZone('Europe/London')).toBe(false);
  });
});

describe('notification plan', () => {
  const fake = (d: Date) => {
    const at = (h: number, m = 0) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);
    return { fajr: at(5), sunrise: at(6, 30), dhuhr: at(12, 30), asr: at(16), maghrib: at(18), isha: at(19, 30) };
  };
  it('plans prayer lines naming the next prayer, and only future ones', () => {
    const now = new Date(2026, 9, 22, 13, 0); // Thursday
    const plan = planNotifications({ now, days: 1, timesForDate: fake, prayerLine: true, reminders: [], enabledReminders: {}, hijriAdjust: 0 });
    expect(plan.map((n) => n.title)).toEqual(['Maghrib 6:00 pm', 'Isha 7:30 pm', 'Fajr 5:00 am']);
    expect(plan.every((n) => n.at > now)).toBe(true);
  });
  it('schedules Friday Al-Kahf only on Fridays and only when enabled', () => {
    const kahf = { key: 'kahf', title: 'Surah Al-Kahf', rule: 'weekly' as const, weekdays: [5], anchor: 'sunrise' as const, offset_min: 60, surah: 18 };
    const now = new Date(2026, 9, 22, 8, 0);
    const on = planNotifications({ now, days: 7, timesForDate: fake, prayerLine: false, reminders: [kahf], enabledReminders: { kahf: true }, hijriAdjust: 0 });
    expect(on).toHaveLength(1);
    expect(on[0].at.getDay()).toBe(5);
    expect(on[0].data.route).toBe('/surah/18');
    const off = planNotifications({ now, days: 7, timesForDate: fake, prayerLine: false, reminders: [kahf], enabledReminders: {}, hijriAdjust: 0 });
    expect(off).toHaveLength(0);
  });
});

describe('bundled content', () => {
  const c = bundled as any;
  it('has every item pointing at a real set, with Quran ranges inside the surah', () => {
    const keys = new Set(c.adhkar_sets.map((s: any) => s.key));
    for (const it of c.adhkar_items) {
      expect(keys.has(it.set_key)).toBe(true);
      if (it.type === 'quran') {
        const ch = CHAPTERS[it.surah - 1];
        expect(ch).toBeDefined();
        expect(it.verse_from).toBeGreaterThanOrEqual(1);
        expect(it.verse_to).toBeLessThanOrEqual(ch.verses);
        expect(it.arabic).toBeNull(); // Quran text never comes from the spreadsheet
      } else {
        expect(typeof it.arabic).toBe('string');
      }
    }
  });
  it('ships no unverified hadith', () => {
    expect(c.daily_items).toHaveLength(0);
  });
});
