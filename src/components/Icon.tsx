import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'home' | 'book' | 'check-circle' | 'more' | 'flame' | 'pin' | 'chevron-right' | 'chevron-left'
  | 'check' | 'close' | 'settings' | 'compass' | 'moon' | 'heart' | 'lock' | 'bell' | 'search'
  | 'plus' | 'minus' | 'info' | 'sun' | 'beads';

type Props = { name: IconName; size?: number; color: string; strokeWidth?: number };

export function Icon({ name, size = 22, color, strokeWidth = 2 }: Props) {
  const p = { stroke: color, strokeWidth, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {name === 'home' && <Path {...p} d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />}
      {name === 'book' && (
        <>
          <Path {...p} d="M2 5c3-1 7-1 10 1 3-2 7-2 10-1v14c-3-1-7-1-10 1-3-2-7-2-10-1z" />
          <Path {...p} d="M12 6v14" />
        </>
      )}
      {name === 'check-circle' && (
        <>
          <Circle {...p} cx={12} cy={12} r={9} />
          <Path {...p} d="M8 12l3 3 5-6" />
        </>
      )}
      {name === 'more' && (
        <>
          <Circle cx={5} cy={12} r={1.6} fill={color} />
          <Circle cx={12} cy={12} r={1.6} fill={color} />
          <Circle cx={19} cy={12} r={1.6} fill={color} />
        </>
      )}
      {name === 'flame' && <Path {...p} d="M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-6 1 1 2 2 3 2 0-2-1-4 0-6z" />}
      {name === 'pin' && (
        <>
          <Path {...p} d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" />
          <Circle {...p} cx={12} cy={10} r={2.5} />
        </>
      )}
      {name === 'chevron-right' && <Path {...p} d="M9 6l6 6-6 6" />}
      {name === 'chevron-left' && <Path {...p} d="M15 18l-6-6 6-6" />}
      {name === 'check' && <Path {...p} d="M5 12l5 5 9-10" />}
      {name === 'close' && <Path {...p} d="M6 6l12 12M18 6L6 18" />}
      {name === 'settings' && (
        <>
          <Path {...p} d="M4 7h10M18 7h2M4 17h4M12 17h8" />
          <Circle {...p} cx={16} cy={7} r={2} />
          <Circle {...p} cx={10} cy={17} r={2} />
        </>
      )}
      {name === 'compass' && (
        <>
          <Circle {...p} cx={12} cy={12} r={9} />
          <Path {...p} d="M15.5 8.5l-2 5-5 2 2-5z" />
        </>
      )}
      {name === 'moon' && <Path {...p} d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />}
      {name === 'sun' && (
        <>
          <Circle {...p} cx={12} cy={12} r={4} />
          <Path {...p} d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </>
      )}
      {name === 'heart' && <Path {...p} d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />}
      {name === 'lock' && (
        <>
          <Rect {...p} x={5} y={11} width={14} height={10} rx={2} />
          <Path {...p} d="M8 11V7a4 4 0 0 1 8 0v4" />
        </>
      )}
      {name === 'bell' && <Path {...p} d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4" />}
      {name === 'search' && (
        <>
          <Circle {...p} cx={11} cy={11} r={7} />
          <Path {...p} d="M20 20l-3.5-3.5" />
        </>
      )}
      {name === 'plus' && <Path {...p} d="M12 5v14M5 12h14" />}
      {name === 'minus' && <Path {...p} d="M5 12h14" />}
      {name === 'info' && (
        <>
          <Circle {...p} cx={12} cy={12} r={9} />
          <Path {...p} d="M12 11v5M12 8h.01" />
        </>
      )}
      {name === 'beads' && (
        <>
          <Circle {...p} cx={12} cy={5} r={2} />
          <Circle {...p} cx={7} cy={9} r={2} />
          <Circle {...p} cx={17} cy={9} r={2} />
          <Circle {...p} cx={8} cy={15} r={2} />
          <Circle {...p} cx={16} cy={15} r={2} />
          <Path {...p} d="M12 17v5" />
        </>
      )}
    </Svg>
  );
}
