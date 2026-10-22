import React, { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Header, Row, Screen, T, ToggleRow } from '../../src/components/ui';
import { useApp } from '../../src/state/AppState';
import { hasPermission, requestPermission } from '../../src/lib/notifications';

export default function NotificationSettings() {
  const { settings, updateSettings } = useApp();
  const [granted, setGranted] = useState<boolean | null>(null);

  useEffect(() => {
    hasPermission().then(setGranted);
  }, []);

  const setLine = async (on: boolean) => {
    if (on) {
      const ok = await requestPermission();
      setGranted(ok);
      if (!ok) return;
    }
    updateSettings({ prayerLine: on });
  };

  return (
    <Screen>
      <Header title="Notifications" subtitle="Quiet by design. No adhan sound." />
      {granted === false ? (
        <Card>
          <T size={14} weight="semibold">Notifications are off for Khalad</T>
          <T size={12} muted>Turn them on in your phone’s settings to see the next prayer on your lock screen.</T>
          <Button label="Open phone settings" variant="soft" onPress={() => Linking.openSettings().catch(() => undefined)} />
        </Card>
      ) : null}
      <Card style={{ paddingVertical: 0 }}>
        <ToggleRow
          label="Next prayer on lock screen"
          sub="A silent line that updates at each prayer time"
          value={settings.prayerLine}
          onChange={setLine}
        />
        <Row label="Sunnah reminders" value="Al-Kahf, Al-Mulk, fasts…" onPress={() => router.push('/deeds')} last />
      </Card>
      <T size={12} muted>
        Some phones (Xiaomi, Oppo, Vivo, Samsung) pause apps to save battery, which can delay notifications. If they arrive late, set Khalad’s battery usage to “Unrestricted” in your phone settings.
      </T>
    </Screen>
  );
}
