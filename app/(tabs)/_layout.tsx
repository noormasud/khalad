import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../src/state/AppState';
import { useTheme } from '../../src/theme';
import { Icon, type IconName } from '../../src/components/Icon';
import { T } from '../../src/components/ui';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Today', icon: 'home' },
  quran: { label: 'Quran', icon: 'book' },
  deeds: { label: 'Deeds', icon: 'check-circle' },
  more: { label: 'More', icon: 'more' },
};

function TabBar({ state, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: t.surface,
        borderTopWidth: StyleSheet.hairlineWidth * 2,
        borderTopColor: t.border,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 10),
      }}
    >
      {state.routes.map((route, index) => {
        const meta = TABS[route.name];
        if (!meta) return null;
        const focused = state.index === index;
        const color = focused ? t.accent : t.textMuted;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={meta.label}
            onPress={() => {
              const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
            }}
            style={{ flex: 1, alignItems: 'center', gap: 3, minHeight: 44 }}
          >
            <Icon name={meta.icon} color={color} />
            <T size={11} weight={focused ? 'bold' : 'medium'} color={color}>{meta.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { settings } = useApp();
  if (!settings.onboarded) return <Redirect href="/onboarding" />;
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(p) => <TabBar {...p} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="quran" />
      <Tabs.Screen name="deeds" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
