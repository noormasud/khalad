import React, { useMemo } from 'react';
import { Alert, Platform, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, ProgressBar, Screen, T, TickCircle } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import { useTheme } from '../../src/theme';
import { useApp } from '../../src/state/AppState';
import { track } from '../../src/lib/analytics';
import { useContent } from '../../src/state/ContentState';
import { usePrayerTimes } from '../../src/hooks/usePrayer';
import { formatShortDate, formatTime } from '../../src/lib/dates';
import { formatHijri, toHijri } from '../../src/lib/hijri';
import { PRAYER_LABELS, SALAH } from '../../src/lib/prayer';
import { computeStreak } from '../../src/lib/streak';
import { dailyPick } from '../../src/lib/content';
import { chapter } from '../../src/data/chapters';
import { GOALS } from '../../src/state/model';
import { pinWidget } from '../../src/widgets/refresh';

type Slot = { key: string; title: string; when: string; state: 'done' | 'now' | 'later'; actions: { label: string; href: string }[] };

export default function Today() {
  const t = useTheme();
  const { settings, progress, today } = useApp();
  const { content } = useContent();
  const prayer = usePrayerTimes();
  const now = new Date();
  const hijri = toHijri(now, settings.hijriAdjust);
  const ramadan = hijri.month === 9;

  const streak = useMemo(
    () => computeStreak({ metDays: progress.metDays, pausedDays: progress.pausedDays, freezesPerMonth: 2, today }),
    [progress.metDays, progress.pausedDays, today],
  );

  const versesToday = progress.versesByDay[today]?.length ?? 0;
  const pagesToday = progress.pagesByDay[today]?.length ?? 0;
  const goal = GOALS[settings.goal];
  const goalTarget = goal.pages > 0 ? goal.pages : goal.verses;
  const goalDone = goal.pages > 0 ? pagesToday : versesToday;
  const goalMetToday = progress.metDays.includes(today);

  const last = progress.lastRead;
  const lastCh = chapter(last?.surah ?? 1);
  const readHref = last ? `/surah/${last.surah}?verse=${last.verse}` : '/surah/1';

  const daily = useMemo(() => {
    // One item a day from the verified Hadith and Sunnah together.
    return dailyPick(content.daily_items, now);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.daily_items, today]);

  const challenges = content.seasonal_challenges.filter((c) => c.hijri_month === hijri.month && c.hijri_days.includes(hijri.day));

  const slots = useMemo<Slot[]>(() => {
    const done = new Set(progress.adhkarDone[today] ?? []);
    const surahs = new Set(progress.surahDone[today] ?? []);
    const tm = prayer?.today;
    const at = now.getTime();
    const win = (from?: Date, to?: Date) => (from && at >= from.getTime() && (!to || at < to.getTime()) ? 'now' : 'later');
    const list: Slot[] = [];
    const hasSet = (k: string) => content.adhkar_sets.some((s) => s.key === k);
    if (now.getDay() === 5) {
      list.push({
        key: 'kahf',
        title: 'Surah Al-Kahf',
        when: 'Friday Sunnah',
        state: surahs.has(18) ? 'done' : 'now',
        actions: [{ label: 'Read', href: '/surah/18?mark=1' }],
      });
    }
    if (hasSet('morning'))
      list.push({
        key: 'morning',
        title: 'Morning adhkar',
        when: tm ? `After Fajr · ${formatTime(tm.fajr, settings.use24h)}` : 'After Fajr',
        state: done.has('morning') ? 'done' : (win(tm?.fajr, tm?.dhuhr) as Slot['state']),
        actions: [{ label: 'Start', href: '/adhkar/morning' }],
      });
    if (hasSet('evening'))
      list.push({
        key: 'evening',
        title: 'Evening adhkar',
        when: tm ? `After Asr · ${formatTime(tm.asr, settings.use24h)}` : 'After Asr',
        state: done.has('evening') ? 'done' : (win(tm?.asr, tm?.isha) as Slot['state']),
        actions: [{ label: 'Start', href: '/adhkar/evening' }],
      });
    const nightDone = (!hasSet('night') || done.has('night')) && surahs.has(67);
    list.push({
      key: 'night',
      title: 'Night',
      when: tm ? `After Isha · ${formatTime(tm.isha, settings.use24h)}` : 'After Isha',
      state: nightDone ? 'done' : (win(tm?.isha) as Slot['state']),
      actions: [
        ...(hasSet('night') ? [{ label: done.has('night') ? 'Adhkar ✓' : 'Adhkar', href: '/adhkar/night' }] : []),
        { label: surahs.has(67) ? 'Surah Mulk ✓' : 'Surah Mulk', href: '/surah/67?mark=1' },
      ],
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.adhkarDone, progress.surahDone, prayer, content.adhkar_sets, today, settings.use24h]);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <T size={13} muted>{`${formatShortDate(now)} · ${formatHijri(hijri)}`}</T>
          <T size={26} weight="extrabold" style={{ letterSpacing: -0.5, lineHeight: 32 }}>
            Khalad<T size={26} weight="extrabold" color={t.accent}>.</T>
          </T>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Reading streak ${streak.current} days`}
          onPress={() => router.push('/streak')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: 12, borderRadius: 20, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}
        >
          <Icon name="flame" size={16} color={t.streak} />
          <T size={14} weight="bold">{streak.current}</T>
        </Pressable>
      </View>

      {ramadan && prayer ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Card style={{ flex: 1, gap: 2 }}>
            <T size={12} muted>Sehri ends</T>
            <T size={20} weight="bold">{formatTime(prayer.today.fajr, settings.use24h)}</T>
          </Card>
          <Card inverse style={{ flex: 1, gap: 2 }}>
            <T size={12} color={t.inverseMuted}>Iftar</T>
            <T size={20} weight="bold" color={t.inverseText}>{formatTime(prayer.today.maghrib, settings.use24h)}</T>
          </Card>
        </View>
      ) : null}

      {prayer ? (
        <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <T size={12} muted>Next prayer</T>
            <T size={19} weight="bold">{`${PRAYER_LABELS[prayer.next.name]} · ${formatTime(prayer.next.time, settings.use24h)}`}</T>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/settings/prayer')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 }}>
            <Icon name="pin" size={14} color={t.textMuted} />
            <T size={12} muted numberOfLines={1} style={{ maxWidth: 130 }}>{settings.location?.label ?? ''}</T>
          </Pressable>
        </Card>
      ) : (
        <Card>
          <T size={15} weight="semibold">Set your location for prayer times</T>
          <Button label="Choose location" variant="soft" onPress={() => router.push('/settings/prayer')} />
        </Card>
      )}

      <Pressable accessibilityRole="button" onPress={() => router.push(readHref as never)}>
        <Card inverse style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <T size={12} color={t.inverseMuted}>
              {goalMetToday ? 'Today’s goal done · MashaAllah' : `Today’s reading · ${Math.min(goalDone, goalTarget)} of ${goalTarget} ${goal.pages > 0 ? (goalTarget === 1 ? 'page' : 'pages') : 'ayah'}`}
            </T>
            <T size={17} weight="bold" color={t.inverseText}>{last ? `Continue ${lastCh?.name ?? ''}` : 'Start with Al-Fatihah'}</T>
            <ProgressBar value={goalTarget ? goalDone / goalTarget : 0} color={t.progress} track={t.dark ? '#D4D4D4' : 'rgba(255,255,255,0.2)'} height={4} />
          </View>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.inverseText, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="chevron-right" color={t.inverseBg} />
          </View>
        </Card>
      </Pressable>

      {daily ? (
        <Card style={{ gap: 4 }}>
          <T size={12} weight="bold" color={t.accent}>{daily.kind === 'sunnah' ? 'Sunnah of the day' : 'Hadith of the day'}</T>
          <T size={14} style={{ lineHeight: 21 }}>{`“${daily.text.replace(/^"|"$/g, '')}”`}</T>
          {daily.reference ? <T size={12} muted>{daily.reference}</T> : null}
        </Card>
      ) : null}

      <WidgetPrompt />

      {challenges.length > 0 ? (
        <Card style={{ gap: 10 }}>
          <T size={12} weight="bold" color={t.accent}>{`${formatHijri(hijri).replace(/ \d+$/, '')} · today`}</T>
          {challenges.map((c) => (
            <Pressable
              key={c.title}
              accessibilityRole={c.set_key ? 'button' : undefined}
              disabled={!c.set_key}
              onPress={() => c.set_key && router.push(`/adhkar/${c.set_key}`)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}
            >
              <View style={{ flex: 1 }}>
                <T size={14} weight="semibold">{c.title}</T>
                {c.subtitle ? <T size={12} muted>{c.subtitle}</T> : null}
              </View>
              {c.set_key ? <Icon name="chevron-right" size={18} color={t.textFaint} /> : null}
            </Pressable>
          ))}
        </Card>
      ) : null}

      <T size={14} weight="bold" style={{ marginTop: 4 }}>Your day</T>
      <View>
        {slots.map((s, i) => {
          const lastSlot = i === slots.length - 1;
          return (
            <View key={s.key} style={{ flexDirection: 'row', gap: 14 }}>
              <View style={{ alignItems: 'center', width: 24 }}>
                <TickCircle state={s.state} />
                {!lastSlot ? <View style={{ flex: 1, width: 2, backgroundColor: s.state === 'done' ? t.accent : t.border }} /> : null}
              </View>
              <View style={{ flex: 1, paddingBottom: lastSlot ? 0 : 16, gap: 8 }}>
                {s.state === 'now' && s.actions.length === 1 ? (
                  <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 }}>
                    <View style={{ flex: 1 }}>
                      <T size={15} weight="bold">{s.title}</T>
                      <T size={12} muted>{`Now · ${s.when}`}</T>
                    </View>
                    <Button
                      label={s.actions[0].label}
                      onPress={() => {
                        track('today_tap', { slot: s.key, target: s.actions[0].href.split('?')[0] });
                        router.push(s.actions[0].href as never);
                      }}
                      style={{ minHeight: 40 }}
                    />
                  </Card>
                ) : (
                  <>
                    <View>
                      <T size={14} weight="semibold" color={s.state === 'later' ? t.textMuted : t.text}>{s.title}</T>
                      <T size={12} muted>{s.when}</T>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {s.actions.map((a) => (
                        <Pressable
                          key={a.href}
                          accessibilityRole="button"
                          onPress={() => {
                            track('today_tap', { slot: s.key, target: a.href.split('?')[0] });
                            router.push(a.href as never);
                          }}
                          style={{ minHeight: 40, paddingHorizontal: 14, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}
                        >
                          <T size={13} weight="semibold" numberOfLines={1} style={{ flexShrink: 0 }}>
                            {/* Non-breaking spaces: the label can never wrap, so no word can be hidden. */}
                            {a.label.replace(/ /g, '\u00A0')}
                          </T>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {settings.salahChecklist && prayer ? <SalahCard /> : null}
    </Screen>
  );
}

function SalahCard() {
  const t = useTheme();
  const { progress, today, toggleSalah } = useApp();
  const done = new Set(progress.salah[today] ?? []);
  return (
    <Card>
      <T size={14} weight="bold">Salah today</T>
      <T size={12} muted>Private checklist</T>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        {SALAH.map((p) => {
          const on = done.has(p);
          return (
            <Pressable
              key={p}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={PRAYER_LABELS[p]}
              onPress={() => toggleSalah(p)}
              style={{ alignItems: 'center', gap: 6, minWidth: 52, minHeight: 52 }}
            >
              <View style={{ width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: on ? t.accent : t.border, backgroundColor: on ? t.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {on ? <Icon name="check" size={16} strokeWidth={3} color={t.onAccent} /> : null}
              </View>
              <T size={11}>{PRAYER_LABELS[p]}</T>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

/**
 * Android never lets an app place a widget by itself, so this one-time card asks:
 * each button opens the phone's own "Add to home screen" prompt.
 */
function WidgetPrompt() {
  const t = useTheme();
  const { settings, updateSettings } = useApp();
  if (Platform.OS !== 'android' || !settings.onboarded || settings.widgetPromptDone) return null;
  const add = async (name: string) => {
    track('widget_pin_request', { widget: name, from: 'today' });
    const ok = await pinWidget(name);
    if (ok) updateSettings({ widgetPromptDone: true });
    else
      Alert.alert(
        'Add the widget yourself',
        'Touch and hold an empty space on your home screen, tap Widgets, find Khalad, then drag the widget onto your home screen.',
        [{ text: 'OK', onPress: () => updateSettings({ widgetPromptDone: true }) }],
      );
  };
  const options: { name: string; label: string }[] = [
    { name: 'NextPrayer', label: 'Next prayer' },
    { name: 'TodayReading', label: 'Today’s reading' },
    { name: 'HadithOfDay', label: 'Hadith' },
  ];
  return (
    <Card style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <T size={14} weight="bold">Put Khalad on your home screen</T>
          <T size={12} muted>Quiet widgets. Pick one, your phone asks to place it.</T>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Not now"
          hitSlop={10}
          onPress={() => {
            track('widget_prompt_dismissed');
            updateSettings({ widgetPromptDone: true });
          }}
          style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginTop: -4, marginRight: -6 }}
        >
          <Icon name="close" size={16} color={t.textMuted} />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((o) => (
          <Pressable
            key={o.name}
            accessibilityRole="button"
            onPress={() => add(o.name)}
            style={({ pressed }) => ({ minHeight: 40, paddingHorizontal: 14, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: t.accentSoft, opacity: pressed ? 0.7 : 1 })}
          >
            <T size={13} weight="semibold" color={t.accentText} numberOfLines={1}>{`+\u00A0${o.label.replace(/ /g, '\u00A0')}`}</T>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}
