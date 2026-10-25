import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, View, type ViewToken } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Arabic, Button, ErrorState, Header, Loading, ProgressBar, T } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import { ReaderSettings } from '../../src/components/ReaderSettings';
import { useTheme } from '../../src/theme';
import { useApp } from '../../src/state/AppState';
import { chapter } from '../../src/data/chapters';
import { getSurah, getVerses } from '../../src/lib/quran';
import type { SurahData, Verse } from '../../src/lib/quranText';
import { GOALS } from '../../src/state/model';
import { GestureDetector } from 'react-native-gesture-handler';
import { usePinchTextSize } from '../../src/hooks/usePinchTextSize';
import { bucket, track } from '../../src/lib/analytics';
import { goToTab } from '../../src/lib/nav';
import { setResumePath } from '../../src/lib/resume';

export default function SurahReader() {
  const t = useTheme();
  const params = useLocalSearchParams<{ id: string; verse?: string; mark?: string; from?: string }>();
  const surah = Math.trunc(Number(params.id));
  const ch = chapter(surah);
  const startVerse = Math.max(1, Math.trunc(Number(params.verse)) || 1);
  const showMark = params.mark === '1';
  // Sunnah surahs (Mulk, Kahf…), reminders and Ummah goals open in "Sunnah mode": they never move
  // your Quran place or count toward the daily reading goal / khatam. Only the Quran tab does.
  const sunnahMode = showMark || params.from === 'deed';

  const { settings, progress, today, markVersesRead, setLastRead, markSurahDone } = useApp();
  const trId = settings.showTranslation ? settings.translationIds[settings.translationLang] : null;
  // Fetch English and Urdu together (cached once), so switching language or showing/hiding the
  // translation is instant and never needs another download.
  const enId = settings.translationIds.en;
  const urId = settings.translationIds.ur;
  const trIds = useMemo(() => [enId, urId], [enId, urId]);

  const [data, setData] = useState<SurahData | null>(null);
  const [bismillah, setBismillah] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const { gesture: pinch, overlay } = usePinchTextSize();
  const listRef = useRef<FlatList<Verse>>(null);
  const scrolled = useRef(false);

  useEffect(() => {
    if (!ch) return;
    let alive = true;
    setError('');
    getSurah(surah, trIds)
      .then((d) => alive && setData(d))
      .catch((e: Error) => alive && setError(e.message || 'Please check your internet connection.'));
    // The Bismillah header is taken from Al-Fatihah 1:1 as supplied, never typed by hand.
    if (surah !== 1 && surah !== 9) {
      getVerses(1, 1, 1, [])
        .then((v) => alive && setBismillah(v[0]?.arabic ?? null))
        .catch(() => undefined);
    }
    return () => {
      alive = false;
    };
  }, [surah, trIds, attempt, ch]);

  useEffect(() => {
    if (!settings.keepAwake) return;
    activateKeepAwakeAsync('reader').catch(() => undefined);
    return () => {
      deactivateKeepAwake('reader');
    };
  }, [settings.keepAwake]);

  // Count a verse as read once it has been on screen for a moment.
  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken<Verse>[] }) => {
    const verses = viewableItems.map((v) => v.item).filter(Boolean) as Verse[];
    if (verses.length === 0) return;
    resumeRef.current(verses[0].number);
    if (sunnahRef.current) return;
    markRef.current(verses.map((v) => ({ key: v.key, page: v.page })));
    verses.forEach((v) => seenRef.current.add(v.key));
    lastRef.current(surah, verses[0].number);
  }).current;
  // One "read_session" per visit: which surah and roughly how many ayahs were read.
  const seenRef = useRef(new Set<string>());
  useEffect(() => {
    const seen = seenRef.current;
    return () => {
      if (seen.size > 0) track('read_session', { surah, ayahs: bucket(seen.size), sunnah_mode: sunnahMode });
    };
  }, [surah, sunnahMode]);
  // Remember the exact ayah in case Android closes the app in the background.
  const resumeSuffix = `${showMark ? '&mark=1' : ''}${params.from === 'deed' ? '&from=deed' : ''}`;
  const resumeRef = useRef((verse: number) => setResumePath(`/surah/${surah}?verse=${verse}${resumeSuffix}`));
  resumeRef.current = (verse: number) => setResumePath(`/surah/${surah}?verse=${verse}${resumeSuffix}`);
  useEffect(() => {
    setResumePath(`/surah/${surah}?verse=${startVerse}${resumeSuffix}`);
  }, [surah, startVerse, resumeSuffix]);
  const sunnahRef = useRef(sunnahMode);
  sunnahRef.current = sunnahMode;
  const markRef = useRef(markVersesRead);
  markRef.current = markVersesRead;
  const lastRef = useRef(setLastRead);
  lastRef.current = setLastRead;
  const viewConfig = useRef({ itemVisiblePercentThreshold: 60, minimumViewTime: 900 }).current;

  const scrollToStart = useCallback(() => {
    if (scrolled.current || !data || startVerse <= 1) return;
    scrolled.current = true;
    const index = Math.min(startVerse - 1, data.verses.length - 1);
    setTimeout(() => listRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0 }), 50);
  }, [data, startVerse]);

  const translationName = data?.translations.find((x) => x.id === trId)?.name;
  const goal = GOALS[settings.goal];
  const target = goal.pages > 0 ? goal.pages : goal.verses;
  const doneToday = goal.pages > 0 ? progress.pagesByDay[today]?.length ?? 0 : progress.versesByDay[today]?.length ?? 0;
  const markedToday = (progress.surahDone[today] ?? []).includes(surah);

  if (!ch) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, padding: 20 }}>
        <Header title="Surah not found" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingHorizontal: 20, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: t.border, backgroundColor: t.surface }}>
        <Header
          title={ch.name}
          subtitle={`${ch.verses} ayahs`}
          right={
            <Pressable accessibilityRole="button" accessibilityLabel="Reading settings" onPress={() => setShowSettings(true)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="settings" color={t.text} />
            </Pressable>
          }
        />
      </View>

      {error ? (
        <ErrorState message={error} onRetry={() => setAttempt((a) => a + 1)} />
      ) : !data ? (
        <Loading label={`Preparing ${ch.name}…`} />
      ) : (
        <GestureDetector gesture={pinch}>
          <View style={{ flex: 1 }} collapsable={false}>
        <FlatList
          ref={listRef}
          data={data.verses}
          keyExtractor={(v) => v.key}
          // Rows must redraw when reading settings change, not only when the verses do.
          extraData={`${trId}-${settings.translationLang}-${settings.arabicSize}-${settings.arabicFont}`}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={viewConfig}
          onLayout={scrollToStart}
          initialNumToRender={Math.min(data.verses.length, Math.max(12, startVerse + 4))}
          windowSize={11}
          onScrollToIndexFailed={(info) => {
            listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
            setTimeout(() => listRef.current?.scrollToIndex({ index: info.index, animated: false }), 120);
          }}
          contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
          ListHeaderComponent={
            <View style={{ alignItems: 'center', gap: 4, paddingBottom: 16 }}>
              <Arabic center scale={1.1}>{ch.arabic}</Arabic>
              {bismillah ? <Arabic center>{bismillah}</Arabic> : null}
            </View>
          }
          renderItem={({ item: v }) => (
            <View style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: t.divider, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ minWidth: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: t.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                  <T size={11} weight="bold">{v.number}</T>
                </View>
                <T size={11} faint>{`Page ${v.page} · Juz ${v.juz}`}</T>
              </View>
              <Arabic>{v.arabic}</Arabic>
              {trId && v.translations[String(trId)] ? (
                <T
                  size={settings.translationLang === 'ur' ? 17 : 14}
                  muted
                  style={settings.translationLang === 'ur' ? { writingDirection: 'rtl', textAlign: 'right', lineHeight: 32, fontFamily: 'NotoNaskhArabic_400Regular' } : { lineHeight: 22 }}
                >
                  {v.translations[String(trId)]}
                </T>
              ) : null}
            </View>
          )}
          ListFooterComponent={
            <View style={{ gap: 12, paddingTop: 20 }}>
              <T size={11} faint style={{ textAlign: 'center' }}>
                {`Quran text: Quran.com (Quran Foundation)${translationName ? ` · Translation: ${translationName}` : ''}`}
              </T>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {surah > 1 ? <Button label="Previous surah" variant="soft" style={{ flex: 1 }} onPress={() => router.replace(`/surah/${surah - 1}`)} /> : null}
                {surah < 114 ? <Button label="Next surah" style={{ flex: 1 }} onPress={() => router.replace(`/surah/${surah + 1}`)} /> : null}
              </View>
            </View>
          }
        />
            {overlay}
          </View>
        </GestureDetector>
      )}

      <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, gap: 8, borderTopWidth: 1, borderTopColor: t.border, backgroundColor: t.surface }}>
        {sunnahMode ? (
          <T size={12} muted style={{ textAlign: 'center' }}>Sunnah reading · your Quran place and daily goal stay as they are</T>
        ) : (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T size={12} muted>{`Today: ${Math.min(doneToday, target)} of ${target} ${goal.pages > 0 ? (target === 1 ? 'page' : 'pages') : 'ayah'}`}</T>
              <T size={12} muted>{`Khatam ${Math.floor((progress.khatam.length / 6236) * 100)}%`}</T>
            </View>
            <ProgressBar value={target ? doneToday / target : 0} color={t.accent} track={t.divider} height={5} />
          </>
        )}
        {showMark && data ? (
          markedToday ? (
            <Button label="Read today ✓  Back to Today" variant="soft" onPress={() => goToTab('/')} />
          ) : (
            <Button
              label={surah === 67 ? 'Mark as read tonight' : 'Mark as read'}
              onPress={() => {
                markSurahDone(surah);
              }}
            />
          )
        ) : null}
      </View>

      <ReaderSettings visible={showSettings} onClose={() => setShowSettings(false)} />
    </SafeAreaView>
  );
}
