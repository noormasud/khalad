import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Arabic, Button, Header, Loading, T } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import { ReaderSettings } from '../../src/components/ReaderSettings';
import { arabicSizes, useTheme } from '../../src/theme';
import { useApp } from '../../src/state/AppState';
import { useContent } from '../../src/state/ContentState';
import { type AdhkarItem, itemsFor } from '../../src/lib/content';
import { getVerses } from '../../src/lib/quran';
import { chapter } from '../../src/data/chapters';
import type { Verse } from '../../src/lib/quranText';
import { usePinchTextSize } from '../../src/hooks/usePinchTextSize';

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
  const { gesture: pinch, overlay } = usePinchTextSize();

  const [index, setIndex] = useState(0);
  const [counts, setCounts] = useState<number[]>(() => items.map(() => 0));
  const [finished, setFinished] = useState(false);
  const [quran, setQuran] = useState<Record<number, Loaded>>({});
  const [shown, setShown] = useState<Record<number, boolean>>({});
  const [showSettings, setShowSettings] = useState(false);
  const listRef = useRef<FlatList<AdhkarItem>>(null);

  useEffect(() => setCounts(items.map(() => 0)), [items]);

  // Quran items: text from the validated Quran.com copy (with translation, so "Meaning" opens instantly).
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

  const single = items.length === 1;
  const scale = (arabicSizes[settings.arabicSize] ?? 28) / 28;
  const bodySize = Math.round(15 * Math.min(1.5, Math.max(0.85, scale)));

  const finish = () => {
    setFinished(true);
    markAdhkarDone(set.key);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  };

  const goTo = (i: number) => {
    if (i < 0) return;
    if (i >= items.length) return finish();
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
        <T size={14} muted style={{ textAlign: 'center' }}>{single ? 'May Allah accept it.' : `${set.title} done for today.`}</T>
        <Button label="Back" onPress={() => router.back()} style={{ alignSelf: 'stretch', marginTop: 12 }} />
      </SafeAreaView>
    );
  }

  const current = items[index];
  const meaningOn = (i: number) => settings.adhkarMeaning || !!shown[i];

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingHorizontal: 20, gap: 10, paddingBottom: 6 }}>
        <Header
          title={set.title}
          subtitle={single ? set.subtitle ?? undefined : items.length ? `${index + 1} of ${items.length}` : undefined}
          right={
            <Pressable accessibilityRole="button" accessibilityLabel="Text size and reading settings" onPress={() => setShowSettings(true)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -10 }}>
              <T size={17} weight="bold">Aa</T>
            </Pressable>
          }
        />
        {!single && items.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: 3 }} accessibilityElementsHidden>
            {items.map((_, i) => (
              <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < index ? t.accent : i === index ? t.text : t.border }} />
            ))}
          </View>
        ) : null}
      </View>

      {items.length === 0 ? (
        <Loading label="Nothing here yet" />
      ) : (
        <GestureDetector gesture={pinch}>
          <View style={{ flex: 1 }} collapsable={false}>
            <FlatList
              ref={listRef}
              data={items}
              horizontal
              pagingEnabled
              scrollEnabled={!single}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => String(i)}
              getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
              onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
              renderItem={({ item, index: i }) => (
                <View style={{ width, paddingHorizontal: 20, paddingVertical: 8 }}>
                  <View style={{ flex: 1, borderRadius: 20, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, overflow: 'hidden' }}>
                    {/* The ScrollView must be flex:1 to scroll long passages (e.g. Al-Baqarah 285–286). */}
                    <ScrollView style={{ flex: 1 }} nestedScrollEnabled showsVerticalScrollIndicator contentContainerStyle={{ padding: 20, gap: 16, flexGrow: 1, justifyContent: 'center' }}>
                      {!single ? <T size={13} weight="bold" color={t.accent} style={{ textAlign: 'center' }}>{item.title}</T> : null}
                      <Pressable accessibilityRole="button" accessibilityLabel={single ? item.title : `${item.title}. Tap to count`} onPress={single ? undefined : tap} disabled={single} style={{ gap: 14 }}>
                        {item.type === 'dua' ? (
                          <>
                            {item.arabic ? <Arabic center>{item.arabic}</Arabic> : null}
                            {settings.adhkarTransliteration && item.transliteration ? (
                              <T size={bodySize} style={{ textAlign: 'center', lineHeight: Math.round(bodySize * 1.6), fontStyle: 'italic' }}>{item.transliteration}</T>
                            ) : null}
                            {meaningOn(i) && item.translation ? (
                              <T size={bodySize} muted style={{ textAlign: 'center', lineHeight: Math.round(bodySize * 1.6) }}>{item.translation}</T>
                            ) : null}
                          </>
                        ) : (
                          <QuranBlock loaded={quran[i]} trId={trId} meaning={meaningOn(i)} bodySize={bodySize} urdu={settings.translationLang === 'ur'} />
                        )}
                      </Pressable>
                      <View style={{ alignItems: 'center', gap: 8 }}>
                        <Reference item={item} />
                        {!settings.adhkarMeaning && hasMeaning(item, quran[i], trId) ? (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityState={{ expanded: !!shown[i] }}
                            onPress={() => setShown((s) => ({ ...s, [i]: !s[i] }))}
                            hitSlop={8}
                            style={{ paddingHorizontal: 12, height: 32, borderRadius: 16, borderWidth: 1, borderColor: t.border, justifyContent: 'center' }}
                          >
                            <T size={12} weight="semibold" muted>{shown[i] ? 'Hide meaning' : 'Meaning'}</T>
                          </Pressable>
                        ) : null}
                      </View>
                    </ScrollView>
                  </View>
                </View>
              )}
            />
            {overlay}
          </View>
        </GestureDetector>
      )}

      {current ? (
        single && current.repeat <= 1 ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 10 }}>
            <Button label="Done · I’ve read it" onPress={finish} />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 6 }}>
            {!single ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Previous" onPress={() => goTo(index - 1)} style={{ width: 52, height: 52, borderRadius: 14, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="chevron-left" color={t.text} />
              </Pressable>
            ) : null}
            <Pressable accessibilityRole="button" accessibilityLabel={`Count, ${counts[index] ?? 0} of ${current.repeat}`} onPress={tap} style={{ flex: 1, height: 52, borderRadius: 14, backgroundColor: t.inverseBg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }}>
              <T size={16} weight="bold" color={t.inverseText}>{`${counts[index] ?? 0} / ${current.repeat}`}</T>
              <T size={13} color={t.inverseMuted}>tap to count</T>
            </Pressable>
            {!single ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Next" onPress={() => goTo(index + 1)} style={{ width: 52, height: 52, borderRadius: 14, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="chevron-right" color={t.text} />
              </Pressable>
            ) : null}
          </View>
        )
      ) : null}
      {!single ? <T size={11} faint style={{ textAlign: 'center', paddingBottom: 6 }}>Tap the text to count · swipe for next · pinch to resize</T> : null}

      <ReaderSettings mode="adhkar" visible={showSettings} onClose={() => setShowSettings(false)} />
    </SafeAreaView>
  );
}

function hasMeaning(item: AdhkarItem, loaded: Loaded | undefined, trId: number): boolean {
  if (item.type === 'dua') return !!item.translation;
  return !!loaded?.verses?.some((v) => !!v.translations[String(trId)]);
}

function Reference({ item }: { item: AdhkarItem }) {
  if (item.type === 'dua') return item.reference ? <T size={12} faint style={{ textAlign: 'center' }}>{item.reference}</T> : null;
  const ch = item.surah ? chapter(item.surah) : undefined;
  if (!ch) return null;
  const range = `${item.surah}:${item.verse_from}${item.verse_to !== item.verse_from ? `–${item.verse_to}` : ''}`;
  return <T size={12} faint style={{ textAlign: 'center' }}>{`${ch.name} ${range}`}</T>;
}

function QuranBlock({ loaded, trId, meaning, bodySize, urdu }: { loaded?: Loaded; trId: number; meaning: boolean; bodySize: number; urdu: boolean }) {
  if (!loaded) return <Loading />;
  if (loaded.error) return <T muted style={{ textAlign: 'center' }}>{loaded.error}</T>;
  return (
    <>
      {loaded.verses?.map((v) => (
        <View key={v.key} style={{ gap: 8 }}>
          <Arabic center>{v.arabic}</Arabic>
          {meaning && v.translations[String(trId)] ? (
            <T
              size={urdu ? bodySize + 2 : bodySize}
              muted
              style={urdu ? { textAlign: 'center', writingDirection: 'rtl', lineHeight: Math.round(bodySize * 2.1), fontFamily: 'NotoNaskhArabic_400Regular' } : { textAlign: 'center', lineHeight: Math.round(bodySize * 1.6) }}
            >
              {v.translations[String(trId)]}
            </T>
          ) : null}
        </View>
      ))}
    </>
  );
}
