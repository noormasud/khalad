import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';

// Anonymous usage, ON by default; people can switch it off in More (and on the last onboarding step).
// Sends an event name plus a few non-personal values (which screen, which setting).
// Never location, names, Quran notes or sadaqah amounts. The app can only insert, never read.

type Props = Record<string, string | number | boolean>;
type Pending = { name: string; props: Props };

let enabled = false;
let decided = false; // until the saved setting is loaded, keep early events in memory
let anonId = '';
let pending: Pending[] = [];

export function setAnalytics(on: boolean, id: string) {
  anonId = id;
  enabled = on && id.length >= 8;
  // Only "decided" once we have an id; before that, keep buffering.
  if (id.length >= 8) {
    decided = true;
    const queued = pending;
    pending = [];
    if (enabled) queued.forEach((e) => send(e.name, e.props));
  }
}

export function newAnonId(): string {
  return Crypto.randomUUID();
}

function clean(props: Props): Props {
  const safe: Props = {};
  for (const [k, v] of Object.entries(props).slice(0, 12)) {
    if (v === undefined || v === null) continue;
    safe[k.slice(0, 32)] = typeof v === 'string' ? v.slice(0, 64) : v;
  }
  return safe;
}

function send(name: string, props: Props) {
  supabase
    .from('events')
    .insert({ anon_id: anonId, name, props, app_version: Constants.expoConfig?.version ?? null })
    .then(
      () => undefined,
      () => undefined,
    );
}

export function track(name: string, props: Props = {}): void {
  if (!/^[a-z0-9_]{2,48}$/.test(name)) return;
  const safe = clean(props);
  if (!decided) {
    if (pending.length < 30) pending.push({ name, props: safe });
    return;
  }
  if (enabled) send(name, safe);
}

/** "/surah/18" → { screen: "surah", id: "18" }; "/" → { screen: "today" }. */
export function screenOf(pathname: string): { screen: string; id?: string } {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return { screen: 'today' };
  if (parts[0] === 'surah' || parts[0] === 'adhkar') return { screen: parts[0], id: parts[1] };
  return { screen: parts.join('_').replace(/[^a-z0-9_]/gi, '').toLowerCase() || 'unknown' };
}

/** Round counts so events show patterns, not exact behaviour. */
export function bucket(n: number): string {
  if (n <= 0) return '0';
  if (n <= 5) return '1-5';
  if (n <= 20) return '6-20';
  if (n <= 50) return '21-50';
  if (n <= 100) return '51-100';
  return '100+';
}
