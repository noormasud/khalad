import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { OnboardingFrame } from '../../src/components/Onboarding';
import { OptionCard } from '../../src/components/OptionCard';
import { Button, Card, T } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import { useTheme } from '../../src/theme';
import { useApp } from '../../src/state/AppState';
import { timesFor } from '../../src/lib/prayer';
import { formatTime } from '../../src/lib/dates';
import { track } from '../../src/lib/analytics';

export default function MadhabStep() {
  const t = useTheme();
  const { settings, updateSettings } = useApp();
  const loc = settings.location;

  const asr = useMemo(() => {
    if (!loc) return null;
    const base = { latitude: loc.lat, longitude: loc.lng, method: settings.method, adjustments: {} };
    try {
      return {
        hanafi: formatTime(timesFor({ ...base, hanafi: true }, new Date()).asr),
        shafi: formatTime(timesFor({ ...base, hanafi: false }, new Date()).asr),
      };
    } catch {
      return null;
    }
  }, [loc, settings.method]);

  return (
    <OnboardingFrame
      step={2}
      title="Do you follow Hanafi?"
      subtitle="This only changes your Asr time. We picked the usual choice for your region, and you can change it any time."
      footer={
        <Button
          label="Continue"
          variant="accent"
          onPress={() => {
            track('onboarding_madhab', { hanafi: settings.hanafi });
            router.push('/onboarding/goal');
          }}
        />
      }
    >
      <View style={{ gap: 12 }} accessibilityRole="radiogroup">
        <OptionCard
          title="Yes, Hanafi"
          sub={`Later Asr${asr ? ` · ${asr.hanafi} today` : ''}`}
          selected={settings.hanafi}
          onPress={() => updateSettings({ hanafi: true })}
        />
        <OptionCard
          title="No, Shafi’i, Maliki or Hanbali"
          sub={`Earlier Asr${asr ? ` · ${asr.shafi} today` : ''}`}
          selected={!settings.hanafi}
          onPress={() => updateSettings({ hanafi: false })}
        />
      </View>
      {loc ? (
        <Card style={{ backgroundColor: t.accentSoft, borderWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Icon name="pin" size={18} color={t.accent} />
          <T size={13} style={{ flex: 1 }}>Using {loc.label}</T>
        </Card>
      ) : null}
    </OnboardingFrame>
  );
}
