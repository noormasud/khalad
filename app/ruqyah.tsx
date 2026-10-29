import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Header, Screen, T } from '../src/components/ui';
import { Icon } from '../src/components/Icon';
import { Sheet } from '../src/components/Sheet';
import { GradePill, GradesSheet } from '../src/components/Ruqyah';
import { useTheme } from '../src/theme';
import { FOR_OTHERS_NOTE, RUQYAH_KEY, ruqyahFor, type RuqyahFor, type RuqyahItem } from '../src/data/ruqyah';
import { track } from '../src/lib/analytics';

const SECTIONS: { key: RuqyahItem['section']; title: string; sub?: string }[] = [
  { key: 'quran', title: 'From the Quran' },
  { key: 'sunnah', title: 'From the Sunnah' },
  { key: 'other', title: 'Other narrations', sub: 'Weaker chains, disputed grading, or not from the Prophet ﷺ. Shown separately so you can choose.' },
];

export default function Ruqyah() {
  const t = useTheme();
  const [who, setWho] = useState<RuqyahFor>('self');
  const [grades, setGrades] = useState<RuqyahItem | null>(null);
  const [howTo, setHowTo] = useState(false);
  const items = useMemo(() => ruqyahFor(who), [who]);

  useEffect(() => {
    track('ruqyah_open');
  }, []);

  const open = (i: number) => router.push(`/adhkar/${RUQYAH_KEY}?for=${who}&i=${i}`);

  return (
    <Screen>
      <Header title="Ruqyah" subtitle="Healing from the Quran and Sunnah" />

      <View accessibilityRole="tablist" style={{ flexDirection: 'row', padding: 4, borderRadius: 12, backgroundColor: t.divider }}>
        {(['self', 'others'] as const).map((w) => {
          const on = who === w;
          return (
            <Pressable
              key={w}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => setWho(w)}
              style={{ flex: 1, height: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? t.surface : 'transparent' }}
            >
              <T size={13} weight="semibold" color={on ? t.text : t.textMuted}>{w === 'self' ? 'For myself' : 'For someone else'}</T>
            </Pressable>
          );
        })}
      </View>
      {who === 'others' ? <T size={12} muted style={{ lineHeight: 18 }}>{FOR_OTHERS_NOTE}</T> : null}

      {SECTIONS.map((sec) => {
        const list = items.map((it, i) => ({ it, i })).filter((x) => x.it.section === sec.key);
        if (!list.length) return null;
        const other = sec.key === 'other';
        return (
          <View key={sec.key} style={{ gap: 8 }}>
            <View style={{ gap: 2, marginTop: 4 }}>
              <T size={12} weight="bold" muted style={{ letterSpacing: 0.6 }}>{sec.title.toUpperCase()}</T>
              {sec.sub ? <T size={12} faint style={{ lineHeight: 17 }}>{sec.sub}</T> : null}
            </View>
            <View style={{ borderRadius: 16, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderStyle: other ? 'dashed' : 'solid', overflow: 'hidden' }}>
              {list.map(({ it, i }, n) => (
                <Pressable
                  key={it.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${it.title}. ${it.note}${it.repeat > 1 ? `. ${it.repeat} times` : ''}`}
                  onPress={() => open(i)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderTopWidth: n === 0 ? 0 : 1,
                    borderTopColor: t.divider,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <T size={15} weight="semibold">{it.title}</T>
                      {it.grade ? <GradePill grade={it.grade} onPress={() => setGrades(it)} /> : null}
                    </View>
                    <T size={12} muted numberOfLines={2}>{it.type === 'quran' ? `${it.surah}:${it.verse_from}${it.verse_to !== it.verse_from ? `–${it.verse_to}` : ''} · ${it.note}` : `${it.reference ?? ''}${it.note ? ` · ${it.note}` : ''}`}</T>
                  </View>
                  {it.repeat > 1 ? <T size={12} weight="semibold" muted>{`${it.repeat}×`}</T> : null}
                  <Icon name="chevron-right" size={18} color={t.textFaint} />
                </Pressable>
              ))}
            </View>
          </View>
        );
      })}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/surah/2?from=deed')}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, opacity: pressed ? 0.7 : 1 })}
      >
        <Icon name="book" size={20} color={t.accent} />
        <View style={{ flex: 1, gap: 2 }}>
          <T size={14} weight="semibold">Recite Surah Al-Baqarah</T>
          <T size={12} muted>“The magicians cannot confront it.” · Sahih Muslim 804</T>
        </View>
        <Icon name="chevron-right" size={18} color={t.textFaint} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => setHowTo(true)}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, opacity: pressed ? 0.7 : 1 })}
      >
        <Icon name="info" size={20} color={t.accent} />
        <T size={14} weight="semibold" style={{ flex: 1 }}>How to do ruqyah</T>
        <Icon name="chevron-right" size={18} color={t.textFaint} />
      </Pressable>

      <Button label={who === 'others' ? 'Start reading over someone' : 'Start ruqyah'} onPress={() => open(0)} />
      <T size={12} faint style={{ textAlign: 'center' }}>Private. Doesn’t change your Quran reading, goal or streak.</T>

      <GradesSheet item={grades} onClose={() => setGrades(null)} />
      <Sheet visible={howTo} onClose={() => setHowTo(false)} title="How to do ruqyah">
        {HOW_TO.map((h) => (
          <View key={h.text} style={{ flexDirection: 'row', gap: 10 }}>
            <T size={13} color={t.accent}>•</T>
            <View style={{ flex: 1, gap: 2 }}>
              <T size={13} style={{ lineHeight: 19 }}>{h.text}</T>
              {h.ref ? <T size={11} faint>{h.ref}</T> : null}
            </View>
          </View>
        ))}
        <Button label="Got it" onPress={() => setHowTo(false)} />
      </Sheet>
    </Screen>
  );
}

const HOW_TO: { text: string; ref?: string }[] = [
  { text: 'Recite with full trust that only Allah cures. The words are the means; the healing is from Him.' },
  { text: 'Recite Al-Ikhlas, Al-Falaq and An-Nas, then blow lightly over yourself, as the Prophet ﷺ did when he was ill.', ref: 'Sahih al-Bukhari 5016' },
  { text: 'For pain, put your hand where it hurts, say Bismillah 3 times, then the dua of refuge 7 times.', ref: 'Sahih Muslim 2202' },
  { text: 'When reading over someone, you can recite and blow over them, and wipe your right hand over them.', ref: 'Sahih al-Bukhari 5016, 5743' },
  { text: 'Repeat the verses and duas as often as you like. There is no fixed number except where one is mentioned.' },
];
