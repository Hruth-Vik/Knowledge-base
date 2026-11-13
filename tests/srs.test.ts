import { describe, expect, it } from 'vitest';
import {
  adjustEaseFactor,
  createSrsCard,
  isCardDue,
  scheduleReview,
} from '../src/lib/srs/scheduler.js';
import { createEmptyUserState } from '../src/lib/state/initial.js';
import {
  gradeReview,
  syncCardsFromRecall,
} from '../src/lib/state/review.js';
import {
  eligibleRestDays,
  grantWeeklyRestToken,
  spendRestDay,
  startOfIsoWeekKey,
} from '../src/lib/state/streak.js';
import { UserStateV1Schema } from '../src/lib/state/schema.js';

const START = new Date('2026-01-05T09:00:00.000Z');
const QUESTION_ID = 'java.l5.class-loading.recall.q1';
const CONCEPT_ID = 'java.l5.class-file';

describe('SM-2 scheduler', () => {
  it('creates a new card that is already due', () => {
    const card = createSrsCard(QUESTION_ID, [CONCEPT_ID], { now: START });

    expect(card.phase).toBe('new');
    expect(card.easeFactor).toBe(2.5);
    expect(card.intervalDays).toBe(0);
    expect(isCardDue(card, START)).toBe(true);
  });

  it('moves a successful card through 1, 6, then ease-scaled days', () => {
    const first = scheduleReview(
      createSrsCard(QUESTION_ID, [CONCEPT_ID], { now: START }),
      4,
      { now: START },
    );
    expect(first.intervalDays).toBe(1);
    expect(first.repetitions).toBe(1);
    expect(first.phase).toBe('review');
    expect(first.dueAt).toBe('2026-01-06T09:00:00.000Z');

    const second = scheduleReview(first, 4, {
      now: new Date('2026-01-06T09:00:00.000Z'),
    });
    expect(second.intervalDays).toBe(6);
    expect(second.repetitions).toBe(2);

    const third = scheduleReview(second, 4, {
      now: new Date('2026-01-12T09:00:00.000Z'),
    });
    expect(third.intervalDays).toBe(15);
    expect(third.repetitions).toBe(3);
  });

  it('resets a failed card to one day and records the lapse', () => {
    const learned = scheduleReview(
      createSrsCard(QUESTION_ID, [CONCEPT_ID], { now: START }),
      5,
      { now: START },
    );
    const failed = scheduleReview(learned, 2, {
      now: new Date('2026-01-06T09:00:00.000Z'),
    });

    expect(failed.phase).toBe('relearning');
    expect(failed.intervalDays).toBe(1);
    expect(failed.repetitions).toBe(0);
    expect(failed.lapses).toBe(1);
    expect(failed.lastRating).toBe(2);
    expect(failed.dueAt).toBe('2026-01-07T09:00:00.000Z');
  });

  it('clamps ease at 1.3', () => {
    let ease = 2.5;
    for (let index = 0; index < 10; index += 1) {
      ease = adjustEaseFactor(ease, 0);
    }
    expect(ease).toBe(1.3);
  });
});

describe('review state', () => {
  it('creates cards from recall attempts without review activity', () => {
    const state = createEmptyUserState({ now: START });
    const next = syncCardsFromRecall(
      state,
      [
        { questionId: QUESTION_ID, conceptIds: [CONCEPT_ID], correct: true },
        {
          questionId: 'java.l5.class-loading.recall.q2',
          conceptIds: [CONCEPT_ID],
          correct: false,
        },
      ],
      START,
    );

    expect(next.review.cards[QUESTION_ID]?.phase).toBe('review');
    expect(
      next.review.cards['java.l5.class-loading.recall.q2']?.phase,
    ).toBe('relearning');
    expect(next.review.logs).toHaveLength(0);
    expect(next.activity.days['2026-01-05']?.reviewsCompleted ?? 0).toBe(0);
    expect(UserStateV1Schema.safeParse(next).success).toBe(true);
  });

  it('grades a review, logs it, and counts the activity', () => {
    const withCard = syncCardsFromRecall(
      createEmptyUserState({ now: START }),
      [{ questionId: QUESTION_ID, conceptIds: [CONCEPT_ID], correct: true }],
      START,
    );

    const reviewed = gradeReview(
      withCard,
      QUESTION_ID,
      5,
      { now: new Date('2026-01-06T09:00:00.000Z'), logId: '11111111-1111-4111-8111-111111111111' },
    );

    expect(reviewed.review.logs).toHaveLength(1);
    expect(reviewed.review.logs[0]?.rating).toBe(5);
    expect(reviewed.review.cards[QUESTION_ID]?.intervalDays).toBe(6);
    expect(reviewed.activity.days['2026-01-06']?.reviewsCompleted).toBe(1);
    expect(UserStateV1Schema.safeParse(reviewed).success).toBe(true);
  });
});

describe('rest-day tokens', () => {
  it('treats Monday as the start of the ISO week', () => {
    expect(startOfIsoWeekKey(new Date('2026-01-05T09:00:00'))).toBe('2026-01-05');
    expect(startOfIsoWeekKey(new Date('2026-01-11T23:00:00'))).toBe('2026-01-05');
  });

  it('grants at most one token per week to an active notebook', () => {
    const initial = createEmptyUserState({ now: START });
    const marked = grantWeeklyRestToken(initial, START);
    expect(marked.streak.restDayTokens).toBe(1);
    expect(marked.streak.lastTokenGrantedOn).toBe('2026-01-05');

    const active = {
      ...marked,
      activity: {
        ...marked.activity,
        days: {
          ...marked.activity.days,
          '2026-01-08': {
            date: '2026-01-08',
            secondsOnLearning: 60,
            lessonIdsTouched: [],
            lessonIdsCompleted: [],
            reviewsCompleted: 1,
            quizzesCompleted: 0,
          },
        },
      },
    };

    const granted = grantWeeklyRestToken(
      active,
      new Date('2026-01-12T09:00:00.000Z'),
    );
    expect(granted.streak.restDayTokens).toBe(2);

    const secondGrant = grantWeeklyRestToken(
      granted,
      new Date('2026-01-19T09:00:00.000Z'),
    );
    expect(secondGrant.streak.restDayTokens).toBe(2);
  });

  it('spends only on a missed day in the preceding week', () => {
    const state = createEmptyUserState({ now: START });
    const withToken = grantWeeklyRestToken(state, START);
    const now = new Date('2026-01-08T09:00:00.000Z');

    expect(eligibleRestDays(withToken, now)).toContain('2026-01-07');
    expect(eligibleRestDays(withToken, now)).not.toContain('2026-01-08');

    const spent = spendRestDay(withToken, '2026-01-07', { now });
    expect(spent.streak.restDayTokens).toBe(0);
    expect(spent.streak.restDays).toContain('2026-01-07');
    expect(spendRestDay(spent, '2026-01-06', { now })).toBe(spent);
  });
});
