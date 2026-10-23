import React, { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { ARABIC_SIZE_ORDER, type ArabicSizeKey, useTheme } from '../theme';
import { useApp } from '../state/AppState';
import { T } from '../components/ui';

const LABEL: Record<ArabicSizeKey, string> = { small: 'Small', medium: 'Medium', large: 'Large', extraLarge: 'Extra large', huge: 'Huge' };
const STEP = 1.2; // pinch this much further to move one size

/**
 * Pinch to change the reading size. Moves in steps (S → M → L …) so the text
 * re-flows a few times per pinch rather than every frame. Returns the gesture
 * (wrap content in <GestureDetector>) and a small overlay showing the size.
 */
export function usePinchTextSize() {
  const t = useTheme();
  const { settings, updateSettings } = useApp();
  const [hint, setHint] = useState<ArabicSizeKey | null>(null);
  const base = useRef(1);
  const current = useRef(1);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const idxNow = Math.max(0, ARABIC_SIZE_ORDER.indexOf(settings.arabicSize));
  const idxRef = useRef(idxNow);
  idxRef.current = idxNow;

  const gesture = useMemo(
    () =>
      Gesture.Pinch()
        .runOnJS(true)
        .onStart(() => {
          base.current = idxRef.current;
          current.current = idxRef.current;
          if (hideTimer.current) clearTimeout(hideTimer.current);
          setHint(ARABIC_SIZE_ORDER[idxRef.current]);
        })
        .onUpdate((e) => {
          if (!Number.isFinite(e.scale) || e.scale <= 0) return;
          const steps = Math.round(Math.log(e.scale) / Math.log(STEP));
          const next = Math.min(ARABIC_SIZE_ORDER.length - 1, Math.max(0, base.current + steps));
          if (next === current.current) return;
          current.current = next;
          const key = ARABIC_SIZE_ORDER[next];
          updateSettings({ arabicSize: key });
          setHint(key);
          Haptics.selectionAsync().catch(() => undefined);
        })
        .onFinalize(() => {
          if (hideTimer.current) clearTimeout(hideTimer.current);
          hideTimer.current = setTimeout(() => setHint(null), 700);
        }),
    [updateSettings],
  );

  const overlay = hint ? (
    <View pointerEvents="none" style={{ position: 'absolute', top: 12, left: 0, right: 0, alignItems: 'center' }}>
      <View style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, backgroundColor: t.inverseBg }}>
        <T size={13} weight="bold" color={t.inverseText}>{`Text size · ${LABEL[hint]}`}</T>
      </View>
    </View>
  ) : null;

  return { gesture, overlay };
}
