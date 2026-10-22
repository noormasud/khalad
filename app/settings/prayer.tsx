import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Chip, Header, Row, Screen, T } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import { useTheme } from '../../src/theme';
import { useApp } from '../../src/state/AppState';
import { locate } from '../../src/lib/location';
import { METHOD_LABELS, type MethodKey, PRAYER_LABELS, type PrayerName, SALAH, timesFor } from '../../src/lib/prayer';
import { formatTime } from '../../src/lib/dates';

export default function PrayerSettings() {
  const t = useTheme();
  const { settings, updateSettings } = useApp();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [methodsOpen, setMethodsOpen] = useState(false);
  const loc = settings.location;

  const times = useMemo(() => {
    if (!loc) return null;
    try {
      return timesFor({ latitude: loc.lat, longitude: loc.lng, method: settings.method, hanafi: settings.hanafi, adjustments: settings.adjustments }, new Date());
    } catch {
      return null;
    }
  }, [loc, settings.method, settings.hanafi, settings.adjustments]);

  const adjust = (p: PrayerName, d: number) => {
    const cur = settings.adjustments[p] ?? 0;
    updateSettings({ adjustments: { ...settings.adjustments, [p]: Math.max(-30, Math.min(30, cur + d)) } });
  };

  const refreshLocation = async () => {
    setBusy(true);
    setMsg('');
    const res = await locate();
    setBusy(false);
    if (res.ok) {
      updateSettings({ location: res.location });
      setMsg(`Updated to ${res.location.label}`);
    } else {
      setMsg(res.reason === 'denied' ? 'Location permission is off for Khalad.' : 'Couldn’t get your location right now.');
    }
  };

  return (
    <Screen>
      <Header title="Prayer times" />
      <Card style={{ paddingVertical: 0 }}>
        <Row icon="pin" label="Location" value={loc ? `${loc.label}${loc.source === 'gps' ? ' · automatic' : ''}` : 'Not set'} onPress={() => router.push('/settings/city')} />
        <Row label="Method" value={METHOD_LABELS[settings.method]} onPress={() => setMethodsOpen((o) => !o)} />
        {methodsOpen ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 10 }}>
            {(Object.keys(METHOD_LABELS) as MethodKey[]).map((m) => (
              <Chip key={m} label={METHOD_LABELS[m]} selected={settings.method === m} onPress={() => updateSettings({ method: m })} />
            ))}
          </View>
        ) : null}
        <View style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <T size={14} style={{ flex: 1 }}>Asr</T>
          <Chip label="Hanafi" selected={settings.hanafi} onPress={() => updateSettings({ hanafi: true })} />
          <Chip label="Standard" selected={!settings.hanafi} onPress={() => updateSettings({ hanafi: false })} />
        </View>
      </Card>
      <Button label="Use my current location" variant="soft" onPress={refreshLocation} loading={busy} />
      {msg ? <T size={13} muted>{msg}</T> : null}

      <Card>
        <T size={14} weight="bold">Match your mosque</T>
        <T size={12} muted>Nudge any prayer by a few minutes.</T>
        {SALAH.map((p) => {
          const a = settings.adjustments[p] ?? 0;
          return (
            <View key={p} style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: t.divider }}>
              <View style={{ flex: 1 }}>
                <T size={14} weight="medium">{PRAYER_LABELS[p]}</T>
                <T size={12} muted>{times ? formatTime(times[p], settings.use24h) : '—'}</T>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={`${PRAYER_LABELS[p]} one minute earlier`} onPress={() => adjust(p, -1)} style={{ width: 44, height: 40, borderRadius: 10, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="minus" size={18} color={t.text} />
              </Pressable>
              <T size={13} weight="bold" style={{ width: 48, textAlign: 'center' }}>{`${a > 0 ? '+' : ''}${a}m`}</T>
              <Pressable accessibilityRole="button" accessibilityLabel={`${PRAYER_LABELS[p]} one minute later`} onPress={() => adjust(p, 1)} style={{ width: 44, height: 40, borderRadius: 10, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="plus" size={18} color={t.text} />
              </Pressable>
            </View>
          );
        })}
        {Object.values(settings.adjustments).some((v) => v) ? (
          <Button label="Reset adjustments" variant="ghost" onPress={() => updateSettings({ adjustments: {} })} />
        ) : null}
      </Card>

      <Card>
        <T size={14} weight="bold">Hijri date</T>
        <T size={12} muted>Calculated dates can differ from local moon sighting by a day.</T>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {[-2, -1, 0, 1, 2].map((d) => (
            <Chip key={d} label={d === 0 ? 'As calculated' : `${d > 0 ? '+' : ''}${d} day`} selected={settings.hijriAdjust === d} onPress={() => updateSettings({ hijriAdjust: d })} />
          ))}
        </View>
      </Card>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <T size={14} style={{ flex: 1 }}>Clock</T>
        <Chip label="12-hour" selected={!settings.use24h} onPress={() => updateSettings({ use24h: false })} />
        <Chip label="24-hour" selected={settings.use24h} onPress={() => updateSettings({ use24h: true })} />
      </View>
    </Screen>
  );
}
