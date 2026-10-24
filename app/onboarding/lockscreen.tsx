import React, { useEffect, useMemo, useState } from 'react';
import { AppState, Platform, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { OnboardingFrame } from '../../src/components/Onboarding';
import { Button, T } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import { useTheme } from '../../src/theme';
import { useApp } from '../../src/state/AppState';
import { useContent } from '../../src/state/ContentState';
import { requestPermission } from '../../src/lib/notifications';
import { nextPrayer, PRAYER_LABELS } from '../../src/lib/prayer';
import { formatTime } from '../../src/lib/dates';
import { setAnalytics, track } from '../../src/lib/analytics';
import { pinWidget } from '../../src/widgets/refresh';

/**
 * Waits while the phone's "Add widget" prompt is on screen. The prompt covers the app, so we
 * resume when the app is active again; if it never left (no prompt shown), carry on quickly.
 */
function waitForPrompt(): Promise<void> {
  return new Promise((resolve) => {
    let left = false;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      sub.remove();
      clearTimeout(quick);
      clearTimeout(cap);
      resolve();
    };
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') left = true;
      else if (left) setTimeout(finish, 400);
    });
    const quick = setTimeout(() => !left && AppState.currentState === 'active' && finish(), 2500);
    const cap = setTimeout(finish, 60000);
  });
}

export default function LockScreenStep() {
  const t = useTheme();
  const { settings, updateSettings } = useApp();
  const { content } = useContent();
  const [stats, setStats] = useState(settings.analytics);
  const [busy, setBusy] = useState(false);
  const [note] = useState('');

  const preview = useMemo(() => {
    const loc = settings.location;
    if (!loc) return 'Asr 4:27 pm';
    try {
      const n = nextPrayer({ latitude: loc.lat, longitude: loc.lng, method: settings.method, hanafi: settings.hanafi, adjustments: {} });
      return `${PRAYER_LABELS[n.name]} ${formatTime(n.time)}`;
    } catch {
      return 'Asr 4:27 pm';
    }
  }, [settings.location, settings.method, settings.hanafi]);

  const defaults = () =>
    Object.fromEntries(content.sunnah_reminders.map((r) => [r.key, !!r.on_by_default]));

  // Navigate only after the saved state says onboarding is done, so the tabs never bounce back here.
  useEffect(() => {
    if (settings.onboarded) router.replace('/');
  }, [settings.onboarded]);

  const finish = (prayerLine: boolean, reminders: Record<string, boolean>) => {
    if (stats) track('onboarding_done', { goal: settings.goal, hanafi: settings.hanafi, method: settings.method, lock_line: prayerLine });
    updateSettings({ prayerLine, reminders, analytics: stats, onboarded: true });
    setAnalytics(stats, settings.anonId);
  };

  const turnOn = async () => {
    setBusy(true);
    // On by default: the only choice is Android's own notification prompt. Declining just leaves the
    // line off (it can be turned on later in More → Notifications); onboarding still continues.
    const granted = await requestPermission();
    // Then offer the two home-screen widgets, one after the other. Android shows its own
    // confirm prompt for each; an app can never place a widget without the person agreeing.
    let placed = 0;
    if (Platform.OS === 'android') {
      for (const name of ['NextPrayer', 'HadithOfDay']) {
        const closed = waitForPrompt(); // start listening before the prompt covers the app
        const asked = await pinWidget(name);
        track('widget_pin_request', { widget: name, from: 'onboarding', shown: asked });
        if (!asked) break; // launcher can't do it; the Today card explains the manual way
        placed += 1;
        await closed;
      }
    }
    setBusy(false);
    if (placed === 2) updateSettings({ widgetPromptDone: true });
    finish(granted, granted ? defaults() : {});
  };

  return (
    <OnboardingFrame
      step={4}
      title="See the next prayer without opening the app"
      subtitle="A quiet line on your lock screen, plus small Next prayer and Hadith of the day widgets on your home screen. No sound, no adhan."
      footer={
        <>
          <Button label="Continue" variant="accent" onPress={turnOn} loading={busy} />
        </>
      }
    >
      <View style={{ height: 200, borderRadius: 24, backgroundColor: '#1F2A24', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <T size={52} weight="semibold" color="#FFFFFF" style={{ lineHeight: 58 }}>3:52</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, width: 270, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.14)' }}>
          <T size={14} weight="bold" color="#FFFFFF">خلد</T>
          <View>
            <T size={14} weight="semibold" color="#FFFFFF">{preview}</T>
            <T size={12} color="#D5DDD8">Next prayer</T>
          </View>
        </View>
      </View>
      <T size={13} muted>
        Works on every Android phone. Al-Kahf on Fridays and Al-Mulk at night are switched on too. Turn any of these off in More → Notifications or Deeds.
      </T>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: stats }}
        onPress={() => setStats((s) => !s)}
        style={{ flexDirection: 'row', gap: 12, padding: 14, borderRadius: 12, backgroundColor: t.accentSoft, alignItems: 'flex-start' }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            marginTop: 1,
            borderWidth: 2,
            borderColor: stats ? t.accent : t.textFaint,
            backgroundColor: stats ? t.accent : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {stats ? <Icon name="check" size={14} strokeWidth={3} color={t.onAccent} /> : null}
        </View>
        <T size={13} style={{ flex: 1 }}>
          Share anonymous usage, like which features get used, so we know what to improve. Never your location, name or sadaqah amounts. You can turn this off any time in More.
        </T>
      </Pressable>
      {note ? <T size={13} color={t.danger}>{note}</T> : null}
    </OnboardingFrame>
  );
}
