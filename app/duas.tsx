import React, { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Card, Header, Row, Screen, T } from '../src/components/ui';
import { Icon } from '../src/components/Icon';
import { fonts, useTheme } from '../src/theme';
import { useContent } from '../src/state/ContentState';

export default function Duas() {
  const t = useTheme();
  const { content } = useContent();
  const [q, setQ] = useState('');
  const sets = useMemo(() => {
    const s = q.trim().toLowerCase();
    return content.adhkar_sets
      .filter((x) => x.category === 'duas' || x.category === 'after_salah' || x.category === 'daily')
      .filter((x) => !s || x.title.toLowerCase().includes(s) || (x.subtitle ?? '').toLowerCase().includes(s))
      .sort((a, b) => a.sort - b.sort);
  }, [content.adhkar_sets, q]);

  const groups: { title: string; cat: string }[] = [
    { title: 'Everyday duas', cat: 'duas' },
    { title: 'Daily adhkar', cat: 'daily' },
    { title: 'After salah', cat: 'after_salah' },
  ];

  return (
    <Screen>
      <Header title="Duas" subtitle="For the moments of your day" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingHorizontal: 14, borderRadius: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}>
        <Icon name="search" size={18} color={t.textMuted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search duas"
          placeholderTextColor={t.textFaint}
          accessibilityLabel="Search duas"
          maxLength={40}
          style={{ flex: 1, fontFamily: fonts.regular, fontSize: 15, color: t.text }}
        />
      </View>
      {groups.map((g) => {
        const list = sets.filter((s) => s.category === g.cat);
        if (!list.length) return null;
        return (
          <View key={g.cat} style={{ gap: 8 }}>
            <T size={13} weight="bold" muted>{g.title}</T>
            <Card style={{ paddingVertical: 0 }}>
              {list.map((s, i) => (
                <Row key={s.key} label={s.title} value={s.subtitle ?? undefined} onPress={() => router.push(`/adhkar/${s.key}`)} last={i === list.length - 1} />
              ))}
            </Card>
          </View>
        );
      })}
      {sets.length === 0 ? <T muted style={{ textAlign: 'center', paddingVertical: 24 }}>No duas match your search.</T> : null}
    </Screen>
  );
}
