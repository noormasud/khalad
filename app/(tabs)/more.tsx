import React, { useState } from 'react';
import { Alert, Linking, Platform, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Card, Row, Screen, T, ToggleRow } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import { ReaderSettings } from '../../src/components/ReaderSettings';
import { useTheme } from '../../src/theme';
import { useApp } from '../../src/state/AppState';
import { METHOD_LABELS } from '../../src/lib/prayer';
import { computeStreak } from '../../src/lib/streak';
import { streakDays } from '../../src/state/model';
import { setAnalytics, track } from '../../src/lib/analytics';
import { pinWidget } from '../../src/widgets/refresh';
import { PRIVACY_URL, SUPPORT_EMAIL, TERMS_URL } from '../../src/lib/config';

export default function More() {
  const t = useTheme();
  const { settings, updateSettings, progress, today } = useApp();
  const [reading, setReading] = useState(false);
  const streak = computeStreak({ metDays: streakDays(progress), pausedDays: progress.pausedDays, freezesPerMonth: 2, today });

  const addWidget = async (name: string) => {
    track('widget_pin_request', { widget: name });
    const ok = await pinWidget(name);
    if (!ok) {
      Alert.alert(
        'Add the widget yourself',
        'Touch and hold an empty space on your home screen, tap Widgets, find Khalad, then drag the widget onto your home screen.',
      );
    }
  };

  return (
    <Screen>
      <T size={26} weight="bold" accessibilityRole="header">More</T>

      <Pressable accessibilityRole="button" onPress={() => router.push('/supporter')}>
        <Card style={{ backgroundColor: t.accentSoft, borderWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <T size={15} weight="bold">Keep Khalad ad-free</T>
            <T size={12}>Become a Supporter · sadaqah jariyah</T>
          </View>
          <Icon name="chevron-right" color={t.accentText} />
        </Card>
      </Pressable>

      <Card style={{ paddingVertical: 0 }}>
        <Row icon="pin" label="Prayer times" value={`${settings.location?.label ?? 'Not set'} · ${settings.hanafi ? 'Hanafi' : 'Standard'}`} onPress={() => router.push('/settings/prayer')} />
        <Row icon="compass" label="Qibla" onPress={() => router.push('/qibla')} />
        <Row icon="flame" label="Streak" value={`${streak.current} days`} onPress={() => router.push('/streak')} />
        <Row icon="book" label="Reading" value="Font, size, translation" onPress={() => setReading(true)} last />
      </Card>

      {Platform.OS === 'android' ? (
        <Card style={{ paddingVertical: 0 }}>
          <T size={13} weight="bold" style={{ paddingTop: 12 }}>Home-screen widgets</T>
          <Row icon="moon" label="Next prayer" value="Add" onPress={() => addWidget('NextPrayer')} />
          <Row icon="heart" label="Hadith of the day" value="Add" onPress={() => addWidget('HadithOfDay')} />
          <Row icon="book" label="Today’s reading" value="Add" onPress={() => addWidget('TodayReading')} last />
        </Card>
      ) : null}

      <Card style={{ paddingVertical: 0 }}>
        <Row icon="bell" label="Notifications" value={settings.prayerLine ? 'Lock-screen line on' : 'Off'} onPress={() => router.push('/settings/notifications')} />
        <ToggleRow label="Salah checklist" sub="A private tick list on Today" value={settings.salahChecklist} onChange={(v) => updateSettings({ salahChecklist: v })} />
        <View style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <T size={14} weight="medium" style={{ flex: 1 }}>Appearance</T>
          {(['system', 'light', 'dark'] as const).map((m) => (
            <Pressable
              key={m}
              accessibilityRole="radio"
              accessibilityState={{ checked: settings.theme === m }}
              onPress={() => updateSettings({ theme: m })}
              style={{ minHeight: 36, paddingHorizontal: 10, borderRadius: 10, justifyContent: 'center', backgroundColor: settings.theme === m ? t.inverseBg : 'transparent' }}
            >
              <T size={12} weight="semibold" color={settings.theme === m ? t.inverseText : t.textMuted}>{m[0].toUpperCase() + m.slice(1)}</T>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card style={{ paddingVertical: 0 }}>
        <ToggleRow
          label="Share anonymous usage"
          sub="Shows which features get used. Never your location, name or amounts."
          value={settings.analytics}
          onChange={(v) => {
            updateSettings({ analytics: v });
            setAnalytics(v, settings.anonId);
          }}
        />
        <Row label="Share your thoughts" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Khalad%20feedback`).catch(() => undefined)} />
        <Row label="Privacy policy" onPress={() => Linking.openURL(PRIVACY_URL).catch(() => undefined)} />
        <Row label="Terms of use" onPress={() => Linking.openURL(TERMS_URL).catch(() => undefined)} />
        <Row label="About & sources" onPress={() => router.push('/about')} last />
      </Card>

      <T size={11} faint style={{ textAlign: 'center' }}>{`Khalad ${Constants.expoConfig?.version ?? ''} · ${METHOD_LABELS[settings.method]}`}</T>
      <ReaderSettings visible={reading} onClose={() => setReading(false)} />
    </Screen>
  );
}
