import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Arabic, Header, Screen, T } from '../src/components/ui';
import { useTheme } from '../src/theme';
import { useApp } from '../src/state/AppState';
import { bucket, track } from '../src/lib/analytics';

// Plain dhikr phrases (not Quran text).
const PHRASES = [
  { label: 'SubhanAllah', ar: 'سُبْحَانَ اللَّهِ', target: 33 },
  { label: 'Alhamdulillah', ar: 'الْحَمْدُ لِلَّهِ', target: 33 },
  { label: 'Allahu Akbar', ar: 'اللَّهُ أَكْبَرُ', target: 34 },
];
const SIZE = 248;
const STROKE = 12;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

export default function Tasbih() {
  const t = useTheme();
  const { progress, updateProgress, today } = useApp();
  const [k, setK] = useState(0);
  const [count, setCount] = useState(0);
  const cur = PHRASES[k];
  const totalToday = progress.tasbih.day === today ? progress.tasbih.count : 0;

  const taps = useRef(0);
  useEffect(() => () => {
    if (taps.current > 0) track('tasbih_session', { taps: bucket(taps.current) });
  }, []);

  const tap = () => {
    taps.current += 1;
    const c = count + 1;
    updateProgress((p) => ({ ...p, tasbih: { day: today, count: (p.tasbih.day === today ? p.tasbih.count : 0) + 1 } }));
    if (c >= cur.target) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      setK((k + 1) % PHRASES.length);
      setCount(0);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      setCount(c);
    }
  };

  return (
    <Screen scroll={false}>
      <Header
        title="Tasbih"
        right={
          <Pressable accessibilityRole="button" onPress={() => { setCount(0); setK(0); }} style={{ minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' }}>
            <T size={14} muted>Reset</T>
          </Pressable>
        }
      />
      <View style={{ flexDirection: 'row', gap: 6, padding: 4, borderRadius: 12, backgroundColor: t.divider }} accessibilityRole="radiogroup">
        {PHRASES.map((p, i) => (
          <Pressable
            key={p.label}
            accessibilityRole="radio"
            accessibilityState={{ checked: i === k }}
            onPress={() => { setK(i); setCount(0); }}
            style={{ flex: 1, minHeight: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: i === k ? t.surface : 'transparent' }}
          >
            <T size={12} weight={i === k ? 'bold' : 'regular'} muted={i !== k}>{p.label}</T>
          </Pressable>
        ))}
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <Arabic center scale={1.2}>{cur.ar}</Arabic>
        <Pressable accessibilityRole="button" accessibilityLabel={`Count. ${count} of ${cur.target}`} onPress={tap} style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
            <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={t.border} strokeWidth={STROKE} fill={t.surface} />
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              stroke={t.accent}
              strokeWidth={STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${C} ${C}`}
              strokeDashoffset={C * (1 - count / cur.target)}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          </Svg>
          <T size={56} weight="bold" style={{ lineHeight: 64 }}>{count}</T>
          <T size={14} muted>{`of ${cur.target}`}</T>
        </Pressable>
        <T size={13} muted>{`Today: ${totalToday} · moves to the next phrase automatically`}</T>
      </View>
    </Screen>
  );
}
