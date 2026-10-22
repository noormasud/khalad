import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Dots } from './ui';
import { useTheme } from '../theme';

/**
 * Shown after the native splash while fonts and saved data load:
 * the خلد mark gently fades and rises in, with a calm loader underneath.
 * `done` fades the whole screen out before the app appears.
 */
export function AnimatedSplash({ done, onFinish }: { done: boolean; onFinish: () => void }) {
  const t = useTheme();
  const enter = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(1)).current;
  const minShown = useRef(false);
  const doneRef = useRef(done);
  doneRef.current = done;

  const finish = () =>
    Animated.timing(exit, { toValue: 0, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => onFinish());

  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const id = setTimeout(() => {
      minShown.current = true;
      if (doneRef.current) finish();
    }, 900);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (done && minShown.current) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: t.bg, opacity: exit, alignItems: 'center', justifyContent: 'center' }]}>
      <Animated.View
        style={{
          alignItems: 'center',
          gap: 6,
          opacity: enter,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        }}
      >
        {/* System font here on purpose: it is drawn before custom fonts finish loading. */}
        <Text style={{ fontSize: 64, fontWeight: '700', color: t.text, writingDirection: 'rtl' }}>خلد</Text>
        <Text style={{ fontSize: 15, letterSpacing: 2, color: t.textMuted }}>KHALAD</Text>
      </Animated.View>
      <View style={{ position: 'absolute', bottom: 96 }}>
        <Dots />
      </View>
    </Animated.View>
  );
}
