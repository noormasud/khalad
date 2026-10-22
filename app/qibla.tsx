import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Card, ErrorState, Header, Loading, Screen, T } from '../src/components/ui';
import { Icon } from '../src/components/Icon';
import { useTheme } from '../src/theme';
import { useApp } from '../src/state/AppState';
import { qiblaBearing } from '../src/lib/prayer';

const DIAL = 280;

export default function Qibla() {
  const t = useTheme();
  const { settings } = useApp();
  const loc = settings.location;
  const [heading, setHeading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const aligned = useRef(false);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let alive = true;
    (async () => {
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (!perm.granted) {
          const req = await Location.requestForegroundPermissionsAsync();
          if (!req.granted) {
            if (alive) setError('The compass needs location permission to know which way is north.');
            return;
          }
        }
        sub = await Location.watchHeadingAsync((h) => {
          const v = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
          if (Number.isFinite(v)) setHeading(v);
        });
      } catch {
        if (alive) setError('This phone’s compass isn’t available.');
      }
    })();
    return () => {
      alive = false;
      sub?.remove();
    };
  }, []);

  const bearing = loc ? qiblaBearing(loc.lat, loc.lng) : 0;
  const off = heading === null ? 0 : ((bearing - heading + 540) % 360) - 180;
  const facing = !!loc && heading !== null && Math.abs(off) <= 3;
  const farOff = Math.abs(off) > 8;

  useEffect(() => {
    if (facing && !aligned.current) {
      aligned.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } else if (!facing && farOff) {
      aligned.current = false;
    }
  }, [facing, farOff]);

  if (!loc) {
    return (
      <Screen>
        <Header title="Qibla" />
        <ErrorState message="Set your location in Prayer times first." />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <Header title="Qibla" subtitle={`${loc.label} · ${Math.round(bearing)}° from north`} />
      {error ? (
        <ErrorState message={error} />
      ) : heading === null ? (
        <Loading label="Finding north…" />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <View style={{ width: DIAL, height: DIAL }}>
            <View
              style={{
                position: 'absolute',
                width: DIAL,
                height: DIAL,
                borderRadius: DIAL / 2,
                backgroundColor: t.surface,
                borderWidth: 2,
                borderColor: facing ? t.accent : t.border,
                transform: [{ rotate: `${-heading}deg` }],
              }}
            >
              <T size={13} weight="bold" muted style={{ position: 'absolute', top: 10, alignSelf: 'center' }}>N</T>
              <T size={13} faint style={{ position: 'absolute', bottom: 10, alignSelf: 'center' }}>S</T>
              <T size={13} faint style={{ position: 'absolute', left: 14, top: DIAL / 2 - 10 }}>W</T>
              <T size={13} faint style={{ position: 'absolute', right: 14, top: DIAL / 2 - 10 }}>E</T>
              <View style={{ position: 'absolute', left: DIAL / 2, top: DIAL / 2, transform: [{ rotate: `${bearing}deg` }] }}>
                <View style={{ position: 'absolute', left: -16, top: -DIAL / 2 + 8, width: 32, height: 32, borderRadius: 6, backgroundColor: '#141414', alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 18, height: 3, backgroundColor: '#D4A017' }} />
                </View>
              </View>
            </View>
            <View style={{ position: 'absolute', left: DIAL / 2 - 2, top: 18, width: 4, height: DIAL / 2 - 18, borderRadius: 2, backgroundColor: facing ? t.accent : t.text }} />
            <View style={{ position: 'absolute', left: DIAL / 2 - 8, top: DIAL / 2 - 8, width: 16, height: 16, borderRadius: 8, backgroundColor: facing ? t.accent : t.text }} />
          </View>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <T size={20} weight="bold" color={facing ? t.accent : t.text} accessibilityLiveRegion="polite">
              {facing ? 'You’re facing the Qibla' : `Turn ${off > 0 ? 'right' : 'left'} ${Math.round(Math.abs(off))}°`}
            </T>
            <T size={13} muted>{facing ? 'A gentle vibration confirms it' : 'Keep the needle on the Kaaba'}</T>
          </View>
        </View>
      )}
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icon name="info" size={18} color={t.textMuted} />
        <T size={12} style={{ flex: 1 }}>Hold your phone flat, away from metal and magnets. Move it in a figure 8 if it seems off.</T>
      </Card>
    </Screen>
  );
}
