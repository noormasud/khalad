import React from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { arabicFonts, type ArabicFontKey, arabicSizes, type ArabicSizeKey, useTheme } from '../theme';
import { useApp } from '../state/AppState';
import { Arabic, Chip, T, ToggleRow } from './ui';

const SIZE_LABEL: Record<ArabicSizeKey, string> = { small: 'S', medium: 'M', large: 'L', extraLarge: 'XL' };

export function ReaderSettings({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useApp();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable accessibilityLabel="Close settings" onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} />
      <View style={{ backgroundColor: t.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: insets.bottom + 16, maxHeight: '80%' }}>
        <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.border, marginTop: 10 }} />
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
          <T size={18} weight="bold">Reading settings</T>

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
                  style={{ padding: 12, borderRadius: 14, borderWidth: on ? 2 : 1, borderColor: on ? t.accent : t.border, backgroundColor: on ? t.accentSoft : t.surface }}
                >
                  <T size={13} weight="bold">{arabicFonts[k].label}</T>
                  <Arabic scale={0.8}>{'بِسْمِ'}</Arabic>
                </Pressable>
              );
            })}
          </View>

          <T size={13} weight="semibold" muted>Text size</T>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(Object.keys(arabicSizes) as ArabicSizeKey[]).map((k) => (
              <Chip key={k} label={SIZE_LABEL[k]} selected={settings.arabicSize === k} onPress={() => updateSettings({ arabicSize: k })} />
            ))}
          </View>

          <ToggleRow label="Show translation" value={settings.showTranslation} onChange={(v) => updateSettings({ showTranslation: v })} />
          {settings.showTranslation ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip label="اردو  Urdu" selected={settings.translationLang === 'ur'} onPress={() => updateSettings({ translationLang: 'ur' })} />
              <Chip label="English" selected={settings.translationLang === 'en'} onPress={() => updateSettings({ translationLang: 'en' })} />
            </View>
          ) : null}
          <ToggleRow
            label="Taraweeh mode"
            sub="Keeps the screen on while you read"
            value={settings.keepAwake}
            onChange={(v) => updateSettings({ keepAwake: v })}
            last
          />
        </ScrollView>
      </View>
    </Modal>
  );
}
