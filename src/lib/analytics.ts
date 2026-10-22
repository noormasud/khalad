import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';

// Opt-in only. Sends an event name plus a few non-personal values (e.g. which goal was picked).
// Never location, names, or reading content.

let enabled = false;
let anonId = '';

export function setAnalytics(on: boolean, id: string) {
  enabled = on && id.length >= 8;
  anonId = id;
}

export function newAnonId(): string {
  return Crypto.randomUUID();
}

type Props = Record<string, string | number | boolean>;

export function track(name: string, props: Props = {}): void {
  if (!enabled) return;
  if (!/^[a-z0-9_]{2,48}$/.test(name)) return;
  const safe: Props = {};
  for (const [k, v] of Object.entries(props).slice(0, 10)) {
    safe[k.slice(0, 32)] = typeof v === 'string' ? v.slice(0, 64) : v;
  }
  supabase
    .from('events')
    .insert({ anon_id: anonId, name, props: safe, app_version: Constants.expoConfig?.version ?? null })
    .then(
      () => undefined,
      () => undefined,
    );
}
