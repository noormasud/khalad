import React, { useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Button, Card, Chip, Header, ProgressBar, Screen, T } from '../src/components/ui';
import { Icon } from '../src/components/Icon';
import { Sheet } from '../src/components/Sheet';
import { fonts, useTheme } from '../src/theme';
import { useApp } from '../src/state/AppState';
import { normalizeSadaqah, previousMonth, rollSadaqah, type Sadaqah } from '../src/state/model';
import { track } from '../src/lib/analytics';

const CURRENCIES = ['PKR', 'GBP', 'USD', 'CAD', 'AED', 'SAR'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const QUICK: Record<string, number[]> = { PKR: [100, 500, 1000, 5000], AED: [10, 50, 100, 500], SAR: [10, 50, 100, 500] };
const MAX = 1e9;

function toAmount(s: string): number {
  const n = Number(s.replace(/[^0-9]/g, ''));
  return Number.isFinite(n) && n > 0 ? Math.min(n, MAX) : 0;
}
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
const monthLabel = (key: string, withYear = false) => {
  const [y, m] = key.split('-').map(Number);
  const name = MONTHS[(m || 1) - 1] ?? '';
  return withYear ? `${name} ${y}` : name;
};

export default function SadaqahScreen() {
  const t = useTheme();
  const { progress, updateProgress, today, markDeed } = useApp();
  const month = today.slice(0, 7);
  const s: Sadaqah = rollSadaqah(normalizeSadaqah(progress.sadaqah), month);

  const [amount, setAmount] = useState('');
  const [flash, setFlash] = useState<number | null>(null);
  const [sheet, setSheet] = useState(false);
  const [draftCur, setDraftCur] = useState(s.currency);
  const [draftGoal, setDraftGoal] = useState('');
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
  }, []);

  const save = (patch: Partial<Sadaqah>) => updateProgress((p) => ({ ...p, sadaqah: { ...rollSadaqah(normalizeSadaqah(p.sadaqah), month), ...patch } }));

  const amt = toAmount(amount);
  const quick = QUICK[s.currency] ?? [5, 10, 20, 50];
  const pct = s.target > 0 ? Math.min(1, s.paid / s.target) : 0;

  const add = () => {
    if (!amt) return;
    updateProgress((p) => {
      const cur = rollSadaqah(normalizeSadaqah(p.sadaqah), month);
      return { ...p, sadaqah: { ...cur, paid: Math.min(MAX, cur.paid + amt) } };
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    track('sadaqah_add');
    markDeed();
    setAmount('');
    setFlash(amt);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 5000);
  };

  const undo = () => {
    if (flash == null) return;
    const n = flash;
    updateProgress((p) => {
      const cur = rollSadaqah(normalizeSadaqah(p.sadaqah), month);
      return { ...p, sadaqah: { ...cur, paid: Math.max(0, cur.paid - n) } };
    });
    setFlash(null);
  };

  const openSheet = () => {
    setDraftCur(s.currency);
    setDraftGoal(s.target ? String(s.target) : '');
    setSheet(true);
  };
  const saveSheet = () => {
    // Only this month's (and therefore future months') goal changes; closed months keep theirs.
    save({ currency: draftCur, target: toAmount(draftGoal) });
    track('sadaqah_goal_set', { currency: draftCur, has_goal: toAmount(draftGoal) > 0 });
    setSheet(false);
  };

  const last = s.history[0];
  const showRecap = !!last && last.month === previousMonth(month) && s.recapSeen !== last.month;

  return (
    <Screen>
      <Header
        title="Secret sadaqah"
        right={
          <Pressable accessibilityRole="button" accessibilityLabel="Sadaqah settings: currency and monthly goal" onPress={openSheet} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -10 }}>
            <Icon name="settings" color={t.text} />
          </Pressable>
        }
      />

      {showRecap && last ? (
        <View style={{ gap: 6, padding: 16, borderRadius: 18, backgroundColor: t.accentSoft, borderWidth: 1, borderColor: t.dark ? t.border : '#CFE6D7' }}>
          <T size={11} weight="bold" color={t.accent} style={{ letterSpacing: 0.6 }}>{`${monthLabel(last.month).toUpperCase()} IS DONE`}</T>
          <T size={16} weight="bold">
            {last.target > 0
              ? `You gave ${last.currency} ${fmt(last.paid)} of ${fmt(last.target)}.${last.paid >= last.target ? ' Alhamdulillah.' : ''}`
              : `You gave ${last.currency} ${fmt(last.paid)}.`}
          </T>
          <T size={13} muted>{`${monthLabel(month)} starts fresh${s.target > 0 ? ' with the same goal' : ''}. May Allah accept it.`}</T>
          <Pressable accessibilityRole="button" onPress={() => save({ recapSeen: last.month })} style={{ alignSelf: 'flex-start', marginTop: 4, height: 36, paddingHorizontal: 14, borderRadius: 10, backgroundColor: t.inverseBg, justifyContent: 'center' }}>
            <T size={13} weight="bold" color={t.inverseText}>Bismillah</T>
          </Pressable>
        </View>
      ) : null}

      {/* Add first: the thing you do most often sits at the top. */}
      <View style={{ gap: 14, padding: 18, borderRadius: 20, backgroundColor: t.inverseBg }}>
        <T size={11} weight="bold" color={t.progress} style={{ letterSpacing: 0.6 }}>{`ADD WHAT YOU GAVE · ${monthLabel(month).toUpperCase()}`}</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 2, borderBottomColor: t.progress, paddingBottom: 4 }}>
          <T size={18} weight="medium" color={t.inverseMuted}>{s.currency}</T>
          <TextInput
            value={amount}
            onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, '').slice(0, 9))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={t.inverseMuted}
            accessibilityLabel={`Amount given, in ${s.currency}`}
            returnKeyType="done"
            onSubmitEditing={add}
            maxLength={9}
            selectionColor={t.progress}
            style={{ flex: 1, minWidth: 0, fontFamily: fonts.bold, fontSize: 38, color: t.inverseText, paddingVertical: 4 }}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {quick.map((v) => (
            <Pressable
              key={v}
              accessibilityRole="button"
              accessibilityLabel={`Add ${fmt(v)}`}
              onPress={() => setAmount(String(Math.min(MAX, amt + v)))}
              style={({ pressed }) => ({ flex: 1, height: 38, borderRadius: 10, borderWidth: 1, borderColor: t.inverseMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
            >
              <T size={13} weight="semibold" color={t.inverseText}>{`+${fmt(v)}`}</T>
            </Pressable>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !amt }}
          disabled={!amt}
          onPress={add}
          style={({ pressed }) => ({
            height: 52,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: amt || flash != null ? t.progress : t.dark ? '#DADADA' : '#2A2A2A',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <T size={15} weight="bold" color={amt || flash != null ? (t.dark ? '#FFFFFF' : '#0B2E19') : t.inverseMuted}>
            {amt ? `Add ${s.currency} ${fmt(amt)}` : flash != null ? 'Added · may Allah accept it' : 'Add'}
          </T>
        </Pressable>
        {flash != null && !amt ? (
          <Pressable accessibilityRole="button" onPress={undo} style={{ alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 4 }}>
            <T size={13} weight="semibold" color={t.inverseMuted}>{`Undo ${s.currency} ${fmt(flash)}`}</T>
          </Pressable>
        ) : null}
      </View>

      {s.target > 0 ? (
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <T size={13} weight="bold">This month</T>
            <T size={12} muted>Only you see this</T>
          </View>
          <ProgressBar value={pct} color={t.accent} track={t.divider} height={8} />
          <T size={13}>{`${s.currency} ${fmt(s.paid)} of ${fmt(s.target)} · ${Math.round(pct * 100)}%`}</T>
          {s.paid >= s.target ? <T size={13} weight="semibold" color={t.accent}>Goal reached, alhamdulillah. May Allah accept it.</T> : null}
        </Card>
      ) : (
        <Pressable accessibilityRole="button" onPress={openSheet}>
          <Card>
            <T size={13} weight="bold">{s.paid > 0 ? `${s.currency} ${fmt(s.paid)} this month` : 'This month'}</T>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <T size={13} muted style={{ flex: 1 }}>Set a private monthly goal and choose your currency</T>
              <Icon name="chevron-right" size={18} color={t.textFaint} />
            </View>
          </Card>
        </Pressable>
      )}

      {s.history.length > 0 ? (
        <Card style={{ paddingVertical: 4 }}>
          <T size={13} weight="bold" style={{ paddingTop: 10, paddingBottom: 4 }}>Earlier months</T>
          {s.history.slice(0, 12).map((h, i, arr) => {
            const met = h.target > 0 && h.paid >= h.target;
            return (
              <View
                key={h.month}
                accessibilityLabel={`${monthLabel(h.month, true)}: ${h.currency} ${fmt(h.paid)}${h.target ? ` of ${fmt(h.target)}` : ''}${met ? ', goal reached' : ''}`}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 46, borderBottomWidth: i === arr.length - 1 ? 0 : 1, borderBottomColor: t.divider }}
              >
                <T size={14}>{monthLabel(h.month, h.month.slice(0, 4) !== month.slice(0, 4))}</T>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <T size={13} muted>{`${h.currency} ${fmt(h.paid)}${h.target ? ` / ${fmt(h.target)}` : ''}`}</T>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: met ? t.accent : t.border }} />
                </View>
              </View>
            );
          })}
        </Card>
      ) : null}

      <View style={{ gap: 4, paddingHorizontal: 8, paddingTop: 4 }}>
        <T size={13} muted style={{ textAlign: 'center', lineHeight: 21 }}>
          “Those who spend their wealth by night and by day, secretly and publicly, will have their reward with their Lord.”
        </T>
        <T size={11} faint style={{ textAlign: 'center' }}>Al-Baqarah 2:274 (meaning) · Stays on your phone, never shared.</T>
      </View>

      <Sheet visible={sheet} onClose={() => setSheet(false)} title="Sadaqah settings">
        <T size={13} weight="semibold">Currency</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CURRENCIES.map((c) => (
            <Chip key={c} label={c} selected={draftCur === c} onPress={() => setDraftCur(c)} />
          ))}
        </View>
        {draftCur !== s.currency && s.paid > 0 ? (
          <T size={12} muted>{`Amounts aren’t converted. This month’s ${fmt(s.paid)} will show as ${draftCur}.`}</T>
        ) : null}
        <T size={13} weight="semibold">Monthly goal</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 52, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: t.border, backgroundColor: t.surface }}>
          <T size={14} muted>{draftCur}</T>
          <TextInput
            value={draftGoal}
            onChangeText={(v) => setDraftGoal(v.replace(/[^0-9]/g, '').slice(0, 9))}
            keyboardType="number-pad"
            placeholder="e.g. 5000"
            placeholderTextColor={t.textFaint}
            accessibilityLabel="Monthly goal amount"
            returnKeyType="done"
            onSubmitEditing={saveSheet}
            maxLength={9}
            style={{ flex: 1, minWidth: 0, fontFamily: fonts.medium, fontSize: 16, color: t.text }}
          />
        </View>
        <T size={12} muted>Applies to this month and the months ahead. Past months keep their own goal. Leave empty for no goal.</T>
        <Button label="Save" onPress={saveSheet} />
        <Button label="Cancel" variant="ghost" onPress={() => setSheet(false)} />
      </Sheet>
    </Screen>
  );
}
