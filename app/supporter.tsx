import React from 'react';
import { Linking, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Screen, T } from '../src/components/ui';
import { Icon } from '../src/components/Icon';
import { useTheme } from '../src/theme';
import { SUPPORT_EMAIL } from '../src/lib/config';
import { track } from '../src/lib/analytics';

// Payments open in a later update, once Google Play subscription products are set up.
// Until then this screen is honest about it and collects interest by email only.

const PERKS = ['Mushaf themes and fonts', 'Widget styles and app icons', 'Cloud backup across your phones', 'Sponsor a student’s access'];

export default function Supporter() {
  const t = useTheme();
  return (
    <Screen edges={['top', 'bottom']}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} style={{ width: 44, height: 44, marginLeft: -10, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="close" color={t.text} />
      </Pressable>
      <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#FEF3C7' }}>
        <T size={12} weight="bold" color="#78350F">Founding Supporters · opening soon</T>
      </View>
      <T size={26} weight="bold" style={{ lineHeight: 33 }}>Keep Khalad free and ad-free for everyone</T>
      <T size={14} muted>
        Everything you use today stays free forever. Supporters will get a few extras, and each subscription gives free access to a student.
      </T>
      <Card style={{ backgroundColor: t.accentSoft, borderWidth: 0, gap: 10 }}>
        {PERKS.map((p) => (
          <View key={p} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="check" size={16} strokeWidth={3} color={t.accent} />
            <T size={14}>{p}</T>
          </View>
        ))}
      </Card>
      <T size={13} muted>
        Founding Supporters who join before the end of Ramadan keep their founding price for life, in sha Allah. When it opens, cancelling will be one tap in Google Play, with a reminder before any renewal.
      </T>
      <Button
        label="Tell me when it opens"
        onPress={() => {
          track('supporter_interest');
          Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Founding%20Supporter`).catch(() => undefined);
        }}
      />
      <Button label="Maybe later" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
