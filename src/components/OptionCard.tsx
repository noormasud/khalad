import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme';
import { T } from './ui';

export function OptionCard({
  title,
  sub,
  selected,
  onPress,
  compact,
}: {
  title: string;
  sub?: string;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: compact ? 1 : undefined,
        minHeight: compact ? 92 : 72,
        padding: 16,
        borderRadius: 16,
        borderWidth: selected ? 2 : 1.5,
        borderColor: selected ? t.accent : t.border,
        backgroundColor: selected ? t.accentSoft : t.surface,
        flexDirection: compact ? 'column' : 'row',
        alignItems: compact ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: 6,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ gap: 2, flexShrink: 1 }}>
        <T size={compact ? 20 : 16} weight="bold">{title}</T>
        {sub ? <T size={13} muted>{sub}</T> : null}
      </View>
      {!compact ? (
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            borderWidth: selected ? 7 : 2,
            borderColor: selected ? t.accent : t.textFaint,
          }}
        />
      ) : null}
    </Pressable>
  );
}
