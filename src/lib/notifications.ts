import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { planNotifications, type ReminderRule } from './schedule';
import type { DayTimes } from './prayer';

// Quiet by design: no adhan audio. Prayer lines are silent; reminders use the default soft sound.

let configured = false;

export async function configureNotifications(): Promise<void> {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('prayer', {
      name: 'Next prayer (silent)',
      description: 'A quiet line on your lock screen showing the next prayer time',
      importance: Notifications.AndroidImportance.LOW,
      sound: null,
      vibrationPattern: null,
      enableVibrate: false,
      showBadge: false,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Sunnah reminders',
      description: 'Al-Kahf on Fridays, Al-Mulk at night and other reminders you turn on',
      importance: Notifications.AndroidImportance.DEFAULT,
      showBadge: false,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}

export async function hasPermission(): Promise<boolean> {
  try {
    const s = await Notifications.getPermissionsAsync();
    return s.granted;
  } catch {
    return false;
  }
}

/** Asks only when the user turns a notification feature on (Android 13+ needs this). */
export async function requestPermission(): Promise<boolean> {
  try {
    await configureNotifications();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const res = await Notifications.requestPermissionsAsync();
    return res.granted;
  } catch {
    return false;
  }
}

export type RescheduleInput = {
  timesForDate: (d: Date) => DayTimes;
  prayerLine: boolean;
  reminders: ReminderRule[];
  enabledReminders: Record<string, boolean>;
  hijriAdjust: number;
  use24h: boolean;
};

let running: Promise<void> | null = null;

/** Replace all scheduled notifications with a fresh plan for the next few days. */
export function reschedule(input: RescheduleInput): Promise<void> {
  const job = (running ?? Promise.resolve()).then(() => doReschedule(input)).catch(() => undefined);
  running = job;
  return job;
}

async function doReschedule(input: RescheduleInput): Promise<void> {
  await configureNotifications();
  await Notifications.cancelAllScheduledNotificationsAsync();
  const anyOn = input.prayerLine || Object.values(input.enabledReminders).some(Boolean);
  if (!anyOn || !(await hasPermission())) return;

  const plan = planNotifications({ ...input, now: new Date(), days: 4 }).slice(0, 60);
  for (const n of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: n.id,
      content: {
        title: n.title,
        body: n.body || undefined,
        data: n.data,
        sound: n.channel === 'reminders' ? 'default' : undefined,
        priority: n.channel === 'prayer' ? Notifications.AndroidNotificationPriority.LOW : Notifications.AndroidNotificationPriority.DEFAULT,
        autoDismiss: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.at, channelId: n.channel },
    });
  }
}

/** Clear old prayer lines so only the latest shows. */
export async function clearPresentedPrayerLines(): Promise<void> {
  try {
    const shown = await Notifications.getPresentedNotificationsAsync();
    const ids = shown.filter((n) => n.request.identifier.startsWith('prayer-')).map((n) => n.request.identifier);
    // Keep the newest one.
    ids.sort();
    for (const id of ids.slice(0, -1)) await Notifications.dismissNotificationAsync(id);
  } catch {
    // ignore
  }
}
