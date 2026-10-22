import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { OnboardingFrame } from '../../src/components/Onboarding';
import { OptionCard } from '../../src/components/OptionCard';
import { Button, Card, T } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import { useTheme } from '../../src/theme';
import { useApp } from '../../src/state/AppState';
import { type GoalKind, GOALS } from '../../src/state/model';
import { track } from '../../src/lib/analytics';

const ESTIMATE: Record<GoalKind, string> = {
  ayah: 'A steady daily habit. You can raise it whenever you like.',
  page: 'At one page a day you finish the Quran in about 20 months.',
  two: 'At two pages a day you finish the Quran in about 10 months.',
  juz: 'One juz a day completes a khatam every 30 days.',
};

export default function GoalStep() {
  const t = useTheme();
  const { settings, updateSettings } = useApp();
  const keys = Object.keys(GOALS) as GoalKind[];

  return (
    <OnboardingFrame
      step={3}
      title="How much do you want to read each day?"
      subtitle="No amount is too small. Meeting it keeps your reading streak going."
      footer={
        <Button
          label="Continue"
          variant="accent"
          onPress={() => {
            track('onboarding_goal', { goal: settings.goal });
            router.push('/onboarding/lockscreen');
          }}
        />
      }
    >
      <View style={{ gap: 12 }} accessibilityRole="radiogroup">
        {[keys.slice(0, 2), keys.slice(2)].map((row, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
            {row.map((k) => (
              <OptionCard key={k} compact title={GOALS[k].label} sub={GOALS[k].sub} selected={settings.goal === k} onPress={() => updateSettings({ goal: k })} />
            ))}
          </View>
        ))}
      </View>
      <Card style={{ backgroundColor: t.accentSoft, borderWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icon name="flame" size={18} color={t.streak} />
        <T size={13} style={{ flex: 1 }}>{ESTIMATE[settings.goal]}</T>
      </Card>
    </OnboardingFrame>
  );
}
