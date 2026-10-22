import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { Button, Card, Chip, Header, ProgressBar, Screen, T } from '../src/components/ui';
import { fonts, useTheme } from '../src/theme';
import { useApp } from '../src/state/AppState';
import { dayKey } from '../src/lib/dates';

const CURRENCIES = ['PKR', 'GBP', 'USD', 'CAD', 'AED', 'SAR'];

function toAmount(s: string): number {
  const n = Number(s.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 1e9) : 0;
}

export default function Sadaqah() {
  const t = useTheme();
  const { progress, updateProgress } = useApp();
  const month = dayKey().slice(0, 7);
  const s = progress.sadaqah.month === month ? progress.sadaqah : { ...progress.sadaqah, month, paid: 0 };
  const [target, setTarget] = useState(s.target ? String(s.target) : '');
  const [add, setAdd] = useState('');

  const save = (patch: Partial<typeof s>) => updateProgress((p) => ({ ...p, sadaqah: { ...s, ...patch } }));

  const inputStyle = { height: 50, borderRadius: 12, borderWidth: 1, borderColor: t.border, paddingHorizontal: 14, fontFamily: fonts.regular, fontSize: 16, color: t.text, backgroundColor: t.surface };

  return (
    <Screen>
      <Header title="Secret sadaqah" subtitle="Only you see this. Nothing leaves your phone." />
      <Card style={{ backgroundColor: t.dark ? t.surface : '#F3EEDC', borderWidth: 0 }}>
        <T size={14} style={{ lineHeight: 22 }}>
          “Those who spend their wealth by night and by day, secretly and publicly, will have their reward with their Lord.”
        </T>
        <T size={12} muted>Al-Baqarah 2:274 (meaning)</T>
      </Card>

      {s.target > 0 ? (
        <Card>
          <ProgressBar value={s.paid / s.target} color={t.accent} track={t.divider} />
          <T size={13}>{`${s.currency} ${s.paid.toLocaleString()} of ${s.target.toLocaleString()} this month`}</T>
          {s.paid >= s.target ? <T size={13} weight="semibold" color={t.accent}>SubhanAllah, goal reached. May Allah accept it.</T> : null}
        </Card>
      ) : null}

      <T size={13} weight="semibold">Currency</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {CURRENCIES.map((c) => (
          <Chip key={c} label={c} selected={s.currency === c} onPress={() => save({ currency: c })} />
        ))}
      </View>

      <T size={13} weight="semibold">Monthly goal</T>
      <TextInput value={target} onChangeText={setTarget} keyboardType="numeric" placeholder="e.g. 5000" placeholderTextColor={t.textFaint} accessibilityLabel="Monthly goal amount" maxLength={10} style={inputStyle} />
      <Button label="Save goal" variant="soft" onPress={() => save({ target: toAmount(target) })} />

      <T size={13} weight="semibold">Add what you gave</T>
      <TextInput value={add} onChangeText={setAdd} keyboardType="numeric" placeholder="Amount" placeholderTextColor={t.textFaint} accessibilityLabel="Amount given" maxLength={10} style={inputStyle} />
      <Button
        label="Add"
        disabled={toAmount(add) <= 0}
        onPress={() => {
          save({ paid: s.paid + toAmount(add) });
          setAdd('');
        }}
      />
    </Screen>
  );
}
