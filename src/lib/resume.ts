// "Pick up where you left off" after Android closes the app in the background.
// Screens report where the person is; it's saved when the app goes to the background and
// restored on the next cold start if that's within RESUME_WINDOW_MS.
import { readJson, removeKeys, writeJson } from './storage';

export const RESUME_WINDOW_MS = 20 * 60 * 1000;
const KEY = 'khalad.resume.v1';

// Only screens worth returning to, with simple params. Never onboarding, Supporter or tabs' home.
const ALLOWED =
  /^\/(surah\/\d{1,3}(\?(verse=\d{1,3})?(&?mark=1)?(&?from=deed)?)?|adhkar\/[a-z0-9_]{2,40}(\?i=\d{1,3})?|duas|tasbih|qibla|sadaqah|streak|about|quran|deeds|more|settings\/(prayer|notifications|city))$/;

let current = '';

/** Called by screens (and the root layout) as the person moves around. '' means "nothing to restore". */
export function setResumePath(path: string) {
  current = isResumable(path) ? path : '';
}

export function isResumable(path: string): boolean {
  return ALLOWED.test(path);
}

export async function saveResume(now = Date.now()): Promise<void> {
  if (current) await writeJson(KEY, { path: current, at: now });
  else await removeKeys([KEY]);
}

/** The saved place, once, if it's fresh enough and safe; then forgets it. */
export async function takeResume(now = Date.now(), windowMs = RESUME_WINDOW_MS): Promise<string | null> {
  const saved = await readJson<{ path?: unknown; at?: unknown } | null>(KEY, null);
  await removeKeys([KEY]);
  return pickResume(saved, now, windowMs);
}

/** Pure check (unit-tested). */
export function pickResume(saved: { path?: unknown; at?: unknown } | null, now: number, windowMs = RESUME_WINDOW_MS): string | null {
  if (!saved || typeof saved.path !== 'string' || typeof saved.at !== 'number') return null;
  const age = now - saved.at;
  if (age < 0 || age > windowMs) return null;
  return isResumable(saved.path) ? saved.path : null;
}
