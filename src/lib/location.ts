import * as Location from 'expo-location';
import { getCalendars } from 'expo-localization';
import { placeLabel } from '../data/cities';
import { isValidCoordinate } from './prayer';
import type { SavedLocation } from '../state/model';

export function deviceTimeZone(): string {
  try {
    return getCalendars()[0]?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  } catch {
    return '';
  }
}

export type LocateResult = { ok: true; location: SavedLocation } | { ok: false; reason: 'denied' | 'unavailable' };

/** Approximate location, used only on the phone. No reverse geocoding (that would send it to a server). */
export async function locate(): Promise<LocateResult> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return { ok: false, reason: 'denied' };

    let pos: Location.LocationObject | null = null;
    try {
      pos = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 12000)),
      ]);
    } catch {
      pos = null;
    }
    if (!pos) pos = await Location.getLastKnownPositionAsync({ maxAge: 7 * 24 * 3600 * 1000 });
    if (!pos || !isValidCoordinate(pos.coords.latitude, pos.coords.longitude)) return { ok: false, reason: 'unavailable' };

    // Round to ~1 km: plenty for prayer times, and we never keep a precise position.
    const lat = Math.round(pos.coords.latitude * 100) / 100;
    const lng = Math.round(pos.coords.longitude * 100) / 100;
    return { ok: true, location: { lat, lng, label: placeLabel(lat, lng), source: 'gps', tz: deviceTimeZone() } };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
