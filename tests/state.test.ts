import { describe, expect, it } from 'vitest';
import { createEmptyUserState } from '../src/lib/state/initial.js';
import {
  createLessonProgress,
  deriveLessonStatus,
} from '../src/lib/state/derive.js';
import {
  BackupEnvelopeSchema,
  RecallAttemptSchema,
  UserStateV1Schema,
} from '../src/lib/state/schema.js';

const FIXED_DATE = new Date('2026-01-02T10:00:00.000Z');

describe('state model', () => {
  it('creates a valid first-run state', () => {
    const state = createEmptyUserState({
      now: FIXED_DATE,
      activeLanguageId: 'java',
    });

    expect(UserStateV1Schema.safeParse(state).success).toBe(true);
    expect(state.settings.dailyGoalLessons).toBe(1);
    expect(state.streak.restDayTokens).toBe(1);
  });

  it('derives mastery only after all three independent signals', () => {
    const progress = createLessonProgress(
      'java.l0.sample-references',
      FIXED_DATE,
    );
    expect(deriveLessonStatus(progress)).toBe('in-progress');

    progress.doneAt = FIXED_DATE.toISOString();
    expect(deriveLessonStatus(progress)).toBe('done');

    progress.recall.passedAt = FIXED_DATE.toISOString();
    expect(deriveLessonStatus(progress)).toBe('done');

    progress.exercise.passedAt = FIXED_DATE.toISOString();
    expect(deriveLessonStatus(progress)).toBe('mastered');
  });

  it('does not allow a partial recall attempt to be marked passed', () => {
    const result = RecallAttemptSchema.safeParse({
      id: '11111111-1111-4111-8111-111111111111',
      attemptedAt: FIXED_DATE.toISOString(),
      answers: [
        {
          questionId: 'java.l0.sample.recall.q1',
          correct: true,
          response: null,
        },
        {
          questionId: 'java.l0.sample.recall.q2',
          correct: false,
          response: null,
        },
        {
          questionId: 'java.l0.sample.recall.q3',
          correct: true,
          response: null,
        },
      ],
      score: 2,
      passed: true,
    });

    expect(result.success).toBe(false);
  });

  it('validates a backup envelope around the same state schema', () => {
    const state = createEmptyUserState({ now: FIXED_DATE });
    const envelope = {
      format: 'foundation.backup',
      formatVersion: 1,
      exportedAt: FIXED_DATE.toISOString(),
      state,
    };

    expect(BackupEnvelopeSchema.safeParse(envelope).success).toBe(true);
  });
});
