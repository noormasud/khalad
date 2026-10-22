import { useEffect, useRef } from 'react';
import { AppState as RNAppState } from 'react-native';
import { useApp } from '../state/AppState';
import { useContent } from '../state/ContentState';
import { usePrayerConfig } from './usePrayer';
import { clearPresentedPrayerLines, reschedule } from '../lib/notifications';
import { timesFor } from '../lib/prayer';

/** Keeps scheduled notifications in line with settings, content and location. */
export function useNotificationSync() {
  const { ready, settings } = useApp();
  const { content } = useContent();
  const cfg = usePrayerConfig();
  const last = useRef('');

  useEffect(() => {
    if (!ready || !settings.onboarded || !cfg) return;
    const run = () => {
      reschedule({
        timesForDate: (d) => timesFor(cfg, d),
        prayerLine: settings.prayerLine,
        reminders: content.sunnah_reminders,
        enabledReminders: settings.reminders,
        hijriAdjust: settings.hijriAdjust,
        use24h: settings.use24h,
      });
      clearPresentedPrayerLines();
    };
    const sig = JSON.stringify([cfg, settings.prayerLine, settings.reminders, settings.hijriAdjust, settings.use24h, content.sunnah_reminders]);
    if (sig !== last.current) {
      last.current = sig;
      run();
    }
    const sub = RNAppState.addEventListener('change', (s) => {
      if (s === 'active') run();
    });
    return () => sub.remove();
  }, [ready, settings.onboarded, settings.prayerLine, settings.reminders, settings.hijriAdjust, settings.use24h, content.sunnah_reminders, cfg]);
}
