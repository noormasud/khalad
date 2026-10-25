import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Card, Header, Screen, T, ToggleRow } from '../src/components/ui';
import { Icon } from '../src/components/Icon';
import { useTheme } from '../src/theme';
import { useApp } from '../src/state/AppState';
import { computeStreak } from '../src/lib/streak';
import { streakDays } from '../src/state/model';
import { dayKey, monthName } from '../src/lib/dates';

export default function Streak() {
  const t = useTheme();
  const { progress, today, updateProgress } = useApp();
  const res = useMemo(
    () => computeStreak({ metDays: streakDays(progress), pausedDays: progress.pausedDays, freezesPerMonth: 2, today }),
    [progress.metDays, progress.deedDays, progress.pausedDays, today],
  );

  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday first
  const met = new Set(progress.metDays);
  const deeds = new Set(progress.deedDays);
  const frozen = new Set(res.frozenDays);
  const paused = new Set(progress.pausedDays);

  const pagesThisMonth = Object.entries(progress.pagesByDay)
    .filter(([k]) => k.startsWith(today.slice(0, 7)))
    .reduce((n, [, v]) => n + v.length, 0);
  const daysSoFar = now.getDate();

  const setPaused = (on: boolean) =>
    updateProgress((p) => ({
      ...p,
      paused: on,
      pausedDays: on ? (p.pausedDays.includes(today) ? p.pausedDays : [...p.pausedDays, today]) : p.pausedDays,
    }));

  return (
    <Screen>
      <Header title="Your streak" subtitle="Any day with Quran reading or a good deed in Khalad counts" />
      <Card inverse style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18 }}>
        <Icon name="flame" size={40} color={t.dark ? t.streak : '#FB923C'} />
        <View>
          <T size={30} weight="extrabold" color={t.inverseText} style={{ lineHeight: 36 }}>{`${res.current} ${res.current === 1 ? 'day' : 'days'}`}</T>
          <T size={13} color={t.inverseMuted}>{`Best: ${res.best} · ${res.freezesLeftThisMonth} freeze${res.freezesLeftThisMonth === 1 ? '' : 's'} left this month`}</T>
        </View>
      </Card>

      <Card>
        <T size={14} weight="bold">{`${monthName(now.getMonth())} ${now.getFullYear()}`}</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <View key={`h${i}`} style={{ width: `${100 / 7}%` as const, alignItems: 'center', paddingVertical: 4 }}>
              <T size={11} muted>{d}</T>
            </View>
          ))}
          {Array.from({ length: lead }).map((_, i) => (
            <View key={`b${i}`} style={{ width: `${100 / 7}%` as const, height: 40 }} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const k = dayKey(new Date(now.getFullYear(), now.getMonth(), i + 1));
            const isMet = met.has(k);
            const isDeed = !isMet && deeds.has(k);
            const isFrozen = frozen.has(k);
            const isPaused = paused.has(k);
            const isToday = k === today;
            const bg = isMet ? t.accent : isDeed ? t.accentSoft : isFrozen ? '#BFDBFE' : isPaused ? t.divider : 'transparent';
            const fg = isMet ? t.onAccent : isDeed ? t.accentText : isFrozen ? '#1E3A8A' : k > today ? t.textFaint : t.text;
            return (
              <View key={k} style={{ width: `${100 / 7}%` as const, height: 40, padding: 2 }}>
                <View style={{ flex: 1, borderRadius: 8, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', borderWidth: isToday ? 2 : 0, borderColor: t.text }}>
                  <T size={12} weight="semibold" color={fg}>{i + 1}</T>
                </View>
              </View>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }}>
          <Legend color={t.accent} label="Read Quran" />
          <Legend color={t.accentSoft} label="Good deed" />
          <Legend color="#BFDBFE" label="Freeze" />
          <Legend color={t.divider} label="Paused" />
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Stat value={(pagesThisMonth / Math.max(1, daysSoFar)).toFixed(1)} label="Pages a day" />
        <Stat value={String(progress.khatamsDone)} label="Khatams" />
        <Stat value={`${Math.floor((progress.khatam.length / 6236) * 100)}%`} label="Current khatam" />
      </View>

      <Card style={{ paddingVertical: 0 }}>
        <ToggleRow label="Pause my streak" sub="Private. Paused days don’t break your streak." value={progress.paused} onChange={setPaused} last />
      </Card>
      <T size={12} muted>Two missed days a month are covered automatically by freezes.</T>
    </Screen>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <T size={11} muted>{label}</T>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Card style={{ flex: 1, gap: 2, padding: 12 }}>
      <T size={18} weight="bold">{value}</T>
      <T size={11} muted>{label}</T>
    </Card>
  );
}
