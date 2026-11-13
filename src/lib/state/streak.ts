import {
  hasRecordedActivity,
  shiftDateKey,
  toLocalDateKey,
} from './activity.js';
import type { UserStateV1 } from './schema.js';

export function startOfIsoWeekKey(date: Date = new Date()): string {
  const day = date.getDay();
  const offset = (day + 6) % 7;
  const monday = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - offset,
    12,
    0,
    0,
    0,
  );
  return toLocalDateKey(monday);
}

function activeOn(state: UserStateV1, dateKey: string): boolean {
  return hasRecordedActivity(state.activity.days[dateKey]);
}

/**
 * One token can be earned per ISO week, and only by a notebook that has shown
 * activity in the last seven local days. The initial token is the new-account
 * grant, so a fresh notebook does not immediately earn a second one.
 */
export function grantWeeklyRestToken(
  state: UserStateV1,
  now: Date = new Date(),
): UserStateV1 {
  const weekKey = startOfIsoWeekKey(now);
  if (state.streak.lastTokenGrantedOn === weekKey) {
    return state;
  }

  if (state.streak.lastTokenGrantedOn === null) {
    return {
      ...state,
      updatedAt: now.toISOString(),
      streak: {
        ...state.streak,
        lastTokenGrantedOn: weekKey,
      },
    };
  }

  const todayKey = toLocalDateKey(now);
  const recentlyActive = Array.from({ length: 7 }, (_, index) =>
    shiftDateKey(todayKey, -index),
  ).some((key) => activeOn(state, key));

  if (!recentlyActive || state.streak.restDayTokens >= 2) {
    return state;
  }

  return {
    ...state,
    updatedAt: now.toISOString(),
    streak: {
      ...state.streak,
      restDayTokens: state.streak.restDayTokens + 1,
      lastTokenGrantedOn: weekKey,
    },
  };
}

/**
 * Missed days available for explicit rest coverage. Today is never included:
 * the day is not missed while it is still happening.
 */
export function eligibleRestDays(
  state: UserStateV1,
  now: Date = new Date(),
): string[] {
  const todayKey = toLocalDateKey(now);
  return Array.from({ length: 7 }, (_, index) =>
    shiftDateKey(todayKey, -(index + 1)),
  ).filter(
    (key) =>
      !state.streak.restDays.includes(key) && !activeOn(state, key),
  );
}

export interface SpendRestDayOptions {
  readonly now?: Date;
}

export function spendRestDay(
  state: UserStateV1,
  dateKey: string,
  options: SpendRestDayOptions = {},
): UserStateV1 {
  const at = options.now ?? new Date();
  if (state.streak.restDayTokens <= 0) {
    return state;
  }
  if (!eligibleRestDays(state, at).includes(dateKey)) {
    return state;
  }

  return {
    ...state,
    updatedAt: at.toISOString(),
    streak: {
      ...state.streak,
      restDayTokens: state.streak.restDayTokens - 1,
      restDays: [...state.streak.restDays, dateKey].sort(),
    },
  };
}

/**
 * Rest coverage can also be removed without refunding the token. That is
 * deliberately explicit: spending is a user decision, not a toggle for gaming
 * the streak counter.
 */
export function removeRestDay(
  state: UserStateV1,
  dateKey: string,
  now: Date = new Date(),
): UserStateV1 {
  if (!state.streak.restDays.includes(dateKey)) {
    return state;
  }

  return {
    ...state,
    updatedAt: now.toISOString(),
    streak: {
      ...state.streak,
      restDays: state.streak.restDays.filter((key) => key !== dateKey),
    },
  };
}
