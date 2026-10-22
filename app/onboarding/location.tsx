import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { OnboardingFrame } from '../../src/components/Onboarding';
import { Button, Card, T } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import { useTheme } from '../../src/theme';
import { useApp } from '../../src/state/AppState';
import { locate } from '../../src/lib/location';
import { hanafiDefaultForTimeZone, methodForTimeZone } from '../../src/lib/prayer';
import { track } from '../../src/lib/analytics';

export default function LocationStep() {
  const t = useTheme();
  const { updateSettings } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const allow = async () => {
    setBusy(true);
    setError('');
    const res = await locate();
    setBusy(false);
    if (!res.ok) {
      setError(
        res.reason === 'denied'
          ? 'Location is off for Khalad. You can choose your city instead.'
          : 'Couldn’t get your location. Check that location is on, or choose your city.',
      );
      return;
    }
    const tz = res.location.tz;
    updateSettings({ location: res.location, method: methodForTimeZone(tz), hanafi: hanafiDefaultForTimeZone(tz) });
    track('onboarding_location', { source: 'gps' });
    router.push('/onboarding/madhab');
  };

  const points = [
    { icon: 'pin' as const, text: 'Calculated on this phone, works offline' },
    { icon: 'lock' as const, text: 'Never sent to our servers' },
    { icon: 'settings' as const, text: 'Match your mosque later in settings' },
  ];

  return (
    <OnboardingFrame
      step={1}
      title="Prayer times for where you are"
      subtitle="Your location is only used on this phone to calculate prayer times and the Qibla. It is never stored on a server or shared."
      footer={
        <>
          <Button label="Allow location" variant="accent" onPress={allow} loading={busy} />
          <Button label="Choose my city instead" variant="ghost" onPress={() => router.push({ pathname: '/settings/city', params: { next: 'onboarding' } })} />
        </>
      }
    >
      <Card style={{ backgroundColor: t.accentSoft, borderWidth: 0, gap: 14 }}>
        {points.map((p) => (
          <View key={p.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name={p.icon} color={t.accent} />
            <T size={14} weight="medium" style={{ flex: 1 }}>{p.text}</T>
          </View>
        ))}
      </Card>
      {error ? <T size={13} color={t.danger}>{error}</T> : null}
    </OnboardingFrame>
  );
}
