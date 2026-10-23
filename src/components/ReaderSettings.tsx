import React from 'react';
import { Pressable, View } from 'react-native';
import { arabicFonts, type ArabicFontKey, ARABIC_SIZE_ORDER, type ArabicSizeKey, useTheme } from '../theme';
import { useApp } from '../state/AppState';
import { Sheet } from './Sheet';
import { Arabic, Chip, T, ToggleRow } from './ui';

const SIZE_LABEL: Record<ArabicSizeKey, string> = { small: 'S', medium: 'M', large: 'L', extraLarge: 'XL', huge: 'XXL' };

/** Reading settings sheet. `adhkar` mode swaps the Quran-only options for adhkar ones. */
export function ReaderSettings({ visible, onClose, mode = 'quran' }: { visible: boolean; onClose: () => void; mode?: 'quran' | 'adhkar' }) {
  const t = useTheme();
  const { settings, updateSettings } = useApp();
  const showLang = mode === 'quran' ? settings.showTranslation : settings.adhkarMeaning;
  return (
    <Sheet visible={visible} onClose={onClose} title="Reading settings">
      <T size={13} weight="semibold" muted>Text size · or pinch the text</T>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {ARABIC_SIZE_ORDER.map((k) => (
          <Chip key={k} label={SIZE_LABEL[k]} selected={settings.arabicSize === k} onPress={() => updateSettings({ arabicSize: k })} />
        ))}
      </View>

      <T size={13} weight="semibold" muted>Arabic font</T>
      <View style={{ gap: 8 }}>
        {(Object.keys(arabicFonts) as ArabicFontKey[]).map((k) => {
          const on = settings.arabicFont === k;
          return (
            <Pressable
              key={k}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => updateSettings({ arabicFont: k })}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, borderWidth: on ? 2 : 1, borderColor: on ? t.accent : t.border, backgroundColor: on ? t.accentSoft : t.surface }}
            >
              <T size={13} weight="bold">{arabicFonts[k].label}</T>
              <Arabic scale={0.7}>{'بِسْمِ'}</Arabic>
            </Pressable>
          );
        })}
      </View>

      {mode === 'quran' ? (
        <ToggleRow label="Show translation" value={settings.showTranslation} onChange={(v) => updateSettings({ showTranslation: v })} />
      ) : (
        <>
          <ToggleRow label="Show transliteration" value={settings.adhkarTransliteration} onChange={(v) => updateSettings({ adhkarTransliteration: v })} />
          <ToggleRow label="Always show meaning" sub="Off: tap “Meaning” on a card when you need it" value={settings.adhkarMeaning} onChange={(v) => updateSettings({ adhkarMeaning: v })} />
        </>
      )}
      {showLang ? (
        <View style={{ gap: 8 }}>
          {mode === 'adhkar' ? <T size={12} muted>Language for Quran verses (duas are in English)</T> : null}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip label="اردو  Urdu" selected={settings.translationLang === 'ur'} onPress={() => updateSettings({ translationLang: 'ur' })} />
            <Chip label="English" selected={settings.translationLang === 'en'} onPress={() => updateSettings({ translationLang: 'en' })} />
          </View>
        </View>
      ) : null}
      {mode === 'quran' ? (
        <ToggleRow label="Taraweeh mode" sub="Keeps the screen on while you read" value={settings.keepAwake} onChange={(v) => updateSettings({ keepAwake: v })} last />
      ) : null}
    </Sheet>
  );
}
