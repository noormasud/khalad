import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Switch,
  Text,
  TextProps,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { arabicFonts, arabicSizes, fonts, useTheme } from '../theme';
import { useApp } from '../state/AppState';
import { Icon, type IconName } from './Icon';

type Weight = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';

export function T({
  size = 15,
  weight = 'regular',
  muted,
  faint,
  color,
  style,
  ...rest
}: TextProps & { size?: number; weight?: Weight; muted?: boolean; faint?: boolean; color?: string }) {
  const t = useTheme();
  return (
    <Text
      {...rest}
      maxFontSizeMultiplier={1.4}
      style={[
        { fontFamily: fonts[weight], fontSize: size, lineHeight: Math.round(size * 1.45), color: color ?? (faint ? t.textFaint : muted ? t.textMuted : t.text) },
        style,
      ]}
    />
  );
}

/** Arabic text in the user's chosen font and size. Shown exactly as supplied. */
export function Arabic({ children, scale = 1, center, style }: { children: string; scale?: number; center?: boolean; style?: StyleProp<any> }) {
  const t = useTheme();
  const { settings } = useApp();
  const font = arabicFonts[settings.arabicFont] ?? arabicFonts.noto;
  const size = (arabicSizes[settings.arabicSize] ?? arabicSizes.medium) * scale;
  return (
    <Text
      maxFontSizeMultiplier={1.3}
      style={[
        {
          fontFamily: font.family,
          fontSize: size,
          lineHeight: Math.round(size * 1.95),
          color: t.text,
          writingDirection: 'rtl',
          textAlign: center ? 'center' : 'right',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Screen({
  children,
  scroll = true,
  padded = true,
  edges = ['top'],
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: ('top' | 'bottom')[];
}) {
  const t = useTheme();
  const inner = padded ? { paddingHorizontal: 20, paddingBottom: 28, gap: 14 } : undefined;
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: t.bg }}>
      {scroll ? (
        <ScrollView contentContainerStyle={[{ paddingTop: 12 }, inner]} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, paddingTop: 12 }, inner]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Header({ title, subtitle, back = true, right }: { title: string; subtitle?: string; back?: boolean; right?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: back ? -12 : 0 }}>
      {back && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="chevron-left" color={t.text} />
        </Pressable>
      )}
      <View style={{ flex: 1 }}>
        <T size={20} weight="bold" accessibilityRole="header">{title}</T>
        {subtitle ? <T size={12} muted>{subtitle}</T> : null}
      </View>
      {right}
    </View>
  );
}

export function Card({ children, style, inverse }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; inverse?: boolean }) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: inverse ? t.inverseBg : t.surface,
          borderRadius: 18,
          borderWidth: inverse ? 0 : StyleSheet.hairlineWidth * 2,
          borderColor: t.border,
          padding: 16,
          gap: 8,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'accent' | 'soft' | 'ghost' | 'inverseOnDark';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const bg = { primary: t.inverseBg, accent: t.accent, soft: t.accentSoft, ghost: 'transparent', inverseOnDark: t.bg }[variant];
  const fg = { primary: t.inverseText, accent: t.onAccent, soft: t.accentText, ghost: t.text, inverseOnDark: t.text }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: variant === 'ghost' ? 44 : 52,
          borderRadius: 14,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 18,
          opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <T size={15} weight="bold" color={fg}>{label}</T>}
    </Pressable>
  );
}

export function Row({
  label,
  value,
  onPress,
  icon,
  last,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  icon?: IconName;
  last?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        minHeight: 52,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth * 2,
        borderBottomColor: t.divider,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      {icon ? <Icon name={icon} size={20} color={t.textMuted} /> : null}
      <T size={14} style={{ flex: 1 }}>{label}</T>
      {value ? <T size={12} muted numberOfLines={1} style={{ maxWidth: '55%', textAlign: 'right' }}>{value}</T> : null}
      {onPress ? <Icon name="chevron-right" size={18} color={t.textFaint} /> : null}
    </Pressable>
  );
}

export function ToggleRow({ label, sub, value, onChange, last }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void; last?: boolean }) {
  const t = useTheme();
  return (
    <View
      style={{
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 6,
        borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth * 2,
        borderBottomColor: t.divider,
      }}
    >
      <View style={{ flex: 1 }}>
        <T size={14} weight="medium">{label}</T>
        {sub ? <T size={12} muted>{sub}</T> : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: t.accent, false: t.border }}
        thumbColor={t.surface}
      />
    </View>
  );
}

export function ProgressBar({ value, color, track, height = 6 }: { value: number; color: string; track: string; height?: number }) {
  const pct = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}>
      <View style={{ width: `${Math.round(pct * 1000) / 10}%` as const, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return <T size={14} weight="bold" style={{ marginTop: 6 }}>{children}</T>;
}

/** Calm three-dot loader used across the app (no spinners on content screens). */
export function Dots({ color }: { color?: string }) {
  const t = useTheme();
  const c = color ?? t.accent;
  const anims = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current;
  useEffect(() => {
    const loops = anims.map((a, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(a, { toValue: 1, duration: 420, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(a, { toValue: 0.3, duration: 420, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.delay((2 - i) * 160),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [anims]);
  return (
    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }} accessibilityRole="progressbar" accessibilityLabel="Loading">
      {anims.map((a, i) => (
        <Animated.View key={i} style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c, opacity: a, transform: [{ scale: a }] }} />
      ))}
    </View>
  );
}

export function Loading({ label }: { label?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 48 }}>
      <Dots />
      {label ? <T size={14} muted>{label}</T> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 48, paddingHorizontal: 12 }}>
      <T size={15} weight="semibold" style={{ textAlign: 'center' }}>Couldn’t load this right now</T>
      <T size={13} muted style={{ textAlign: 'center' }}>{message}</T>
      {onRetry ? <Button label="Try again" variant="soft" onPress={onRetry} style={{ alignSelf: 'stretch' }} /> : null}
    </View>
  );
}

export function TickCircle({ state }: { state: 'done' | 'now' | 'later' }) {
  const t = useTheme();
  if (state === 'done')
    return (
      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="check" size={14} strokeWidth={3} color={t.onAccent} />
      </View>
    );
  return (
    <View
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: state === 'now' ? 6 : 2,
        borderColor: state === 'now' ? t.text : t.border,
        backgroundColor: t.surface,
      }}
    />
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minHeight: 40,
        paddingHorizontal: 14,
        borderRadius: 12,
        justifyContent: 'center',
        backgroundColor: selected ? t.inverseBg : t.surface,
        borderWidth: 1.5,
        borderColor: selected ? t.inverseBg : t.border,
      }}
    >
      <T size={13} weight="semibold" color={selected ? t.inverseText : t.text}>{label}</T>
    </Pressable>
  );
}
