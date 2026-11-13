import { describe, expect, it } from 'vitest';
import { createEmptyUserState } from '../src/lib/state/initial.js';
import {
  recordRecallAttempt,
  saveExerciseDraft,
  setExercisePassed,
  setExerciseRubricCheck,
  setLessonDone,
  visitLesson,
} from '../src/lib/state/lesson.js';
import { UserStateV1Schema } from '../src/lib/state/schema.js';

const LESSON_ID = 'java.l5.class-loading';
const FIXED_DATE = new Date('2026-01-02T10:00:00.000Z');
const LATER_DATE = new Date('2026-01-02T11:00:00.000Z');

function answers(correct: readonly boolean[]) {
  return correct.map((isCorrect, index) => ({
    questionId: `${LESSON_ID}.recall.q${index + 1}`,
    conceptIds: ['java.l5.class-file'],
    correct: isCorrect,
    response: `answer ${index + 1}`,
  }));
}

describe('lesson progress mutations', () => {
  it('records a visit without claiming completion', () => {
    const state = createEmptyUserState({ now: FIXED_DATE });
    const next = visitLesson(state, LESSON_ID, FIXED_DATE);

    expect(next.lessons[LESSON_ID]?.lastVisitedAt).toBe(
      FIXED_DATE.toISOString(),
    );
    expect(next.lessons[LESSON_ID]?.doneAt).toBeNull();
    expect(next.activity.days['2026-01-02']?.lessonIdsTouched).toContain(
      LESSON_ID,
    );
    expect(next.activity.days['2026-01-02']?.lessonIdsCompleted).toEqual([]);
    expect(UserStateV1Schema.safeParse(next).success).toBe(true);
    expect(state.lessons[LESSON_ID]).toBeUndefined();
  });

  it('marks done, adds the activity record, and undoes both cleanly', () => {
    const state = createEmptyUserState({ now: FIXED_DATE });
    const done = setLessonDone(state, LESSON_ID, true, FIXED_DATE);

    expect(done.lessons[LESSON_ID]?.doneAt).toBe(FIXED_DATE.toISOString());
    expect(done.activity.days['2026-01-02']?.lessonIdsTouched).toContain(
      LESSON_ID,
    );
    expect(done.activity.days['2026-01-02']?.lessonIdsCompleted).toContain(
      LESSON_ID,
    );

    const undone = setLessonDone(done, LESSON_ID, false, LATER_DATE);
    expect(undone.lessons[LESSON_ID]?.doneAt).toBeNull();
    expect(
      undone.activity.days['2026-01-02']?.lessonIdsCompleted,
    ).not.toContain(LESSON_ID);
    expect(undone.activity.days['2026-01-02']?.lessonIdsTouched).toContain(
      LESSON_ID,
    );
    expect(UserStateV1Schema.safeParse(undone).success).toBe(true);
  });

  it('passes recall only at 3/3 and keeps a pass through a later fail', () => {
    const state = createEmptyUserState({ now: FIXED_DATE });
    const failed = recordRecallAttempt(state, LESSON_ID, answers([true, true, false]), {
      now: FIXED_DATE,
      attemptId: '11111111-1111-4111-8111-111111111111',
    });

    expect(failed.lessons[LESSON_ID]?.recall.attempts).toHaveLength(1);
    expect(failed.lessons[LESSON_ID]?.recall.attempts[0]?.score).toBe(2);
    expect(failed.lessons[LESSON_ID]?.recall.passedAt).toBeNull();

    const passed = recordRecallAttempt(
      failed,
      LESSON_ID,
      answers([true, true, true]),
      {
        now: LATER_DATE,
        attemptId: '22222222-2222-4222-8222-222222222222',
      },
    );
    expect(passed.lessons[LESSON_ID]?.recall.passedAt).toBe(
      LATER_DATE.toISOString(),
    );
    expect(passed.lessons[LESSON_ID]?.recall.attempts).toHaveLength(2);

    const retaken = recordRecallAttempt(
      passed,
      LESSON_ID,
      answers([true, false, true]),
      {
        now: new Date('2026-01-03T09:00:00.000Z'),
        attemptId: '33333333-3333-4333-8333-333333333333',
      },
    );
    expect(retaken.lessons[LESSON_ID]?.recall.passedAt).toBe(
      LATER_DATE.toISOString(),
    );
    expect(UserStateV1Schema.safeParse(retaken).success).toBe(true);
  });

  it('persists exercise draft, rubric checks, and the pass mark', () => {
    const state = createEmptyUserState({ now: FIXED_DATE });
    const drafted = saveExerciseDraft(
      state,
      LESSON_ID,
      'class Probe { static { ... } }',
      FIXED_DATE,
    );
    expect(drafted.lessons[LESSON_ID]?.exercise.draft).toContain('class Probe');
    expect(drafted.lessons[LESSON_ID]?.exercise.lastSavedAt).toBe(
      FIXED_DATE.toISOString(),
    );

    const checked = setExerciseRubricCheck(
      drafted,
      LESSON_ID,
      'separate-class',
      true,
      LATER_DATE,
    );
    expect(
      checked.lessons[LESSON_ID]?.exercise.rubricChecks['separate-class'],
    ).toBe(true);

    const passed = setExercisePassed(
      checked,
      LESSON_ID,
      true,
      LATER_DATE,
    );
    expect(passed.lessons[LESSON_ID]?.exercise.passedAt).toBe(
      LATER_DATE.toISOString(),
    );

    const reopened = setExercisePassed(
      passed,
      LESSON_ID,
      false,
      LATER_DATE,
    );
    expect(reopened.lessons[LESSON_ID]?.exercise.passedAt).toBeNull();
    expect(UserStateV1Schema.safeParse(reopened).success).toBe(true);
  });
});
