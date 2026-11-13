import { describe, expect, it } from 'vitest';
import {
  deriveCurrentStreak,
  getActivityLevel,
  recentDateKeys,
  shiftDateKey,
  toLocalDateKey,
} from '../src/lib/state/activity.js';
import {
  createLessonProgress,
  deriveLevelStatus,
} from '../src/lib/state/derive.js';
import { createEmptyUserState } from '../src/lib/state/initial.js';
import type { ActivityDay } from '../src/lib/state/schema.js';

const FIXED_DATE = new Date('2026-01-02T10:00:00.000Z');

function activeDay(date: string, seconds = 120): ActivityDay {
  return {
    date,
    secondsOnLearning: seconds,
    lessonIdsTouched: [],
    lessonIdsCompleted: [],
    reviewsCompleted: 0,
    quizzesCompleted: 0,
  };
}

describe('calendar and activity derivation', () => {
  it('uses local calendar dates and shifts across month boundaries', () => {
    const date = new Date(2026, 0, 2, 12);
    expect(toLocalDateKey(date)).toBe('2026-01-02');
    expect(shiftDateKey('2026-01-01', -1)).toBe('2025-12-31');
    expect(recentDateKeys(3, date)).toEqual([
      '2025-12-31',
      '2026-01-01',
      '2026-01-02',
    ]);
  });

  it('grades activity by evidence, not by opening a page', () => {
    expect(getActivityLevel(undefined)).toBe(0);
    expect(getActivityLevel(activeDay('2026-01-01', 61))).toBe(1);
    expect(getActivityLevel(activeDay('2026-01-01', 25 * 60))).toBe(2);
    expect(getActivityLevel(activeDay('2026-01-01', 50 * 60))).toBe(3);
  });

  it('keeps a streak through rest days and empty today', () => {
    const state = createEmptyUserState({ now: FIXED_DATE });
    state.activity.days['2025-12-30'] = activeDay('2025-12-30');
    state.streak.restDays = ['2025-12-31', '2026-01-01'];

    expect(deriveCurrentStreak(state, '2026-01-02')).toBe(3);
    expect(deriveCurrentStreak(state, '2026-01-01')).toBe(3);

    state.activity.days['2026-01-02'] = activeDay('2026-01-02');
    expect(deriveCurrentStreak(state, '2026-01-02')).toBe(4);
  });
});

describe('level status derivation', () => {
  it('does not call an empty level mastered', () => {
    const state = createEmptyUserState({ now: FIXED_DATE });
    expect(deriveLevelStatus(state, [])).toBe('unstarted');
  });

  it('tracks unstarted, in-progress, and mastered levels', () => {
    const state = createEmptyUserState({ now: FIXED_DATE });
    const firstId = 'java.l0.first';
    const secondId = 'java.l0.second';
    const first = createLessonProgress(firstId, FIXED_DATE);
    const second = createLessonProgress(secondId, FIXED_DATE);
    state.lessons[firstId] = first;
    state.lessons[secondId] = second;

    expect(deriveLevelStatus(state, [firstId, secondId])).toBe('in-progress');

    for (const progress of [first, second]) {
      progress.doneAt = FIXED_DATE.toISOString();
      progress.recall.passedAt = FIXED_DATE.toISOString();
      progress.exercise.passedAt = FIXED_DATE.toISOString();
    }
    expect(deriveLevelStatus(state, [firstId, secondId])).toBe('mastered');
  });

  it('stays in progress when one lesson is not mastered', () => {
    const state = createEmptyUserState({ now: FIXED_DATE });
    const firstId = 'java.l0.first';
    const secondId = 'java.l0.second';
    const first = createLessonProgress(firstId, FIXED_DATE);
    first.doneAt = FIXED_DATE.toISOString();
    first.recall.passedAt = FIXED_DATE.toISOString();
    first.exercise.passedAt = FIXED_DATE.toISOString();
    state.lessons[firstId] = first;

    expect(deriveLevelStatus(state, [firstId, secondId])).toBe('in-progress');
  });
});
