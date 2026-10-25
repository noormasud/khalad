import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Stack, router, usePathname } from 'expo-router';
import { AppState as RNAppState, useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { NotoNaskhArabic_400Regular, NotoNaskhArabic_700Bold } from '@expo-google-fonts/noto-naskh-arabic';
import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { ScheherazadeNew_400Regular, ScheherazadeNew_700Bold } from '@expo-google-fonts/scheherazade-new';
import { AppProvider, useApp } from '../src/state/AppState';
import { ContentProvider } from '../src/state/ContentState';
import { AnimatedSplash } from '../src/components/Splash';
import { useTheme } from '../src/theme';
import { useNotificationSync } from '../src/hooks/useNotificationSync';
import { configureNotifications } from '../src/lib/notifications';
import { newAnonId, screenOf, setAnalytics, track } from '../src/lib/analytics';
import { readJson, writeJson } from '../src/lib/storage';
import { computeStreak } from '../src/lib/streak';
import { streakDays } from '../src/state/model';
import { useContent } from '../src/state/ContentState';
import { buildWidgetData } from '../src/widgets/data';
import { refreshWidgets } from '../src/widgets/refresh';
import { refreshUpdateRule, useUpdateStatus } from '../src/lib/updates';
import { ForceUpdateScreen } from '../src/components/ForceUpdate';
import { saveResume, setResumePath, takeResume } from '../src/lib/resume';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function Shell({ fontsReady }: { fontsReady: boolean }) {
  const t = useTheme();
  const { ready, settings, updateSettings, progress, today } = useApp();
  const scheme = useColorScheme();
  const pathname = usePathname();
  const [splashGone, setSplashGone] = useState(false);
  const loaded = ready && fontsReady;

  useNotificationSync();

  useEffect(() => {
    // Hand over from the native splash to the animated one immediately.
    SplashScreen.hideAsync().catch(() => undefined);
    configureNotifications().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!settings.anonId) updateSettings({ anonId: newAnonId() });
    setAnalytics(settings.analytics, settings.anonId);
  }, [ready, settings.analytics, settings.anonId, updateSettings]);

  // Keep home-screen widgets in step with reading, streak and today's hadith.
  const { content } = useContent();
  useEffect(() => {
    if (!ready) return;
    const id = setTimeout(() => refreshWidgets(buildWidgetData(settings, progress, content)), 1200);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, progress.metDays, progress.deedDays, progress.pagesByDay, progress.versesByDay, progress.lastRead, settings.goal, settings.location, settings.method, settings.hanafi, settings.adjustments, settings.use24h, content.daily_items, today]);

  // Remote update switch: checked at launch and whenever the app comes back to the front.
  const update = useUpdateStatus();
  useEffect(() => {
    refreshUpdateRule().catch(() => undefined);
    const sub = RNAppState.addEventListener('change', (s) => s === 'active' && refreshUpdateRule().catch(() => undefined));
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (update.status === 'force') track('force_update_shown');
  }, [update.status]);

  // Where the person is, so a cold start soon after can put them back. Surah and adhkar readers
  // report their own exact spot (ayah / dhikr), so they're skipped here.
  useEffect(() => {
    if (!pathname || pathname.startsWith('/surah/') || pathname.startsWith('/adhkar/')) return;
    setResumePath(pathname);
  }, [pathname]);
  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (s) => {
      if (s === 'background') saveResume().catch(() => undefined);
    });
    return () => sub.remove();
  }, []);
  // On a cold start within 20 minutes of leaving, go back to that screen.
  const restored = useRef(false);
  useEffect(() => {
    if (!loaded || !settings.onboarded || restored.current) return;
    restored.current = true;
    takeResume()
      .then((path) => {
        if (!path) return;
        track('resume_restored', { screen: path.split('?')[0].split('/')[1] ?? '' });
        setTimeout(() => {
          if (['/quran', '/deeds', '/more'].includes(path)) router.navigate(path as never);
          else router.push(path as never);
        }, 60);
      })
      .catch(() => undefined);
  }, [loaded, settings.onboarded]);

  // Which screens get used (and which don't).
  useEffect(() => {
    if (!pathname) return;
    const { screen, id } = screenOf(pathname);
    track('screen_view', id ? { screen, id } : { screen });
  }, [pathname]);

  // Once a day: an "app opened" event with a snapshot of the person's choices.
  useEffect(() => {
    if (!ready || !settings.onboarded || !settings.anonId) return;
    let alive = true;
    (async () => {
      const last = await readJson<string>('khalad.lastOpenDay', '');
      if (!alive || last === today) return;
      await writeJson('khalad.lastOpenDay', today);
      const streak = computeStreak({ metDays: streakDays(progress), pausedDays: progress.pausedDays, freezesPerMonth: 2, today });
      track('app_open', {
        goal: settings.goal,
        streak: streak.current,
        freezes_left: streak.freezesLeftThisMonth,
        paused: progress.paused,
        theme: settings.theme,
        dark: (settings.theme === 'system' ? scheme : settings.theme) === 'dark',
        tr_lang: settings.translationLang,
        tr_on: settings.showTranslation,
        text_size: settings.arabicSize,
        font: settings.arabicFont,
        lock_line: settings.prayerLine,
        reminders_on: Object.values(settings.reminders).filter(Boolean).length,
      });
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, settings.onboarded, settings.anonId, today]);

  // Tapping a reminder opens the right screen (only routes we created).
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const route = res.notification.request.content.data?.route;
      if (typeof route === 'string' && /^\/(surah\/\d{1,3}(\?mark=1)?|adhkar\/[a-z0-9_]{2,40}|deeds)?$/.test(route)) {
        track('notification_tap', { target: route === '/' ? 'prayer_line' : route.slice(1).split('?')[0].replace('/', '_') });
        router.push(route as never);
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      {loaded && update.status === 'force' ? (
        <ForceUpdateScreen message={update.rule?.message} />
      ) : loaded ? (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg }, animation: 'slide_from_right' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen name="supporter" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
      ) : null}
      {!splashGone ? <AnimatedSplash done={loaded} onFinish={() => setSplashGone(true)} /> : null}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    NotoNaskhArabic_400Regular,
    NotoNaskhArabic_700Bold,
    Amiri_400Regular,
    Amiri_700Bold,
    ScheherazadeNew_400Regular,
    ScheherazadeNew_700Bold,
  });

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <ContentProvider>
            {/* If a font fails to load we still open the app with system fonts. */}
            <Shell fontsReady={fontsLoaded || !!fontError} />
          </ContentProvider>
        </AppProvider>
      </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
