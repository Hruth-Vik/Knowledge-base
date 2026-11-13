import { toLocalDateKey } from './activity.js';
import { createLessonProgress } from './derive.js';
import { syncCardsFromRecall } from './review.js';
import type {
  ActivityDay,
  LessonProgress,
  RecallAttempt,
  UserStateV1,
} from './schema.js';

export interface RecallAnswerInput {
  readonly questionId: string;
  readonly conceptIds: readonly string[];
  readonly correct: boolean;
  readonly response: string | null;
}

export interface RecordRecallOptions {
  readonly now?: Date;
  readonly attemptId?: string;
}

function timestamp(at: Date): string {
  return at.toISOString();
}

function addUnique(values: readonly string[], value: string): string[] {
  return values.includes(value) ? [...values] : [...values, value];
}

function removeValue(values: readonly string[], value: string): string[] {
  return values.filter((item) => item !== value);
}

function emptyDay(date: string): ActivityDay {
  return {
    date,
    secondsOnLearning: 0,
    lessonIdsTouched: [],
    lessonIdsCompleted: [],
    reviewsCompleted: 0,
    quizzesCompleted: 0,
  };
}

function updateActivityDay(
  state: UserStateV1,
  at: Date,
  update: (day: ActivityDay) => ActivityDay,
): UserStateV1 {
  const date = toLocalDateKey(at);
  const current = state.activity.days[date] ?? emptyDay(date);

  return {
    ...state,
    activity: {
      ...state.activity,
      days: {
        ...state.activity.days,
        [date]: update(current),
      },
    },
  };
}

function touchLesson(state: UserStateV1, lessonId: string, at: Date): UserStateV1 {
  return updateActivityDay(state, at, (day) => ({
    ...day,
    lessonIdsTouched: addUnique(day.lessonIdsTouched, lessonId),
  }));
}

function ensureProgress(
  state: UserStateV1,
  lessonId: string,
  at: Date,
): LessonProgress {
  return state.lessons[lessonId] ?? createLessonProgress(lessonId, at);
}

function replaceLesson(
  state: UserStateV1,
  progress: LessonProgress,
  at: Date,
): UserStateV1 {
  return {
    ...state,
    updatedAt: timestamp(at),
    lessons: {
      ...state.lessons,
      [progress.lessonId]: progress,
    },
  };
}

/**
 * Opening a lesson is not completion. It creates progress, moves the visit
 * timestamp, and records the day as touched.
 */
export function visitLesson(
  state: UserStateV1,
  lessonId: string,
  at: Date = new Date(),
): UserStateV1 {
  const existing = ensureProgress(state, lessonId, at);
  const next: LessonProgress = {
    ...existing,
    lastVisitedAt: timestamp(at),
  };
  const touched = touchLesson(state, lessonId, at);
  return replaceLesson(touched, next, at);
}

export function setLessonDone(
  state: UserStateV1,
  lessonId: string,
  done: boolean,
  at: Date = new Date(),
): UserStateV1 {
  const existing = ensureProgress(state, lessonId, at);
  const completedAt = done ? timestamp(at) : null;
  const next: LessonProgress = {
    ...existing,
    doneAt: completedAt,
  };

  const touched = touchLesson(state, lessonId, at);
  const withActivity = updateActivityDay(touched, at, (day) => ({
    ...day,
    lessonIdsCompleted: done
      ? addUnique(day.lessonIdsCompleted, lessonId)
      : removeValue(day.lessonIdsCompleted, lessonId),
  }));

  return replaceLesson(withActivity, next, at);
}

/**
 * Passing recall requires every answer correct (3/3). Earlier passes are kept
 * if a later attempt fails; mastery is not revoked by a retake.
 */
export function recordRecallAttempt(
  state: UserStateV1,
  lessonId: string,
  answers: readonly RecallAnswerInput[],
  options: RecordRecallOptions = {},
): UserStateV1 {
  const at = options.now ?? new Date();
  const existing = ensureProgress(state, lessonId, at);
  const attempt: RecallAttempt = {
    id: options.attemptId ?? globalThis.crypto.randomUUID(),
    attemptedAt: timestamp(at),
    answers: answers.map((answer) => ({
      questionId: answer.questionId,
      correct: answer.correct,
      response: answer.response ? answer.response.slice(0, 4_000) : null,
    })) as RecallAttempt['answers'],
    score: answers.filter((answer) => answer.correct).length,
    passed: answers.length === 3 && answers.every((answer) => answer.correct),
  };

  const attempts = [...existing.recall.attempts, attempt].slice(-50);
  const next: LessonProgress = {
    ...existing,
    recall: {
      attempts,
      passedAt:
        existing.recall.passedAt ??
        (attempt.passed ? timestamp(at) : null),
    },
  };

  const touched = touchLesson(state, lessonId, at);
  const withCards = syncCardsFromRecall(
    touched,
    answers.map((answer) => ({
      questionId: answer.questionId,
      conceptIds: answer.conceptIds,
      correct: answer.correct,
    })),
    at,
  );
  return replaceLesson(withCards, next, at);
}

export function saveExerciseDraft(
  state: UserStateV1,
  lessonId: string,
  draft: string,
  at: Date = new Date(),
): UserStateV1 {
  const existing = ensureProgress(state, lessonId, at);
  const next: LessonProgress = {
    ...existing,
    exercise: {
      ...existing.exercise,
      draft: draft.slice(0, 100_000),
      lastSavedAt: timestamp(at),
    },
  };
  return replaceLesson(state, next, at);
}

export function setExerciseRubricCheck(
  state: UserStateV1,
  lessonId: string,
  rubricId: string,
  checked: boolean,
  at: Date = new Date(),
): UserStateV1 {
  const existing = ensureProgress(state, lessonId, at);
  const next: LessonProgress = {
    ...existing,
    exercise: {
      ...existing.exercise,
      rubricChecks: {
        ...existing.exercise.rubricChecks,
        [rubricId]: checked,
      },
      lastSavedAt: timestamp(at),
    },
  };
  return replaceLesson(state, next, at);
}

export function setExercisePassed(
  state: UserStateV1,
  lessonId: string,
  passed: boolean,
  at: Date = new Date(),
): UserStateV1 {
  const existing = ensureProgress(state, lessonId, at);
  const next: LessonProgress = {
    ...existing,
    exercise: {
      ...existing.exercise,
      passedAt: passed ? timestamp(at) : null,
      lastSavedAt: timestamp(at),
    },
  };
  const touched = touchLesson(state, lessonId, at);
  return replaceLesson(touched, next, at);
}
