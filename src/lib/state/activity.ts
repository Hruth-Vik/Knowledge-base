import type { ActivityDay, UserStateV1 } from './schema.js';

export function toLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shiftDateKey(key: string, days: number): string {
  const [year, month, day] = key.split('-').map(Number);
  if (!year || !month || !day) {
    return key;
  }
  const shifted = new Date(year, month - 1, day + days, 12, 0, 0, 0);
  return toLocalDateKey(shifted);
}

export function recentDateKeys(count: number, end: Date = new Date()): string[] {
  const endKey = toLocalDateKey(end);
  return Array.from({ length: count }, (_, index) =>
    shiftDateKey(endKey, index - count + 1),
  );
}

export function hasRecordedActivity(day: ActivityDay | undefined): boolean {
  if (!day) {
    return false;
  }
  return (
    day.secondsOnLearning > 0 ||
    day.lessonIdsCompleted.length > 0 ||
    day.reviewsCompleted > 0 ||
    day.quizzesCompleted > 0
  );
}

/**
 * A quiet 0–3 record used by the heatmap. A completed lesson, a review, or a
 * quiz is stronger evidence than time with the page open.
 */
export function getActivityLevel(day: ActivityDay | undefined): 0 | 1 | 2 | 3 {
  if (!hasRecordedActivity(day) || !day) {
    return 0;
  }

  const evidence =
    day.lessonIdsCompleted.length * 2 +
    day.reviewsCompleted +
    day.quizzesCompleted * 2 +
    (day.secondsOnLearning >= 45 * 60
      ? 3
      : day.secondsOnLearning >= 20 * 60
        ? 2
        : day.secondsOnLearning >= 5 * 60
          ? 1
          : 0);

  if (evidence >= 3) {
    return 3;
  }
  if (evidence >= 2) {
    return 2;
  }
  return 1;
}

export function getDailyCompletedLessons(
  state: UserStateV1,
  dateKey: string,
): number {
  return state.activity.days[dateKey]?.lessonIdsCompleted.length ?? 0;
}

export function countDueCards(
  state: UserStateV1,
  now: Date = new Date(),
): number {
  const timestamp = now.getTime();
  return Object.values(state.review.cards).filter(
    (card) => Date.parse(card.dueAt) <= timestamp,
  ).length;
}

export function isRestDay(state: UserStateV1, dateKey: string): boolean {
  return state.streak.restDays.includes(dateKey);
}

/**
 * Counts the current run of active or explicitly rest-covered days. Today may
 * still be empty; the run is then measured from yesterday so the page does not
 * punish the reader before the day is over.
 */
export function deriveCurrentStreak(
  state: UserStateV1,
  todayKey: string = toLocalDateKey(),
): number {
  let cursor = todayKey;
  const today = state.activity.days[cursor];
  if (!hasRecordedActivity(today) && !isRestDay(state, cursor)) {
    cursor = shiftDateKey(cursor, -1);
  }

  let days = 0;
  while (true) {
    const day = state.activity.days[cursor];
    if (!hasRecordedActivity(day) && !isRestDay(state, cursor)) {
      break;
    }
    days += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  return days;
}
