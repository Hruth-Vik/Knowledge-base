import type { LessonProgress, UserStateV1 } from './schema.js';

export type LessonStatus =
  | 'not-started'
  | 'in-progress'
  | 'done'
  | 'mastered';

export type LevelStatus = 'unstarted' | 'in-progress' | 'mastered';

export interface MasteryChecklist {
  readonly markedDone: boolean;
  readonly recallPassed: boolean;
  readonly exercisePassed: boolean;
  readonly mastered: boolean;
}

export function getMasteryChecklist(
  progress: LessonProgress | undefined,
): MasteryChecklist {
  const markedDone = Boolean(progress?.doneAt);
  const recallPassed = Boolean(progress?.recall.passedAt);
  const exercisePassed = Boolean(progress?.exercise.passedAt);

  return {
    markedDone,
    recallPassed,
    exercisePassed,
    mastered: markedDone && recallPassed && exercisePassed,
  };
}

/**
 * "Mastered" is never inferred from reading time. It requires all three
 * independent signals. "Done" remains visible while the other two are pending.
 */
export function deriveLessonStatus(
  progress: LessonProgress | undefined,
): LessonStatus {
  if (!progress) {
    return 'not-started';
  }

  const checklist = getMasteryChecklist(progress);
  if (checklist.mastered) {
    return 'mastered';
  }
  if (checklist.markedDone) {
    return 'done';
  }
  return 'in-progress';
}

/**
 * Level state uses only published lessons. A level with no content is
 * "unstarted" rather than "mastered"; an empty set is not evidence of work.
 */
export function deriveLevelStatus(
  state: UserStateV1,
  lessonIds: readonly string[],
): LevelStatus {
  if (lessonIds.length === 0) {
    return 'unstarted';
  }

  const statuses = lessonIds.map((lessonId) =>
    deriveLessonStatus(state.lessons[lessonId]),
  );

  if (statuses.every((status) => status === 'mastered')) {
    return 'mastered';
  }
  if (statuses.every((status) => status === 'not-started')) {
    return 'unstarted';
  }
  return 'in-progress';
}

export function createLessonProgress(
  lessonId: string,
  at: Date = new Date(),
): LessonProgress {
  const timestamp = at.toISOString();

  return {
    lessonId,
    startedAt: timestamp,
    lastVisitedAt: timestamp,
    doneAt: null,
    timeSpentSeconds: 0,
    recall: {
      attempts: [],
      passedAt: null,
    },
    exercise: {
      draft: '',
      lastSavedAt: null,
      rubricChecks: {},
      passedAt: null,
    },
  };
}
