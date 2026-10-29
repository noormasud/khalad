import React from 'react';
import { Pressable, View } from 'react-native';
import { T, Button } from './ui';
import { Sheet } from './Sheet';
import { useTheme } from '../theme';
import { GRADE_INFO, GRADE_LABEL, type RuqyahGrade, type RuqyahItem } from '../data/ruqyah';

function pillColors(grade: RuqyahGrade, dark: boolean): { bg: string; fg: string; border?: string } {
  switch (grade) {
    case 'sahih':
      return dark ? { bg: '#13271B', fg: '#86EFAC' } : { bg: '#EAF4EE', fg: '#14532D' };
    case 'hasan':
      return dark ? { bg: '#262626', fg: '#D4D4D4' } : { bg: '#F0F0EE', fg: '#3D3D3D' };
    case 'daif':
    case 'disputed':
      return dark ? { bg: '#3A2A0A', fg: '#FCD34D' } : { bg: '#FEF3C7', fg: '#78350F' };
    case 'athar':
      return dark ? { bg: 'transparent', fg: '#B3B3B3', border: '#3D3D3D' } : { bg: 'transparent', fg: '#5C5C5C', border: '#D4D4D4' };
  }
}

/** Small grade label. Tapping it explains what the grade means. */
export function GradePill({ grade, onPress }: { grade: RuqyahGrade; onPress?: () => void }) {
  const t = useTheme();
  const c = pillColors(grade, t.dark);
  const label = GRADE_LABEL[grade];
  const body = (
    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: c.bg, borderWidth: c.border ? 1 : 0, borderColor: c.border }}>
      <T size={10} weight="bold" color={c.fg} style={{ letterSpacing: 0.3 }}>{label}</T>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Graded ${label.toLowerCase()}. What does this mean?`} onPress={onPress} hitSlop={10}>
      {body}
    </Pressable>
  );
}

/** "What the grades mean", naming who graded the item that was tapped. */
export function GradesSheet({ item, onClose }: { item: RuqyahItem | null; onClose: () => void }) {
  const t = useTheme();
  const shown = GRADE_INFO.filter((g) => g.grade !== 'athar' || item?.grade === 'athar');
  return (
    <Sheet visible={!!item} onClose={onClose} title="What the grades mean">
      {shown.map((g) => (
        <View key={g.grade} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <View style={{ width: 92, alignItems: 'flex-start', paddingTop: 2 }}>
            <GradePill grade={g.grade} />
          </View>
          <T size={13} muted style={{ flex: 1, lineHeight: 19 }}>{g.text}</T>
        </View>
      ))}
      {item?.gradeNote ? (
        <View style={{ padding: 12, borderRadius: 12, backgroundColor: t.bg, borderWidth: 1, borderColor: t.border, gap: 4 }}>
          <T size={12} weight="bold">{`This one: ${item.title}`}</T>
          <T size={12} muted style={{ lineHeight: 18 }}>{item.gradeNote}</T>
        </View>
      ) : null}
      <T size={11} faint>Grades are as shown on sunnah.com, with the scholar who gave them.</T>
      <Button label="Got it" onPress={onClose} />
    </Sheet>
  );
}
