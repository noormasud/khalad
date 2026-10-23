import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetData } from './data';

export const WIDGET_NAMES = ['HadithOfDay', 'TodayReading'] as const;
export type WidgetName = (typeof WIDGET_NAMES)[number];

type Hex = `#${string}`;
const PALETTE: Record<'light' | 'dark', { bg: Hex; label: Hex; text: Hex; muted: Hex }> = {
  light: { bg: '#FFFFFF', label: '#1B7F47', text: '#141414', muted: '#5C5C5C' },
  dark: { bg: '#1C2420', label: '#8FD4A8', text: '#FFFFFF', muted: '#C9D1CC' },
};

/** Calm 2×2 card: one verified hadith or sunnah a day. Follows the phone's light/dark theme. */
export function HadithWidget({ data, mode }: { data: WidgetData; mode: 'light' | 'dark' }) {
  const c = PALETTE[mode];
  const d = data.daily;
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel={d ? `${d.kind === 'sunnah' ? 'Sunnah' : 'Hadith'} of the day. ${d.text}. ${d.reference ?? ''}` : 'Khalad'}
      style={{ height: 'match_parent', width: 'match_parent', backgroundColor: c.bg, borderRadius: 22, padding: 16, flexDirection: 'column', justifyContent: 'space-between' }}
    >
      <TextWidget text={d?.kind === 'sunnah' ? 'Sunnah of the day' : 'Hadith of the day'} style={{ fontSize: 11, fontWeight: '600', color: c.label }} />
      <TextWidget
        text={d ? `“${d.text.replace(/^["“]|["”]$/g, '')}”` : 'Open Khalad for today’s reminder.'}
        maxLines={6}
        truncate="END"
        style={{ fontSize: 13, fontWeight: '500', color: c.text, lineHeight: 18 }}
      />
      <TextWidget text={d?.reference ?? ''} maxLines={1} truncate="END" style={{ fontSize: 11, color: c.muted }} />
    </FlexWidget>
  );
}

/** Black reading card: today's goal, where to continue, and the streak. Tapping opens the reader. */
export function ReadingWidget({ data, width }: { data: WidgetData; width: number }) {
  const r = data.reading;
  const inner = Math.max(40, Math.round(width) - 32);
  const fill = r.progress > 0 ? Math.max(6, Math.round(inner * r.progress)) : 0;
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: r.uri }}
      accessibilityLabel={`${r.title}. ${r.detail}.${r.streak ? ` ${r.streak} day streak.` : ''}`}
      style={{ height: 'match_parent', width: 'match_parent', backgroundColor: '#141414', borderRadius: 22, padding: 16, flexDirection: 'column', justifyContent: 'space-between' }}
    >
      <TextWidget text="TODAY’S READING" maxLines={1} style={{ fontSize: 10, fontWeight: '700', color: '#4ADE80', letterSpacing: 0.06 }} />
      <TextWidget text={r.title} maxLines={2} truncate="END" style={{ fontSize: 17, fontWeight: '700', color: '#FFFFFF', lineHeight: 22 }} />
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'column', flexGap: 6 }}>
        <FlexWidget style={{ width: 'match_parent', height: 5, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.18)', flexDirection: 'row' }}>
          {fill > 0 ? <FlexWidget style={{ width: fill, height: 5, borderRadius: 3, backgroundColor: '#4ADE80' }} /> : null}
        </FlexWidget>
        <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextWidget text={r.detail} maxLines={1} truncate="END" style={{ fontSize: 12, color: '#D4D4D4' }} />
          <TextWidget text={r.streak > 0 ? `🔥${r.streak}` : ''} maxLines={1} style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }} />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}

/** What to draw for a widget name. Hadith follows light/dark; reading is always black. */
export function renderFor(name: string, data: WidgetData, width: number) {
  if (name === 'TodayReading') return <ReadingWidget data={data} width={width} />;
  return { light: <HadithWidget data={data} mode="light" />, dark: <HadithWidget data={data} mode="dark" /> };
}
