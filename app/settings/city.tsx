import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Header, Screen, T } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import { useTheme, fonts } from '../../src/theme';
import { useApp } from '../../src/state/AppState';
import { CITIES } from '../../src/data/cities';
import { hanafiDefaultForTimeZone, methodForTimeZone } from '../../src/lib/prayer';
import { track } from '../../src/lib/analytics';

export default function CityPicker() {
  const t = useTheme();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { updateSettings } = useApp();
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? CITIES.filter((c) => c.name.toLowerCase().includes(s) || c.country.toLowerCase().includes(s)) : CITIES;
  }, [q]);

  return (
    <Screen scroll={false}>
      <Header title="Choose your city" subtitle="Prayer times are calculated on your phone" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingHorizontal: 14, borderRadius: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}>
        <Icon name="search" size={18} color={t.textMuted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search city or country"
          placeholderTextColor={t.textFaint}
          accessibilityLabel="Search city or country"
          autoCorrect={false}
          maxLength={40}
          style={{ flex: 1, fontFamily: fonts.regular, fontSize: 15, color: t.text }}
        />
      </View>
      <FlatList
        data={list}
        keyExtractor={(c) => `${c.name}-${c.country}`}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={<T muted style={{ paddingVertical: 24, textAlign: 'center' }}>No match. Try allowing location instead.</T>}
        renderItem={({ item: c }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              updateSettings({
                location: { lat: c.lat, lng: c.lng, label: c.name, source: 'city', tz: c.tz },
                method: methodForTimeZone(c.tz),
                hanafi: hanafiDefaultForTimeZone(c.tz),
              });
              track('onboarding_location', { source: 'city' });
              if (next === 'onboarding') router.replace('/onboarding/madhab');
              else router.back();
            }}
            style={({ pressed }) => ({ minHeight: 56, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: t.divider, opacity: pressed ? 0.6 : 1 })}
          >
            <T size={15} weight="semibold">{c.name}</T>
            <T size={12} muted>{c.country}</T>
          </Pressable>
        )}
      />
    </Screen>
  );
}
