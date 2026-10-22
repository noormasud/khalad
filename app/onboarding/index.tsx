import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Arabic, Button, T } from '../../src/components/ui';
import { useTheme } from '../../src/theme';

export default function Welcome() {
  const t = useTheme();
  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: t.surface, padding: 28 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Arabic center scale={2.4}>خلد</Arabic>
        <T size={38} weight="extrabold" style={{ letterSpacing: -1, lineHeight: 44 }}>
          Khalad<T size={38} weight="extrabold" color={t.accent}>.</T>
        </T>
        <T size={15} muted style={{ textAlign: 'center', maxWidth: 290, marginTop: 6 }}>
          From khulud, permanence. Small daily deeds that last.
        </T>
      </View>
      <View style={{ gap: 10 }}>
        <Button label="Bismillah, let’s begin" variant="accent" onPress={() => router.push('/onboarding/location')} />
        <T size={12} muted style={{ textAlign: 'center' }}>No ads. No sign-up. Your data stays on your phone.</T>
      </View>
    </SafeAreaView>
  );
}
