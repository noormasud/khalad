import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../state/AppState';
import { type DayTimes, nextPrayer, type PrayerConfig, type PrayerName, timesFor } from '../lib/prayer';

export function usePrayerConfig(): PrayerConfig | null {
  const { settings } = useApp();
  const loc = settings.location;
  return useMemo(
    () =>
      loc
        ? { latitude: loc.lat, longitude: loc.lng, method: settings.method, hanafi: settings.hanafi, adjustments: settings.adjustments }
        : null,
    [loc, settings.method, settings.hanafi, settings.adjustments],
  );
}

/** Today's times and the next prayer, refreshed every 30 s. Null until a location is set. */
export function usePrayerTimes(): { today: DayTimes; next: { name: PrayerName; time: Date } } | null {
  const cfg = usePrayerConfig();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return useMemo(() => {
    if (!cfg) return null;
    try {
      return { today: timesFor(cfg, now), next: nextPrayer(cfg, now) };
    } catch {
      return null;
    }
  }, [cfg, now]);
}

export function useTimesForDate() {
  const cfg = usePrayerConfig();
  return useCallback((d: Date) => (cfg ? timesFor(cfg, d) : null), [cfg]);
}
