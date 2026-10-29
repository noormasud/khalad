import React, { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Header, Screen, T } from '../src/components/ui';
import { Icon, type IconName } from '../src/components/Icon';
import { fonts, useTheme } from '../src/theme';
import { useApp } from '../src/state/AppState';
import { useContent } from '../src/state/ContentState';
import type { AdhkarSet } from '../src/lib/content';
import { RUQYAH } from '../src/data/ruqyah';

const GROUPS: { title: string; cat: string }[] = [
  { title: 'Everyday duas', cat: 'duas' },
  { title: 'Daily adhkar', cat: 'daily' },
  { title: 'After salah', cat: 'after_salah' },
];

function iconFor(s: AdhkarSet): IconName {
  const k = `${s.key} ${s.title}`.toLowerCase();
  if (/sleep|night|evening/.test(k)) return 'moon';
  if (/wak|morning/.test(k)) return 'sun';
  if (/house|home/.test(k)) return 'home';
  if (/salah|prayer/.test(k)) return 'check-circle';
  if (/bathroom|toilet|wudu/.test(k)) return 'lock';
  return 'heart';
}

export default function Duas() {
  const t = useTheme();
  const { content } = useContent();
  const { progress, today } = useApp();
  const [q, setQ] = useState('');
  const doneToday = new Set(progress.adhkarDone[today] ?? []);

  const sets = useMemo(() => {
    const s = q.trim().toLowerCase();
    return content.adhkar_sets
      .filter((x) => GROUPS.some((g) => g.cat === x.category))
      .filter((x) => !s || x.title.toLowerCase().includes(s) || (x.subtitle ?? '').toLowerCase().includes(s))
      .sort((a, b) => a.sort - b.sort);
  }, [content.adhkar_sets, q]);

  return (
    <Screen>
      <Header title="Duas" subtitle="For the moments of your day" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingHorizontal: 14, borderRadius: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}>
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
        {q ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQ('')} hitSlop={10}>
            <Icon name="close" size={16} color={t.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {!q.trim() || 'ruqyah healing sick evil eye shifa'.includes(q.trim().toLowerCase()) ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ruqyah. Healing from the Quran and Sunnah. For illness, the evil eye and protection."
          onPress={() => router.push('/ruqyah')}
          style={({ pressed }) => ({ borderRadius: 18, padding: 18, gap: 6, backgroundColor: t.inverseBg, opacity: pressed ? 0.85 : 1 })}
        >
          <T size={11} weight="bold" color={t.progress} style={{ letterSpacing: 0.6 }}>RUQYAH</T>
          <T size={17} weight="bold" color={t.inverseText}>Healing from the Quran and Sunnah</T>
          <T size={12} color={t.inverseMuted} style={{ lineHeight: 18 }}>For illness, the evil eye and protection. For yourself, or to read over someone you love.</T>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <T size={12} color={t.inverseMuted}>{`${RUQYAH.filter((r) => r.section !== 'other').length} duas and verses · graded`}</T>
            <T size={13} weight="bold" color={t.inverseText}>Open ›</T>
          </View>
        </Pressable>
      ) : null}

      {GROUPS.map((g) => {
        const list = sets.filter((s) => s.category === g.cat);
        if (!list.length) return null;
        return (
          <View key={g.cat} style={{ gap: 8 }}>
            <T size={12} weight="bold" muted style={{ letterSpacing: 0.6, marginTop: 4 }}>{g.title.toUpperCase()}</T>
            <View style={{ gap: 8 }}>
              {list.map((s) => {
                const done = doneToday.has(s.key);
                return (
                  <Pressable
                    key={s.key}
                    accessibilityRole="button"
                    accessibilityLabel={`${s.title}${s.subtitle ? `. ${s.subtitle}` : ''}${done ? '. Done today' : ''}`}
                    onPress={() => router.push(`/adhkar/${s.key}`)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                      minHeight: 68,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderRadius: 16,
                      backgroundColor: t.surface,
                      borderWidth: 1,
                      borderColor: t.border,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: done ? t.accent : t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={done ? 'check' : iconFor(s)} size={20} color={done ? t.onAccent : t.accent} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <T size={15} weight="semibold">{s.title}</T>
                      {s.subtitle ? <T size={12} muted numberOfLines={2}>{s.subtitle}</T> : null}
                    </View>
                    <Icon name="chevron-right" size={18} color={t.textFaint} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
      {sets.length === 0 ? <T muted style={{ textAlign: 'center', paddingVertical: 24 }}>No duas match your search.</T> : null}
    </Screen>
  );
}
