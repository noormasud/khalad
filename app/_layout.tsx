import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
import { newAnonId, setAnalytics } from '../src/lib/analytics';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function Shell({ fontsReady }: { fontsReady: boolean }) {
  const t = useTheme();
  const { ready, settings, updateSettings } = useApp();
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

  // Tapping a reminder opens the right screen (only routes we created).
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const route = res.notification.request.content.data?.route;
      if (typeof route === 'string' && /^\/(surah\/\d{1,3}|adhkar\/[a-z0-9_]{2,40}|deeds)?$/.test(route)) {
        router.push(route as never);
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      {loaded ? (
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
      <SafeAreaProvider>
        <AppProvider>
          <ContentProvider>
            {/* If a font fails to load we still open the app with system fonts. */}
            <Shell fontsReady={fontsLoaded || !!fontError} />
          </ContentProvider>
        </AppProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
