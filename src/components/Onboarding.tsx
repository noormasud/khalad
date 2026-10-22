import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { T } from './ui';

export const STEPS = 4;

export function OnboardingFrame({
  step,
  title,
  subtitle,
  children,
  footer,
}: {
  step?: number;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  footer: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: t.surface }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, gap: 22 }}>
        {step ? (
          <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={`Step ${step} of ${STEPS}`}>
            {Array.from({ length: STEPS }).map((_, i) => (
              <View key={i} style={{ height: 4, flex: 1, borderRadius: 2, backgroundColor: i < step ? t.accent : t.border }} />
            ))}
          </View>
        ) : null}
        <View style={{ gap: 8 }}>
          <T size={27} weight="bold" style={{ lineHeight: 34 }} accessibilityRole="header">{title}</T>
          {subtitle ? <T size={15} muted>{subtitle}</T> : null}
        </View>
        {children}
        <View style={{ flex: 1 }} />
        <View style={{ gap: 8 }}>{footer}</View>
      </ScrollView>
    </SafeAreaView>
  );
}
