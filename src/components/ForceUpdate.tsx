import React from 'react';
import { Image, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { openStore } from '../lib/updates';
import { LOGO, LOGO_RATIO } from './Splash';
import { Button, T } from './ui';

/** Shown instead of the app when this version is below the minimum set in Supabase. */
export function ForceUpdateScreen({ message }: { message?: string }) {
  const t = useTheme();
  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: t.bg, padding: 28 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <Image source={LOGO} accessibilityLabel="Khalad" style={{ width: 120, height: 120 * LOGO_RATIO, tintColor: t.text, marginBottom: 12 }} resizeMode="contain" />
        <T size={22} weight="bold" style={{ textAlign: 'center' }}>Please update Khalad</T>
        <T size={14} muted style={{ textAlign: 'center', maxWidth: 300, lineHeight: 21 }}>
          {message || 'This version is no longer supported. Update to keep your prayer times, reminders and reading accurate. Your streak and progress stay safe.'}
        </T>
      </View>
      <Button label="Update now" variant="accent" onPress={openStore} />
    </SafeAreaView>
  );
}
