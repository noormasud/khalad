import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { readJson, writeJson } from '../lib/storage';
import { dayKey } from '../lib/dates';
import {
  addToDay,
  DEFAULT_PROGRESS,
  DEFAULT_SETTINGS,
  hydrate,
  type Progress,
  recordVerses,
  type Settings,
  toggleInDay,
} from './model';

const SETTINGS_KEY = 'khalad.settings.v1';
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
      setProgress(hydrate(DEFAULT_PROGRESS, p));
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

  // Persist after changes (skipped until the first load finishes, so defaults never overwrite saved data).
  useEffect(() => {
    if (loaded.current) writeJson(SETTINGS_KEY, settings);
  }, [settings]);
  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(() => writeJson(PROGRESS_KEY, progress), 400);
    return () => clearTimeout(t);
  }, [progress]);

  const updateSettings = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);
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
