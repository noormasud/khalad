import {
  CalculationMethod,
  type CalculationParameters,
  Coordinates,
  HighLatitudeRule,
  Madhab,
  PrayerTimes,
  Qibla,
} from 'adhan';

export type MethodKey =
  | 'Karachi'
  | 'NorthAmerica'
  | 'MoonsightingCommittee'
  | 'MuslimWorldLeague'
  | 'UmmAlQura'
  | 'Dubai'
  | 'Qatar'
  | 'Kuwait'
  | 'Egyptian'
  | 'Turkey'
  | 'Singapore'
  | 'Tehran';

export const METHOD_LABELS: Record<MethodKey, string> = {
  Karachi: 'University of Islamic Sciences, Karachi',
  NorthAmerica: 'ISNA (North America)',
  MoonsightingCommittee: 'Moonsighting Committee',
  MuslimWorldLeague: 'Muslim World League',
  UmmAlQura: 'Umm al-Qura, Makkah',
  Dubai: 'Dubai',
  Qatar: 'Qatar',
  Kuwait: 'Kuwait',
  Egyptian: 'Egyptian General Authority',
  Turkey: 'Diyanet, Turkey',
  Singapore: 'Singapore / Malaysia / Indonesia',
  Tehran: 'Tehran',
};

export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export const PRAYER_LABELS: Record<PrayerName, string> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};
export const SALAH: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export type Adjustments = Partial<Record<PrayerName, number>>;

export type PrayerConfig = {
  latitude: number;
  longitude: number;
  method: MethodKey;
  hanafi: boolean;
  adjustments: Adjustments;
};

export type DayTimes = Record<PrayerName, Date>;

/** Pick a calculation method from the phone's time zone. Works offline, no location lookup. */
export function methodForTimeZone(tz: string | null | undefined): MethodKey {
  const z = tz ?? '';
  if (/^Asia\/(Karachi|Kolkata|Calcutta|Dhaka|Kabul|Kathmandu|Colombo|Thimphu)$/.test(z)) return 'Karachi';
  if (/^America\//.test(z) || /^Canada\//.test(z) || /^US\//.test(z)) return 'NorthAmerica';
  if (/^Europe\/(London|Dublin|Belfast)$/.test(z)) return 'MoonsightingCommittee';
  if (/^Asia\/Riyadh$/.test(z)) return 'UmmAlQura';
  if (/^Asia\/(Dubai|Muscat)$/.test(z)) return 'Dubai';
  if (/^Asia\/(Qatar|Bahrain)$/.test(z)) return 'Qatar';
  if (/^Asia\/Kuwait$/.test(z)) return 'Kuwait';
  if (/^Africa\/Cairo$/.test(z)) return 'Egyptian';
  if (/^(Europe\/Istanbul|Asia\/Istanbul)$/.test(z)) return 'Turkey';
  if (/^Asia\/(Singapore|Kuala_Lumpur|Kuching|Jakarta|Makassar|Jayapura|Pontianak|Brunei)$/.test(z)) return 'Singapore';
  if (/^Asia\/Tehran$/.test(z)) return 'Tehran';
  return 'MuslimWorldLeague';
}

/** Hanafi Asr is the usual default in South Asia and Turkey. */
export function hanafiDefaultForTimeZone(tz: string | null | undefined): boolean {
  const z = tz ?? '';
  return /^Asia\/(Karachi|Kolkata|Calcutta|Dhaka|Kabul|Kathmandu|Colombo|Thimphu)$/.test(z) || /Istanbul$/.test(z);
}

function params(cfg: PrayerConfig, coords: Coordinates): CalculationParameters {
  const p = CalculationMethod[cfg.method]();
  p.madhab = cfg.hanafi ? Madhab.Hanafi : Madhab.Shafi;
  // Keeps Fajr/Isha sensible in places like the UK in summer.
  p.highLatitudeRule = HighLatitudeRule.recommended(coords);
  const a = cfg.adjustments ?? {};
  p.adjustments.fajr += a.fajr ?? 0;
  p.adjustments.sunrise += a.sunrise ?? 0;
  p.adjustments.dhuhr += a.dhuhr ?? 0;
  p.adjustments.asr += a.asr ?? 0;
  p.adjustments.maghrib += a.maghrib ?? 0;
  p.adjustments.isha += a.isha ?? 0;
  return p;
}

export function timesFor(cfg: PrayerConfig, date: Date): DayTimes {
  const coords = new Coordinates(cfg.latitude, cfg.longitude);
  const t = new PrayerTimes(coords, date, params(cfg, coords));
  return { fajr: t.fajr, sunrise: t.sunrise, dhuhr: t.dhuhr, asr: t.asr, maghrib: t.maghrib, isha: t.isha };
}

/** Next of the five daily prayers after `now` (looks into tomorrow after Isha). */
export function nextPrayer(cfg: PrayerConfig, now: Date = new Date()): { name: PrayerName; time: Date } {
  const today = timesFor(cfg, now);
  for (const name of SALAH) {
    if (today[name].getTime() > now.getTime()) return { name, time: today[name] };
  }
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12);
  return { name: 'fajr', time: timesFor(cfg, tomorrow).fajr };
}

export function qiblaBearing(latitude: number, longitude: number): number {
  return Qibla(new Coordinates(latitude, longitude));
}

export function isValidCoordinate(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) &&
    Math.abs(lat) <= 90 && Math.abs(lng) <= 180
  );
}
