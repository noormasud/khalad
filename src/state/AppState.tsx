import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { readJson, writeJson } from '../lib/storage';
import { dayKey } from '../lib/dates';
import { track } from '../lib/analytics';
import {
  addToDay,
  DEFAULT_PROGRESS,
  DEFAULT_SETTINGS,
  hydrate,
  normalizeSadaqah,
  type Progress,
  rollSadaqah,
  recordVerses,
  type Settings,
  toggleInDay,
} from './model';

const SETTINGS_KEY = 'khalad.settings.v1';
const TRACKED_SETTINGS = new Set([
  'theme', 'arabicFont', 'arabicSize', 'showTranslation', 'translationLang', 'adhkarMeaning', 'adhkarTransliteration',
  'keepAwake', 'prayerLine', 'salahChecklist', 'use24h', 'hanafi', 'method', 'goal', 'hijriAdjust',
]);
const PROGRESS_KEY = 'khalad.progress.v1';

type Ctx = {
  ready: boolean;
  settings: Settings;
  progress: Progress;
  today: string;
  updateSettings: (patch: Partial<Settings>) => void;
  updateProgress: (fn: (p: Progress) => Progress) => void;
  markVersesRead: (verses: { key: string; page: number }[]) => void;
  setLastRead: (surah: number, verse: number) => void;
  markAdhkarDone: (setKey: string) => void;
  markSurahDone: (surah: number) => void;
  toggleSalah: (prayer: string) => void;
};

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [progress, setProgress] = useState<Progress>(DEFAULT_PROGRESS);
  const [today, setToday] = useState(dayKey());
  const loaded = useRef(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [s, p] = await Promise.all([
        readJson<unknown>(SETTINGS_KEY, {}),
        readJson<unknown>(PROGRESS_KEY, {}),
      ]);
      if (!alive) return;
      setSettings(hydrate(DEFAULT_SETTINGS, s));
      const hp = hydrate(DEFAULT_PROGRESS, p);
      setProgress({ ...hp, sadaqah: rollSadaqah(normalizeSadaqah(hp.sadaqah), dayKey().slice(0, 7)) });
      loaded.current = true;
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Roll the day over at midnight while the app stays open.
  useEffect(() => {
    const id = setInterval(() => {
      const k = dayKey();
      setToday((prev) => (prev === k ? prev : k));
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // While the streak is paused, each new day counts as paused.
  useEffect(() => {
    if (!ready || !progress.paused || progress.pausedDays.includes(today)) return;
    setProgress((p) => ({ ...p, pausedDays: [...p.pausedDays, today] }));
  }, [ready, progress.paused, progress.pausedDays, today]);

  // Reading goal met today (sent once per day).
  // Only the moment it flips from not-met to met counts, so reopening the app doesn't resend it.
  const metToday = progress.metDays.includes(today);
  const prevMet = useRef<boolean | null>(null);
  useEffect(() => {
    if (!ready) return;
    if (prevMet.current === false && metToday) track('goal_met', { goal: settings.goal });
    prevMet.current = metToday;
  }, [ready, metToday, today, settings.goal]);

  // A new month files last month's sadaqah into history (also while the app stays open).
  useEffect(() => {
    if (!ready) return;
    const month = today.slice(0, 7);
    if (progress.sadaqah.month === month) return;
    setProgress((p) => ({ ...p, sadaqah: rollSadaqah(p.sadaqah, month) }));
  }, [ready, today, progress.sadaqah.month]);

  // Persist after changes (skipped until the first load finishes, so defaults never overwrite saved data).
  useEffect(() => {
    if (loaded.current) writeJson(SETTINGS_KEY, settings);
  }, [settings]);
  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(() => writeJson(PROGRESS_KEY, progress), 400);
    return () => clearTimeout(t);
  }, [progress]);

  // Settings worth learning from. Debounced per key so a pinch or a quick toggle sends one event.
  const settingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...patch }));
    for (const [k, v] of Object.entries(patch)) {
      if (!TRACKED_SETTINGS.has(k) || (typeof v !== 'string' && typeof v !== 'boolean' && typeof v !== 'number')) continue;
      clearTimeout(settingTimers.current[k]);
      settingTimers.current[k] = setTimeout(() => track('setting_change', { key: k, value: v }), 1500);
    }
  }, []);
  const updateProgress = useCallback((fn: (p: Progress) => Progress) => setProgress(fn), []);

  const goal = settings.goal;
  const markVersesRead = useCallback(
    (verses: { key: string; page: number }[]) => setProgress((p) => recordVerses(p, dayKey(), verses, goal)),
    [goal],
  );
  const setLastRead = useCallback(
    (surah: number, verse: number) =>
      setProgress((p) =>
        p.lastRead?.surah === surah && p.lastRead?.verse === verse ? p : { ...p, lastRead: { surah, verse } },
      ),
    [],
  );
  const markAdhkarDone = useCallback(
    (setKey: string) => setProgress((p) => ({ ...p, adhkarDone: addToDay(p.adhkarDone, dayKey(), setKey) })),
    [],
  );
  const markSurahDone = useCallback(
    (surah: number) => setProgress((p) => ({ ...p, surahDone: addToDay(p.surahDone, dayKey(), surah) })),
    [],
  );
  const toggleSalah = useCallback(
    (prayer: string) => setProgress((p) => ({ ...p, salah: toggleInDay(p.salah, dayKey(), prayer) })),
    [],
  );

  const value = useMemo<Ctx>(
    () => ({
      ready,
      settings,
      progress,
      today,
      updateSettings,
      updateProgress,
      markVersesRead,
      setLastRead,
      markAdhkarDone,
      markSurahDone,
      toggleSalah,
    }),
    [ready, settings, progress, today, updateSettings, updateProgress, markVersesRead, setLastRead, markAdhkarDone, markSurahDone, toggleSalah],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
