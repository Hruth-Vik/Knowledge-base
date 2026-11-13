import { describe, expect, it } from 'vitest';
import { catalog } from '../src/lib/content/catalog.js';
import {
  completeQuizAttempt,
  ensureMilestones,
  milestoneAttempt,
  startMilestoneQuiz,
} from '../src/lib/review/milestones.js';
import { selectQuestions } from '../src/lib/review/selector.js';
import { createEmptyUserState } from '../src/lib/state/initial.js';
import { setLessonDone } from '../src/lib/state/lesson.js';
import { syncCardsFromRecall } from '../src/lib/state/review.js';
import { UserStateV1Schema, type UserStateV1 } from '../src/lib/state/schema.js';

const START = new Date('2026-01-05T09:00:00.000Z');
const LESSON_IDS = [
  'java.l0.source-to-process',
  'java.l1.equality-contracts',
  'java.l5.class-loading',
  'java.l5.classloader-leak',
  'java.l5.gc-pressure',
];

function doneState(): UserStateV1 {
  let state = createEmptyUserState({ now: START });
  LESSON_IDS.forEach((lessonId, index) => {
    state = setLessonDone(
      state,
      lessonId,
      true,
      new Date(START.getTime() + index * 60_000),
    );
  });
  return state;
}

describe('quiz selection', () => {
  it('selects deterministic, unique questions within concept limits', () => {
    const state = createEmptyUserState({ now: START });
    const first = selectQuestions({
      catalog,
      state,
      scopeLessonIds: LESSON_IDS.slice(0, 2),
      kind: 'milestone',
      now: START,
      seed: 42,
      size: 6,
    });
    const second = selectQuestions({
      catalog,
      state,
      scopeLessonIds: LESSON_IDS.slice(0, 2),
      kind: 'milestone',
      now: START,
      seed: 42,
      size: 6,
    });

    expect(first.selected.map((entry) => entry.question.id)).toEqual(
      second.selected.map((entry) => entry.question.id),
    );
    expect(new Set(first.selected.map((entry) => entry.question.id)).size).toBe(
      first.selected.length,
    );
    expect(new Set(first.selected.map((entry) => entry.question.type)).size).toBeGreaterThanOrEqual(2);

    const conceptCounts = new Map<string, number>();
    for (const entry of first.selected) {
      for (const conceptId of entry.question.concepts) {
        conceptCounts.set(conceptId, (conceptCounts.get(conceptId) ?? 0) + 1);
      }
    }
    expect([...conceptCounts.values()].every((count) => count <= 2)).toBe(true);
  });

  it('raises the weight of a weak card', () => {
    const base = selectQuestions({
      catalog,
      state: createEmptyUserState({ now: START }),
      scopeLessonIds: [LESSON_IDS[0]!],
      kind: 'milestone',
      now: START,
      seed: 1,
    });
    const question = base.candidates[0]!;
    const weakState = syncCardsFromRecall(
      createEmptyUserState({ now: START }),
      [
        {
          questionId: question.question.id,
          conceptIds: question.question.concepts,
          correct: false,
        },
      ],
      START,
    );
    const weighted = selectQuestions({
      catalog,
      state: weakState,
      scopeLessonIds: [LESSON_IDS[0]!],
      kind: 'milestone',
      now: START,
      seed: 1,
    }).candidates.find(
      (candidate) => candidate.question.id === question.question.id,
    );

    expect(weighted?.weight).toBeGreaterThan(question.weight);
  });
});

describe('milestones', () => {
  it('creates a five-lesson milestone and a level-end milestone once', () => {
    const state = doneState();
    const withMilestones = ensureMilestones(state, catalog, START);

    expect(withMilestones.milestones['milestone.java.five.5']?.status).toBe(
      'pending',
    );
    expect(
      withMilestones.milestones['milestone.java.l5.level-end']?.status,
    ).toBe('pending');
    expect(UserStateV1Schema.safeParse(withMilestones).success).toBe(true);

    const again = ensureMilestones(withMilestones, catalog, START);
    expect(Object.keys(again.milestones)).toHaveLength(
      Object.keys(withMilestones.milestones).length,
    );
  });

  it('starts and completes a milestone quiz', () => {
    const state = ensureMilestones(doneState(), catalog, START);
    const started = startMilestoneQuiz(
      state,
      catalog,
      'milestone.java.five.5',
      { now: START, seed: 7 },
    );
    const milestone = started.milestones['milestone.java.five.5'];
    expect(milestone?.status).toBe('started');
    const attempt = milestone ? milestoneAttempt(started, milestone) : null;
    expect(attempt?.status).toBe('in-progress');
    expect(attempt?.questions.length).toBe(8);

    const completed = completeQuizAttempt(
      started,
      attempt!.id,
      attempt!.questions.map((outcome) => ({
        ...outcome,
        correct: true,
      })),
      { now: new Date('2026-01-05T09:10:00.000Z') },
    );

    expect(
      completed.milestones['milestone.java.five.5']?.status,
    ).toBe('completed');
    expect(completed.milestones['milestone.java.five.5']?.quizAttemptId).toBe(
      attempt!.id,
    );
    expect(completed.activity.days['2026-01-05']?.quizzesCompleted).toBe(1);
    expect(UserStateV1Schema.safeParse(completed).success).toBe(true);
  });
});
