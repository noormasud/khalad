import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { T } from './ui';

/**
 * Bottom sheet: dims the screen, slides up, closes on backdrop tap or the back button.
 * Lifts itself above the keyboard only when the keyboard actually covers it.
 */
export function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const ref = useRef<View>(null);
  const [lift, setLift] = useState(0);

  useEffect(() => {
    if (!visible) {
      setLift(0);
      return;
    }
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      ref.current?.measureInWindow((_x, y, _w, h) => {
        const overlap = y + h - e.endCoordinates.screenY;
        setLift(overlap > 0 ? overlap : 0);
      });
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setLift(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable accessibilityLabel="Close" onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} />
      <View
        ref={ref}
        accessibilityViewIsModal
        style={{
          backgroundColor: t.surface,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingBottom: insets.bottom + 16 + lift,
          maxHeight: '85%',
        }}
      >
        <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.border, marginTop: 10 }} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 14 }}>
          {title ? <T size={18} weight="bold" accessibilityRole="header">{title}</T> : null}
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}
