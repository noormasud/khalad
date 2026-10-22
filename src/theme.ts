import { useColorScheme } from 'react-native';
import { useApp } from './state/AppState';

export type Theme = {
  dark: boolean;
  bg: string;
  surface: string;
  border: string;
  divider: string;
  text: string;
  textMuted: string;
  textFaint: string;
  inverseBg: string;
  inverseText: string;
  inverseMuted: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  onAccent: string;
  progress: string;
  streak: string;
  danger: string;
};

const light: Theme = {
  dark: false,
  bg: '#FAFAF8',
  surface: '#FFFFFF',
  border: '#E4E4E4',
  divider: '#F0F0EE',
  text: '#141414',
  textMuted: '#5C5C5C',
  textFaint: '#8A8A8A',
  inverseBg: '#141414',
  inverseText: '#FFFFFF',
  inverseMuted: '#D4D4D4',
  accent: '#1B7F47',
  accentSoft: '#EAF4EE',
  accentText: '#14532D',
  onAccent: '#FFFFFF',
  progress: '#4ADE80',
  streak: '#C2410C',
  danger: '#B91C1C',
};

const dark: Theme = {
  dark: true,
  bg: '#0E0E0E',
  surface: '#1A1A1A',
  border: '#2E2E2E',
  divider: '#242424',
  text: '#F5F5F5',
  textMuted: '#B3B3B3',
  textFaint: '#8C8C8C',
  inverseBg: '#F5F5F5',
  inverseText: '#141414',
  inverseMuted: '#4A4A4A',
  accent: '#4ADE80',
  accentSoft: '#13271B',
  accentText: '#86EFAC',
  onAccent: '#0E0E0E',
  progress: '#1B7F47',
  streak: '#FB923C',
  danger: '#F87171',
};

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const { settings } = useApp();
  const mode = settings.theme === 'system' ? scheme : settings.theme;
  return mode === 'dark' ? dark : light;
}

export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
};

export const arabicFonts = {
  noto: { label: 'Noto Naskh', family: 'NotoNaskhArabic_400Regular', bold: 'NotoNaskhArabic_700Bold' },
  amiri: { label: 'Amiri', family: 'Amiri_400Regular', bold: 'Amiri_700Bold' },
  scheherazade: { label: 'Scheherazade', family: 'ScheherazadeNew_400Regular', bold: 'ScheherazadeNew_700Bold' },
} as const;

export type ArabicFontKey = keyof typeof arabicFonts;

export const arabicSizes = { small: 24, medium: 28, large: 32, extraLarge: 36 } as const;
export type ArabicSizeKey = keyof typeof arabicSizes;
