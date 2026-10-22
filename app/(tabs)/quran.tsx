import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, ProgressBar, T } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import { fonts, useTheme } from '../../src/theme';
import { useApp } from '../../src/state/AppState';
import { CHAPTERS, chapter } from '../../src/data/chapters';

export default function QuranTab() {
  const t = useTheme();
  const { progress } = useApp();
  const [q, setQ] = useState('');
  const last = progress.lastRead;
  const lastCh = last ? chapter(last.surah) : undefined;
  const khatamPct = progress.khatam.length / 6236;

  const list = useMemo(() => {
    const s = q.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');
    if (!s) return CHAPTERS;
    return CHAPTERS.filter((c) => String(c.id) === s || c.name.toLowerCase().replace(/[^a-z0-9 ]/g, '').includes(s));
  }, [q]);

  const header = (
    <View style={{ gap: 14, paddingBottom: 10 }}>
      <T size={26} weight="bold" accessibilityRole="header">Quran</T>
      {last && lastCh ? (
        <Pressable accessibilityRole="button" onPress={() => router.push(`/surah/${last.surah}?verse=${last.verse}`)}>
          <Card inverse style={{ gap: 10 }}>
            <T size={12} color={t.inverseMuted}>Continue where you left off</T>
            <T size={17} weight="bold" color={t.inverseText}>{`${lastCh.name} · ayah ${last.verse}`}</T>
          </Card>
        </Pressable>
      ) : null}
      <Card style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <T size={13} weight="semibold">Khatam progress</T>
          <T size={13} muted>{`${Math.floor(khatamPct * 100)}%${progress.khatamsDone ? ` · ${progress.khatamsDone} completed` : ''}`}</T>
        </View>
        <ProgressBar value={khatamPct} color={t.accent} track={t.divider} />
      </Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingHorizontal: 14, borderRadius: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}>
        <Icon name="search" size={18} color={t.textMuted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search surah name or number"
          placeholderTextColor={t.textFaint}
          accessibilityLabel="Search surah"
          autoCorrect={false}
          maxLength={30}
          style={{ flex: 1, fontFamily: fonts.regular, fontSize: 15, color: t.text }}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList
        data={list}
        keyExtractor={(c) => String(c.id)}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingTop: 12 }}
        initialNumToRender={20}
        renderItem={({ item: c }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${c.id}. ${c.name}, ${c.verses} ayahs`}
            onPress={() => router.push(`/surah/${c.id}`)}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 60, borderBottomWidth: 1, borderBottomColor: t.divider, opacity: pressed ? 0.6 : 1 })}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
              <T size={12} weight="bold">{c.id}</T>
            </View>
            <View style={{ flex: 1 }}>
              <T size={15} weight="semibold">{c.name}</T>
              <T size={12} muted>{`${c.verses} ayahs`}</T>
            </View>
            <T size={20} style={{ fontFamily: 'NotoNaskhArabic_400Regular', writingDirection: 'rtl' }}>{c.arabic}</T>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
