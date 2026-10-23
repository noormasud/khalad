// Runs in the background when Android asks a widget to draw (added, every 30 min, resized, tapped).
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { readJson } from '../lib/storage';
import { loadCachedContent } from '../lib/content';
import { setAnalytics, track } from '../lib/analytics';
import { DEFAULT_PROGRESS, DEFAULT_SETTINGS, hydrate } from '../state/model';
import { buildWidgetData } from './data';
import { renderFor } from './Widgets';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, widgetAction, renderWidget } = props;
  try {
    const [s, p, content] = await Promise.all([
      readJson<unknown>('khalad.settings.v1', {}),
      readJson<unknown>('khalad.progress.v1', {}),
      loadCachedContent(),
    ]);
    const settings = hydrate(DEFAULT_SETTINGS, s);
    if (widgetAction === 'WIDGET_ADDED' || widgetAction === 'WIDGET_DELETED') {
      setAnalytics(settings.analytics, settings.anonId);
      track(widgetAction === 'WIDGET_ADDED' ? 'widget_added' : 'widget_removed', { widget: widgetInfo.widgetName });
    }
    if (widgetAction === 'WIDGET_DELETED') return;
    const data = buildWidgetData(settings, hydrate(DEFAULT_PROGRESS, p), content);
    renderWidget(renderFor(widgetInfo.widgetName, data, widgetInfo.width));
  } catch {
    // Never crash the launcher; the widget keeps its last drawing.
  }
}
