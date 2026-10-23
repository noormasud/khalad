// Remote "please update" switch, managed from Supabase (table app_config, key 'android_update'):
//   { "min_version_code": 101, "latest_version_code": 102, "message": "…" }
// Below min → the app is blocked with an Update button. Below latest → a gentle card on Today.
import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';
import { supabase } from './supabase';
import { readJson, writeJson } from './storage';

export type UpdateRule = { min_version_code?: number; latest_version_code?: number; message?: string };
export type UpdateStatus = 'force' | 'optional' | 'none';

const CACHE = 'khalad.updateRule.v1';
export const PACKAGE = 'com.islamicapp.khalad';

export function currentVersionCode(): number {
  const v = Constants.expoConfig?.android?.versionCode;
  return typeof v === 'number' && v > 0 ? v : 0;
}

/** Pure: what to do for this version. Unknown version (0) is never blocked. */
export function updateStatus(current: number, rule: UpdateRule | null): UpdateStatus {
  if (!rule || current <= 0) return 'none';
  const min = Number(rule.min_version_code);
  const latest = Number(rule.latest_version_code);
  if (Number.isFinite(min) && current < min) return 'force';
  if (Number.isFinite(latest) && current < latest) return 'optional';
  return 'none';
}

function sanitize(v: unknown): UpdateRule | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const n = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 && x < 1e9 ? x : undefined);
  return {
    min_version_code: n(o.min_version_code),
    latest_version_code: n(o.latest_version_code),
    message: typeof o.message === 'string' ? o.message.slice(0, 200) : undefined,
  };
}

let rule: UpdateRule | null = null;
let loaded = false;
const listeners = new Set<(r: UpdateRule | null) => void>();
const publish = (r: UpdateRule | null) => {
  rule = r;
  listeners.forEach((l) => l(r));
};

/** Load the cached rule, then fetch a fresh one. Offline keeps the last known rule. */
export async function refreshUpdateRule(): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (!loaded) {
    loaded = true;
    publish(sanitize(await readJson<unknown>(CACHE, null)));
  }
  try {
    const { data, error } = await supabase.from('app_config').select('value').eq('key', 'android_update').maybeSingle();
    if (error) return;
    const fresh = sanitize(data?.value ?? null);
    await writeJson(CACHE, fresh);
    publish(fresh);
  } catch {
    // offline: keep what we had
  }
}

export function useUpdateStatus(): { status: UpdateStatus; rule: UpdateRule | null } {
  const [r, setR] = useState<UpdateRule | null>(rule);
  useEffect(() => {
    listeners.add(setR);
    return () => {
      listeners.delete(setR);
    };
  }, []);
  return { status: updateStatus(currentVersionCode(), r), rule: r };
}

export function openStore() {
  Linking.openURL(`market://details?id=${PACKAGE}`).catch(() =>
    Linking.openURL(`https://play.google.com/store/apps/details?id=${PACKAGE}`).catch(() => undefined),
  );
}
