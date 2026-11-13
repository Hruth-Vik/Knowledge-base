import type { ContentCatalog } from '../content/types.js';
import { toLocalDateKey } from '../state/activity.js';
import type {
  ActivityDay,
  Milestone,
  QuizAttempt,
  QuizQuestionOutcome,
  UserStateV1,
} from '../state/schema.js';
import { selectQuestions, type QuizKind } from './selector.js';

const FIVE_LESSON_SIZE = 5;

function stringSeed(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
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

function quizKind(milestone: Milestone): QuizKind {
  return milestone.kind === 'level-end' ? 'level-gate' : 'milestone';
}

function scopeMatches(attempt: QuizAttempt, milestone: Milestone): boolean {
  return (
    attempt.kind === quizKind(milestone) &&
    attempt.scope.lessonIds.length === milestone.lessonIds.length &&
    milestone.lessonIds.every((lessonId) =>
      attempt.scope.lessonIds.includes(lessonId),
    )
  );
}

/**
 * Milestone boundaries are deterministic IDs, so a pending prompt is created
 * once and never duplicated. They are prompts, not gates: a pending milestone
 * does not block the next lesson.
 */
export function ensureMilestones(
  state: UserStateV1,
  catalog: ContentCatalog,
  now: Date = new Date(),
): UserStateV1 {
  const milestones = { ...state.milestones };
  let changed = false;

  for (const language of catalog.languages) {
    const records = language.levels.flatMap((level) =>
      level.chapters.flatMap((chapter) => chapter.lessons),
    );
    const done = records
      .filter((record) => Boolean(state.lessons[record.lesson.id]?.doneAt))
      .sort((a, b) =>
        (state.lessons[a.lesson.id]?.doneAt ?? '').localeCompare(
          state.lessons[b.lesson.id]?.doneAt ?? '',
        ),
      );

    for (
      let boundary = FIVE_LESSON_SIZE;
      boundary <= done.length;
      boundary += FIVE_LESSON_SIZE
    ) {
      const id = `milestone.${language.manifest.id}.five.${boundary}`;
      if (milestones[id]) {
        continue;
      }
      milestones[id] = {
        id,
        language: language.manifest.id,
        kind: 'five-lesson',
        levelId: null,
        lessonIds: done
          .slice(boundary - FIVE_LESSON_SIZE, boundary)
          .map((record) => record.lesson.id),
        status: 'pending',
        quizAttemptId: null,
        createdAt: now.toISOString(),
        completedAt: null,
      };
      changed = true;
    }

    for (const level of language.levels) {
      const lessonIds = level.chapters.flatMap((chapter) =>
        chapter.lessons.map((record) => record.lesson.id),
      );
      if (
        lessonIds.length === 0 ||
        !lessonIds.every((lessonId) => Boolean(state.lessons[lessonId]?.doneAt))
      ) {
        continue;
      }

      const id = `milestone.${level.manifest.id}.level-end`;
      if (milestones[id]) {
        continue;
      }
      milestones[id] = {
        id,
        language: language.manifest.id,
        kind: 'level-end',
        levelId: level.manifest.id,
        lessonIds,
        status: 'pending',
        quizAttemptId: null,
        createdAt: now.toISOString(),
        completedAt: null,
      };
      changed = true;
    }
  }

  if (!changed) {
    return state;
  }

  return {
    ...state,
    updatedAt: now.toISOString(),
    milestones,
  };
}

export interface StartMilestoneOptions {
  readonly now?: Date;
  readonly seed?: number;
}

export function startMilestoneQuiz(
  state: UserStateV1,
  catalog: ContentCatalog,
  milestoneId: string,
  options: StartMilestoneOptions = {},
): UserStateV1 {
  const milestone = state.milestones[milestoneId];
  if (!milestone || milestone.status === 'completed') {
    return state;
  }

  const at = options.now ?? new Date();
  const existing = state.quizzes.find(
    (attempt) =>
      attempt.status === 'in-progress' && scopeMatches(attempt, milestone),
  );

  if (existing) {
    return milestone.status === 'started'
      ? state
      : {
          ...state,
          updatedAt: at.toISOString(),
          milestones: {
            ...state.milestones,
            [milestoneId]: { ...milestone, status: 'started' },
          },
        };
  }

  const kind = quizKind(milestone);
  const selection = selectQuestions({
    catalog,
    state,
    scopeLessonIds: milestone.lessonIds,
    kind,
    now: at,
    seed: options.seed ?? stringSeed(milestone.id),
  });

  if (selection.selected.length === 0) {
    return state;
  }

  const attempt: QuizAttempt = {
    id: globalThis.crypto.randomUUID(),
    kind,
    scope: {
      levelId: milestone.levelId,
      lessonIds: [...milestone.lessonIds],
    },
    startedAt: at.toISOString(),
    completedAt: null,
    durationSeconds: 0,
    status: 'in-progress',
    questions: selection.selected.map((candidate) => ({
      questionId: candidate.question.id,
      conceptIds: candidate.question.concepts,
      correct: null,
      selfScore: null,
      response: null,
    })),
  };

  return {
    ...state,
    updatedAt: at.toISOString(),
    quizzes: [...state.quizzes, attempt],
    milestones: {
      ...state.milestones,
      [milestoneId]: { ...milestone, status: 'started' },
    },
  };
}

export function saveQuizAttempt(
  state: UserStateV1,
  attempt: QuizAttempt,
  now: Date = new Date(),
): UserStateV1 {
  const index = state.quizzes.findIndex((entry) => entry.id === attempt.id);
  const quizzes =
    index >= 0
      ? state.quizzes.map((entry) => (entry.id === attempt.id ? attempt : entry))
      : [...state.quizzes, attempt];

  return {
    ...state,
    updatedAt: now.toISOString(),
    quizzes,
  };
}

export interface CompleteQuizOptions {
  readonly now?: Date;
}

/**
 * Completion is the only place a quiz becomes history. It also links and closes
 * the matching milestone, and records one quiz on the activity day.
 */
export function completeQuizAttempt(
  state: UserStateV1,
  attemptId: string,
  outcomes: readonly QuizQuestionOutcome[],
  options: CompleteQuizOptions = {},
): UserStateV1 {
  const at = options.now ?? new Date();
  const attempt = state.quizzes.find((entry) => entry.id === attemptId);
  if (!attempt || attempt.status === 'completed') {
    return state;
  }

  const updates = new Map(
    outcomes.map((outcome) => [outcome.questionId, outcome]),
  );
  const questions = attempt.questions.map((outcome) => {
    const update = updates.get(outcome.questionId);
    return update ? { ...outcome, ...update } : outcome;
  });

  const completed: QuizAttempt = {
    ...attempt,
    questions,
    status: 'completed',
    completedAt: at.toISOString(),
    durationSeconds: Math.max(
      0,
      Math.floor((at.getTime() - Date.parse(attempt.startedAt)) / 1_000),
    ),
  };

  const date = toLocalDateKey(at);
  const currentDay = state.activity.days[date] ?? emptyDay(date);
  const milestoneEntry = Object.values(state.milestones).find(
    (milestone) =>
      milestone.status !== 'completed' && scopeMatches(completed, milestone),
  );

  const milestones = milestoneEntry
    ? {
        ...state.milestones,
        [milestoneEntry.id]: {
          ...milestoneEntry,
          status: 'completed' as const,
          quizAttemptId: completed.id,
          completedAt: at.toISOString(),
        },
      }
    : state.milestones;

  return {
    ...state,
    updatedAt: at.toISOString(),
    quizzes: state.quizzes.map((entry) =>
      entry.id === completed.id ? completed : entry,
    ),
    milestones,
    activity: {
      ...state.activity,
      days: {
        ...state.activity.days,
        [date]: {
          ...currentDay,
          quizzesCompleted: currentDay.quizzesCompleted + 1,
        },
      },
    },
  };
}

export function pendingMilestones(state: UserStateV1): Milestone[] {
  return Object.values(state.milestones)
    .filter((milestone) => milestone.status !== 'completed')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function milestoneAttempt(
  state: UserStateV1,
  milestone: Milestone,
): QuizAttempt | null {
  if (milestone.quizAttemptId) {
    return (
      state.quizzes.find((attempt) => attempt.id === milestone.quizAttemptId) ??
      null
    );
  }

  const inProgress = state.quizzes.find(
    (attempt) =>
      attempt.status === 'in-progress' && scopeMatches(attempt, milestone),
  );
  return inProgress ?? null;
}

export function latestMilestoneAttempt(
  state: UserStateV1,
  milestone: Milestone,
): QuizAttempt | null {
  const completed = state.quizzes
    .filter(
      (attempt) =>
        attempt.status === 'completed' && scopeMatches(attempt, milestone),
    )
    .sort((a, b) =>
      (b.completedAt ?? '').localeCompare(a.completedAt ?? ''),
    );
  return completed[0] ?? null;
}
