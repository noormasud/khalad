import { router } from 'expo-router';

/** Close every screen on top of the tabs, then show a tab: '/' (Today), '/quran', '/deeds' or '/more'. */
export function goToTab(tab: '/' | '/quran' | '/deeds' | '/more') {
  try {
    if (router.canDismiss()) router.dismissAll();
  } catch {
    // nothing to dismiss
  }
  router.navigate(tab as never);
}
