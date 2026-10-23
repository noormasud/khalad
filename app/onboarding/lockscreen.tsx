import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
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

export default function LockScreenStep() {
  const t = useTheme();
  const { settings, updateSettings } = useApp();
  const { content } = useContent();
  const [stats, setStats] = useState(settings.analytics);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

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
    const granted = await requestPermission();
    setBusy(false);
    if (!granted) {
      setNote('Notifications are off for Khalad, so the lock-screen line can’t show. You can allow them in your phone’s Settings → Apps → Khalad, or continue with “Maybe later”.');
      return;
    }
    finish(true, defaults());
  };

  return (
    <OnboardingFrame
      step={4}
      title="See the next prayer without opening the app"
      subtitle="A quiet line on your lock screen showing the next prayer. No sound, no adhan."
      footer={
        <>
          <Button label="Turn on" variant="accent" onPress={turnOn} loading={busy} />
          <Button label="Maybe later" variant="ghost" onPress={() => finish(false, {})} />
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
        Works on every Android phone. Al-Kahf on Fridays and Al-Mulk at night are switched on too; change them any time in Deeds.
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
