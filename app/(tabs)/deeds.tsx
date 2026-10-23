import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, ProgressBar, Screen, T, ToggleRow } from '../../src/components/ui';
import { Icon, type IconName } from '../../src/components/Icon';
import { useTheme } from '../../src/theme';
import { useApp } from '../../src/state/AppState';
import { useContent } from '../../src/state/ContentState';
import { goalTotals, type UmmahGoal } from '../../src/lib/content';
import { requestPermission } from '../../src/lib/notifications';
import { ensureAnonymousSession, supabase } from '../../src/lib/supabase';
import { dayKey } from '../../src/lib/dates';
import { track } from '../../src/lib/analytics';
import { normalizeSadaqah, rollSadaqah } from '../../src/state/model';

export default function Deeds() {
  const t = useTheme();
  const { settings, updateSettings, progress } = useApp();
  const { content } = useContent();
  const today = dayKey();
  const goals = content.ummah_goals.filter((g) => g.starts_on <= today && g.ends_on >= today);

  const toggleReminder = async (key: string, on: boolean) => {
    if (on && !(await requestPermission())) {
      Alert.alert('Notifications are off', 'Allow notifications for Khalad in your phone settings to get this reminder.');
      return;
    }
    updateSettings({ reminders: { ...settings.reminders, [key]: on } });
    track('reminder_toggle', { key, on });
  };

  const thisMonth = today.slice(0, 7);
  const sadaqah = rollSadaqah(normalizeSadaqah(progress.sadaqah), thisMonth);
  const sadaqahActive = sadaqah.target > 0;

  return (
    <Screen>
      <View>
        <T size={26} weight="bold" accessibilityRole="header">Deeds</T>
        <T size={13} muted>Small acts that last. Private to you.</T>
      </View>

      {goals.map((g) => (
        <GoalCard key={g.id} goal={g} />
      ))}

      <Card style={{ paddingVertical: 6 }}>
        <T size={13} weight="bold" style={{ paddingTop: 8 }}>Sunnah reminders</T>
        {content.sunnah_reminders.map((r, i) => (
          <ToggleRow
            key={r.key}
            label={r.title}
            sub={r.subtitle ?? undefined}
            value={!!settings.reminders[r.key]}
            onChange={(v) => toggleReminder(r.key, v)}
            last={i === content.sunnah_reminders.length - 1}
          />
        ))}
      </Card>

      <Pressable accessibilityRole="button" onPress={() => router.push('/sadaqah')}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <T size={13} weight="bold">Secret sadaqah</T>
            <T size={12} muted>Only you see this</T>
          </View>
          {sadaqahActive ? (
            <>
              <ProgressBar value={sadaqah.paid / sadaqah.target} color={t.accent} track={t.divider} />
              <T size={12} muted>{`${sadaqah.currency} ${sadaqah.paid.toLocaleString()} of ${sadaqah.target.toLocaleString()} this month`}</T>
            </>
          ) : (
            <T size={13} muted>{sadaqah.paid > 0 ? `${sadaqah.currency} ${sadaqah.paid.toLocaleString()} this month` : 'Set a private monthly goal and log what you give.'}</T>
          )}
        </Card>
      </Pressable>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Shortcut icon="heart" title="Duas" sub="For daily moments" onPress={() => router.push('/duas')} />
        <Shortcut icon="beads" title="Tasbih" sub="Tap to count" onPress={() => router.push('/tasbih')} />
      </View>
      {content.adhkar_sets.some((s) => s.key === 'after_salah') ? (
        <Shortcut icon="check-circle" title="After salah" sub="Adhkar after the fard prayer" onPress={() => router.push('/adhkar/after_salah')} />
      ) : null}
    </Screen>
  );
}

function Shortcut({ icon, title, sub, onPress }: { icon: IconName; title: string; sub: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.7 : 1 })}>
      <Card style={{ minHeight: 76, gap: 4 }}>
        <Icon name={icon} size={20} color={t.accent} />
        <T size={14} weight="semibold">{title}</T>
        <T size={12} muted>{sub}</T>
      </Card>
    </Pressable>
  );
}

function GoalCard({ goal }: { goal: UmmahGoal }) {
  const t = useTheme();
  const [total, setTotal] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [thanks, setThanks] = useState(false);

  const load = useCallback(async () => {
    const totals = await goalTotals();
    setTotal(totals[goal.id] ?? 0);
  }, [goal.id]);

  useEffect(() => {
    load();
  }, [load]);

  const contribute = async () => {
    setBusy(true);
    try {
      if (!(await ensureAnonymousSession())) throw new Error('offline');
      const { data, error } = await supabase.rpc('contribute', { p_goal: goal.id, p_count: 1 });
      if (error) throw error;
      setTotal(Number(data));
      setThanks(true);
      setTimeout(() => setThanks(false), 1800);
      track('ummah_goal_contribute', { goal: goal.id });
    } catch {
      Alert.alert('Couldn’t add right now', 'Please check your internet connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card inverse style={{ gap: 10 }}>
      <T size={11} weight="bold" color={t.progress} style={{ letterSpacing: 0.6 }}>UMMAH GOAL</T>
      <T size={16} weight="bold" color={t.inverseText}>{goal.title}</T>
      {goal.subtitle ? <T size={12} color={t.inverseMuted}>{goal.subtitle}</T> : null}
      <ProgressBar value={total ? total / goal.target : 0} color={t.progress} track={t.dark ? '#D4D4D4' : 'rgba(255,255,255,0.2)'} />
      <T size={12} color={t.inverseMuted}>
        {total === null ? 'Loading…' : `${total.toLocaleString()} of ${Number(goal.target).toLocaleString()} ${goal.unit}`}
      </T>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {goal.surah ? (
          <Button
            label="Read it"
            variant="inverseOnDark"
            style={{ flex: 1 }}
            onPress={() => router.push(`/surah/${goal.surah}${goal.verse_from ? `?verse=${goal.verse_from}` : ''}`)}
          />
        ) : null}
        <Button label={thanks ? 'Counted · JazakAllahu khayran' : 'I did it'} variant="inverseOnDark" style={{ flex: 1 }} loading={busy} onPress={contribute} />
      </View>
    </Card>
  );
}
