import { Platform } from 'react-native';
import type { WidgetData } from './data';
import { renderFor, WIDGET_NAMES } from './Widgets';

/** Redraw any widgets on the home screen with fresh data (no-op when none are placed). */
export function refreshWidgets(data: WidgetData) {
  if (Platform.OS !== 'android') return;
  try {
    // Loaded lazily so a missing native module can never break app start.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { requestWidgetUpdate } = require('react-native-android-widget');
    for (const name of WIDGET_NAMES) {
      requestWidgetUpdate({
        widgetName: name,
        renderWidget: (info: { width?: number }) => renderFor(name, data, info?.width ?? 160),
        widgetNotFound: () => undefined,
      }).catch?.(() => undefined);
    }
  } catch {
    // ignore
  }
}

/** Ask the launcher to add a widget. Returns false when the launcher can't (then show manual steps). */
export async function pinWidget(name: string): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { requestPinWidget } = require('react-native-android-widget');
    return !!(await requestPinWidget({ widgetName: name }));
  } catch {
    return false;
  }
}
