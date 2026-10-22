import { addDays, dayKey, parseDayKey } from './dates';

export type StreakInput = {
  /** Days (YYYY-MM-DD) when the daily reading goal was met. */
  metDays: string[];
  /** Days the user paused. They neither break nor extend the streak. */
  pausedDays: string[];
  /** How many missed days can be covered per calendar month. */
  freezesPerMonth: number;
  today: string;
};

export type StreakResult = {
  current: number;
  best: number;
  frozenDays: string[];
  freezesLeftThisMonth: number;
};

const MAX_DAYS = 3660;

/**
 * Walk backwards from today. A met day adds 1 and a paused day is skipped.
 * A run of missed days is covered by freezes only if there are enough freezes
 * left in those months AND the run is followed (further back) by a met day;
 * otherwise the streak ends. Today not being met yet never breaks the streak.
 */
export function computeStreak(input: StreakInput): StreakResult {
  const met = new Set(input.metDays);
  const paused = new Set(input.pausedDays);
  const usedPerMonth = new Map<string, number>();
  const frozen: string[] = [];

  let current = 0;
  let cursor = parseDayKey(input.today);
  if (!met.has(input.today)) cursor = addDays(cursor, -1);

  for (let i = 0; i < MAX_DAYS; i++) {
    const k = dayKey(cursor);
    if (met.has(k)) {
      current += 1;
      cursor = addDays(cursor, -1);
      continue;
    }
    if (paused.has(k)) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (current === 0) break;

    // Collect the whole gap of missed days.
    const gap: string[] = [];
    let c = cursor;
    while (gap.length <= input.freezesPerMonth * 2) {
      const ck = dayKey(c);
      if (met.has(ck) || paused.has(ck)) break;
      gap.push(ck);
      c = addDays(c, -1);
    }
    const resumes = met.has(dayKey(c)) || paused.has(dayKey(c));
    const need = new Map<string, number>();
    for (const g of gap) need.set(g.slice(0, 7), (need.get(g.slice(0, 7)) ?? 0) + 1);
    const affordable = [...need].every(([m, n]) => (usedPerMonth.get(m) ?? 0) + n <= input.freezesPerMonth);
    if (!resumes || !affordable) break;

    for (const [m, n] of need) usedPerMonth.set(m, (usedPerMonth.get(m) ?? 0) + n);
    frozen.push(...gap);
    cursor = c;
  }

  const thisMonth = input.today.slice(0, 7);
  return {
    current,
    best: Math.max(current, bestRun(input.metDays, paused)),
    frozenDays: frozen,
    freezesLeftThisMonth: Math.max(0, input.freezesPerMonth - (usedPerMonth.get(thisMonth) ?? 0)),
  };
}

/** Longest run of met days, where paused days in between don't break it. */
function bestRun(metDays: string[], paused: Set<string>): number {
  const sorted = [...new Set(metDays)].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const k of sorted) {
    if (prev) {
      let ok = true;
      let c = addDays(parseDayKey(prev), 1);
      while (dayKey(c) !== k) {
        if (!paused.has(dayKey(c))) {
          ok = false;
          break;
        }
        c = addDays(c, 1);
      }
      run = ok ? run + 1 : 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = k;
  }
  return best;
}
