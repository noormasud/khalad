import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Arabic, Button, Header, Loading, T } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import { useTheme } from '../../src/theme';
import { useApp } from '../../src/state/AppState';
import { useContent } from '../../src/state/ContentState';
import { type AdhkarItem, itemsFor } from '../../src/lib/content';
import { getVerses } from '../../src/lib/quran';
import { chapter } from '../../src/data/chapters';
import type { Verse } from '../../src/lib/quranText';

type Loaded = { verses?: Verse[]; error?: string };

export default function AdhkarReader() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const { key } = useLocalSearchParams<{ key: string }>();
  const { content } = useContent();
  const { settings, markAdhkarDone } = useApp();
  const set = content.adhkar_sets.find((s) => s.key === key);
  const items = useMemo(() => (set ? itemsFor(content, set.key) : []), [content, set]);
  const trId = settings.translationIds[settings.translationLang];

  const [index, setIndex] = useState(0);
  const [counts, setCounts] = useState<number[]>(() => items.map(() => 0));
  const [finished, setFinished] = useState(false);
  const [quran, setQuran] = useState<Record<number, Loaded>>({});
  const listRef = useRef<FlatList<AdhkarItem>>(null);

  useEffect(() => setCounts(items.map(() => 0)), [items]);

  // Load Quran verses for Quran items (from the validated Quran.com copy).
  useEffect(() => {
    let alive = true;
    items.forEach((it, i) => {
      if (it.type !== 'quran' || !it.surah || !it.verse_from || !it.verse_to) return;
      getVerses(it.surah, it.verse_from, it.verse_to, trId ? [trId] : [])
        .then((verses) => alive && setQuran((q) => ({ ...q, [i]: { verses } })))
        .catch(() => alive && setQuran((q) => ({ ...q, [i]: { error: 'Couldn’t load these verses. Check your connection.' } })));
    });
    return () => {
      alive = false;
    };
  }, [items, trId]);

  if (!set) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, padding: 20 }}>
        <Header title="Not available" subtitle="This set may have been removed." />
      </SafeAreaView>
    );
  }

  const goTo = (i: number) => {
    if (i < 0) return;
    if (i >= items.length) {
      setFinished(true);
      markAdhkarDone(set.key);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      return;
    }
    setIndex(i);
    listRef.current?.scrollToIndex({ index: i, animated: true });
  };

  const tap = () => {
    const it = items[index];
    if (!it) return;
    const c = (counts[index] ?? 0) + 1;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    if (c >= it.repeat) {
      setCounts((cs) => cs.map((x, i) => (i === index ? it.repeat : x)));
      setTimeout(() => goTo(index + 1), 180);
    } else {
      setCounts((cs) => cs.map((x, i) => (i === index ? c : x)));
    }
  };

  if (finished) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 }}>
        <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={38} strokeWidth={2.5} color={t.onAccent} />
        </View>
        <T size={22} weight="bold">JazakAllahu khayran</T>
        <T size={14} muted style={{ textAlign: 'center' }}>{`${set.title} done for today.`}</T>
        <Button label="Back" onPress={() => router.back()} style={{ alignSelf: 'stretch', marginTop: 12 }} />
      </SafeAreaView>
    );
  }

  const current = items[index];

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingHorizontal: 20, gap: 10, paddingBottom: 8 }}>
        <Header title={set.title} subtitle={items.length ? `${index + 1} of ${items.length}` : undefined} />
        <View style={{ flexDirection: 'row', gap: 3 }} accessibilityElementsHidden>
          {items.map((_, i) => (
            <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < index ? t.accent : i === index ? t.text : t.border }} />
          ))}
        </View>
      </View>

      {items.length === 0 ? (
        <Loading label="Nothing here yet" />
      ) : (
        <FlatList
          ref={listRef}
          data={items}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item, index: i }) => (
            <View style={{ width, padding: 20 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${item.title}. Tap to count`}
                onPress={tap}
                style={{ flex: 1, borderRadius: 20, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}
              >
                <ScrollView contentContainerStyle={{ padding: 20, gap: 14, flexGrow: 1, justifyContent: 'center' }}>
                  <T size={13} weight="bold" color={t.accent} style={{ textAlign: 'center' }}>{item.title}</T>
                  {item.type === 'dua' ? (
                    <>
                      {item.arabic ? <Arabic center>{item.arabic}</Arabic> : null}
                      {item.transliteration ? <T size={14} style={{ textAlign: 'center' }}>{item.transliteration}</T> : null}
                      {item.translation ? <T size={14} muted style={{ textAlign: 'center' }}>{item.translation}</T> : null}
                      {item.reference ? <T size={12} faint style={{ textAlign: 'center' }}>{item.reference}</T> : null}
                    </>
                  ) : (
                    <QuranBlock item={item} loaded={quran[i]} trId={trId} />
                  )}
                </ScrollView>
              </Pressable>
            </View>
          )}
        />
      )}

      {current ? (
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 8 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous" onPress={() => goTo(index - 1)} style={{ width: 52, height: 52, borderRadius: 14, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="chevron-left" color={t.text} />
          </Pressable>
          <Pressable accessibilityRole="button" onPress={tap} style={{ flex: 1, height: 52, borderRadius: 14, backgroundColor: t.inverseBg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }}>
            <T size={16} weight="bold" color={t.inverseText}>{`${counts[index] ?? 0} / ${current.repeat}`}</T>
            <T size={13} color={t.inverseMuted}>tap to count</T>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Next" onPress={() => goTo(index + 1)} style={{ width: 52, height: 52, borderRadius: 14, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="chevron-right" color={t.text} />
          </Pressable>
        </View>
      ) : null}
      <T size={11} faint style={{ textAlign: 'center', paddingBottom: 6 }}>Tap the card to count · swipe for next</T>
    </SafeAreaView>
  );
}

function QuranBlock({ item, loaded, trId }: { item: AdhkarItem; loaded?: Loaded; trId: number }) {
  const ch = item.surah ? chapter(item.surah) : undefined;
  const ref = ch ? `${ch.name} ${item.surah}:${item.verse_from}${item.verse_to !== item.verse_from ? `–${item.verse_to}` : ''}` : '';
  if (!loaded) return <Loading />;
  if (loaded.error) return <T muted style={{ textAlign: 'center' }}>{loaded.error}</T>;
  return (
    <>
      {loaded.verses?.map((v) => (
        <View key={v.key} style={{ gap: 6 }}>
          <Arabic center>{v.arabic}</Arabic>
          {v.translations[String(trId)] ? <T size={13} muted style={{ textAlign: 'center' }}>{v.translations[String(trId)]}</T> : null}
        </View>
      ))}
      <T size={12} faint style={{ textAlign: 'center' }}>{ref}</T>
    </>
  );
}
