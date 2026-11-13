import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { catalog } from '@/lib/content/catalog.js';
import {
  completeQuizAttempt,
  ensureMilestones,
  saveQuizAttempt,
  startMilestoneQuiz,
} from '@/lib/review/milestones.js';
import { createEmptyUserState } from '@/lib/state/initial.js';
import {
  recordRecallAttempt,
  saveExerciseDraft,
  setExercisePassed,
  setExerciseRubricCheck,
  setLessonDone,
  visitLesson,
  type RecallAnswerInput,
} from '@/lib/state/lesson.js';
import { gradeReview } from '@/lib/state/review.js';
import {
  UserStateV1Schema,
  type MapLayout,
  type Note,
  type QuizAttempt,
  type QuizQuestionOutcome,
  type Settings,
  type UserStateV1,
} from '@/lib/state/schema.js';
import {
  grantWeeklyRestToken,
  removeRestDay as removeRestDayInState,
  spendRestDay as spendRestDayInState,
} from '@/lib/state/streak.js';
import type { SrsRating } from '@/lib/srs/index.js';
import {
  getLastRawStorageValue,
  getStorageBackend,
  setStorageWritesBlocked,
  stateStorage,
  type StorageBackend,
} from '@/lib/storage/adapter.js';

const STORAGE_NAME = 'foundation.notebook';
const PERSIST_VERSION = 1;

const CORRUPT_RECORD_MESSAGE =
  'The saved notebook could not be read. Autosave is paused so the existing record is not overwritten.';

interface RecoveryNotice {
  readonly message: string;
  readonly raw: string | null;
}

export interface NoteInput {
  readonly title: string;
  readonly bodyMarkdown: string;
  readonly tags: readonly string[];
  readonly lessonId: string | null;
  readonly conceptIds: readonly string[];
}

function normalizeTags(tags: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of tags) {
    const trimmed = tag.trim().slice(0, 36);
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(trimmed);
    if (result.length === 12) {
      break;
    }
  }
  return result;
}

function normalizeConcepts(conceptIds: readonly string[]): string[] {
  return [...new Set(conceptIds.filter(Boolean))].slice(0, 30);
}

function noteTitle(input: NoteInput): string {
  const explicit = input.title.trim();
  if (explicit) {
    return explicit.slice(0, 160);
  }
  const firstLine = input.bodyMarkdown
    .split('\n')
    .map((line) => line.replace(/^#+\s*/, '').trim())
    .find((line) => line.length > 0);
  return (firstLine ?? 'Untitled note').slice(0, 160);
}

interface AppStore {
  readonly data: UserStateV1;
  readonly hasHydrated: boolean;
  readonly storageBackend: StorageBackend | null;
  readonly recovery: RecoveryNotice | null;
  setTheme(theme: Settings['theme']): void;
  setDailyGoal(goal: number): void;
  visitLesson(lessonId: string): void;
  setLessonDone(lessonId: string, done: boolean): void;
  recordRecallAttempt(lessonId: string, answers: readonly RecallAnswerInput[]): void;
  saveExerciseDraft(lessonId: string, draft: string): void;
  setExerciseRubricCheck(
    lessonId: string,
    rubricId: string,
    checked: boolean,
  ): void;
  setExercisePassed(lessonId: string, passed: boolean): void;
  gradeReview(questionId: string, rating: SrsRating): void;
  maintainStreak(): void;
  spendRestDay(dateKey: string): void;
  removeRestDay(dateKey: string): void;
  startMilestone(milestoneId: string): void;
  saveQuizAttempt(attempt: QuizAttempt): void;
  completeQuiz(
    attemptId: string,
    outcomes: readonly QuizQuestionOutcome[],
  ): void;
  recordInterviewAttempt(attempt: QuizAttempt): void;
  createNote(input: NoteInput): string;
  updateNote(noteId: string, input: NoteInput): void;
  deleteNote(noteId: string): void;
  saveMapPosition(
    layout: MapLayout,
    nodeId: string,
    position: { readonly x: number; readonly y: number },
  ): void;
  clearMapLayout(layout: MapLayout): void;
  replaceData(next: UserStateV1): boolean;
  resetData(): void;
  finishHydration(error?: unknown): void;
  setStorageBackend(backend: StorageBackend): void;
}

interface PersistedStore {
  readonly data: UserStateV1;
}

function withUpdatedTimestamp(state: UserStateV1): UserStateV1 {
  return {
    ...state,
    updatedAt: new Date().toISOString(),
  };
}

function serializeForRecovery(value: unknown): string | null {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return null;
  }
}

export const useAppStore = create<AppStore>()(
  persist<AppStore, [], [], PersistedStore>(
    (set) => ({
      data: createEmptyUserState(),
      hasHydrated: false,
      storageBackend: null,
      recovery: null,

      setTheme(theme) {
        set((state) => ({
          data: withUpdatedTimestamp({
            ...state.data,
            settings: {
              ...state.data.settings,
              theme,
            },
          }),
        }));
      },

      setDailyGoal(goal) {
        const boundedGoal = Math.min(3, Math.max(1, Math.trunc(goal)));
        set((state) => ({
          data: withUpdatedTimestamp({
            ...state.data,
            settings: {
              ...state.data.settings,
              dailyGoalLessons: boundedGoal,
            },
          }),
        }));
      },

      visitLesson(lessonId) {
        set((state) => ({ data: visitLesson(state.data, lessonId) }));
      },

      setLessonDone(lessonId, done) {
        const now = new Date();
        set((state) => {
          const next = setLessonDone(state.data, lessonId, done, now);
          return {
            data: done
              ? ensureMilestones(next, catalog, now)
              : next,
          };
        });
      },

      recordRecallAttempt(lessonId, answers) {
        set((state) => ({
          data: recordRecallAttempt(state.data, lessonId, answers),
        }));
      },

      saveExerciseDraft(lessonId, draft) {
        set((state) => ({
          data: saveExerciseDraft(state.data, lessonId, draft),
        }));
      },

      setExerciseRubricCheck(lessonId, rubricId, checked) {
        set((state) => ({
          data: setExerciseRubricCheck(
            state.data,
            lessonId,
            rubricId,
            checked,
          ),
        }));
      },

      setExercisePassed(lessonId, passed) {
        set((state) => ({
          data: setExercisePassed(state.data, lessonId, passed),
        }));
      },

      gradeReview(questionId, rating) {
        set((state) => ({
          data: gradeReview(state.data, questionId, rating),
        }));
      },

      maintainStreak() {
        set((state) => ({
          data: grantWeeklyRestToken(state.data),
        }));
      },

      spendRestDay(dateKey) {
        set((state) => ({
          data: spendRestDayInState(state.data, dateKey),
        }));
      },

      removeRestDay(dateKey) {
        set((state) => ({
          data: removeRestDayInState(state.data, dateKey),
        }));
      },

      startMilestone(milestoneId) {
        const now = new Date();
        set((state) => ({
          data: startMilestoneQuiz(state.data, catalog, milestoneId, { now }),
        }));
      },

      saveQuizAttempt(attempt) {
        set((state) => ({
          data: saveQuizAttempt(state.data, attempt),
        }));
      },

      completeQuiz(attemptId, outcomes) {
        set((state) => ({
          data: completeQuizAttempt(state.data, attemptId, outcomes),
        }));
      },

      recordInterviewAttempt(attempt) {
        const now = new Date();
        set((state) => {
          const saved = saveQuizAttempt(state.data, attempt, now);
          return {
            data: completeQuizAttempt(saved, attempt.id, attempt.questions, {
              now,
            }),
          };
        });
      },

      createNote(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const note: Note = {
          id,
          title: noteTitle(input),
          bodyMarkdown: input.bodyMarkdown.slice(0, 200_000),
          tags: normalizeTags(input.tags),
          lessonId: input.lessonId?.trim() || null,
          conceptIds: normalizeConcepts(input.conceptIds),
          excerpt: null,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          data: withUpdatedTimestamp({
            ...state.data,
            notes: { ...state.data.notes, [id]: note },
          }),
        }));
        return id;
      },

      updateNote(noteId, input) {
        set((state) => {
          const existing = state.data.notes[noteId];
          if (!existing) {
            return state;
          }
          const next: Note = {
            ...existing,
            title: noteTitle(input),
            bodyMarkdown: input.bodyMarkdown.slice(0, 200_000),
            tags: normalizeTags(input.tags),
            lessonId: input.lessonId?.trim() || null,
            conceptIds: normalizeConcepts(input.conceptIds),
            updatedAt: new Date().toISOString(),
          };
          return {
            data: withUpdatedTimestamp({
              ...state.data,
              notes: { ...state.data.notes, [noteId]: next },
            }),
          };
        });
      },

      deleteNote(noteId) {
        set((state) => {
          if (!state.data.notes[noteId]) {
            return state;
          }
          const notes = { ...state.data.notes };
          delete notes[noteId];
          return {
            data: withUpdatedTimestamp({ ...state.data, notes }),
          };
        });
      },

      saveMapPosition(layout, nodeId, position) {
        if (
          !nodeId ||
          !Number.isFinite(position.x) ||
          !Number.isFinite(position.y)
        ) {
          return;
        }
        set((state) => ({
          data: withUpdatedTimestamp({
            ...state.data,
            map: {
              ...state.data.map,
              positions: {
                ...state.data.map.positions,
                [layout]: {
                  ...state.data.map.positions[layout],
                  [nodeId]: { x: position.x, y: position.y },
                },
              },
            },
          }),
        }));
      },

      clearMapLayout(layout) {
        set((state) => ({
          data: withUpdatedTimestamp({
            ...state.data,
            map: {
              ...state.data.map,
              positions: {
                ...state.data.map.positions,
                [layout]: {},
              },
            },
          }),
        }));
      },

      replaceData(next) {
        const parsed = UserStateV1Schema.safeParse(next);
        if (!parsed.success) {
          return false;
        }

        setStorageWritesBlocked(false);
        set({
          data: parsed.data,
          recovery: null,
        });
        return true;
      },

      resetData() {
        setStorageWritesBlocked(false);
        set({
          data: createEmptyUserState(),
          recovery: null,
          hasHydrated: true,
        });
      },

      finishHydration(error) {
        if (error) {
          setStorageWritesBlocked(true);
          set({
            hasHydrated: true,
            recovery: {
              message: CORRUPT_RECORD_MESSAGE,
              raw: getLastRawStorageValue(),
            },
          });
          return;
        }

        set((state) => {
          if (state.recovery) {
            setStorageWritesBlocked(true);
          }
          return { hasHydrated: true };
        });
      },

      setStorageBackend(backend) {
        set({ storageBackend: backend });
      },
    }),
    {
      name: STORAGE_NAME,
      version: PERSIST_VERSION,
      storage: createJSONStorage<PersistedStore>(() => stateStorage),
      partialize: (state) => ({ data: state.data }),

      /*
       * A version change must not silently discard the record. Pass the old
       * shape through to merge, where the Zod schema either accepts it or puts
       * the app into recovery mode.
       */
      migrate: (persistedState) => persistedState as PersistedStore,

      merge: (persistedState, currentState) => {
        const candidate =
          typeof persistedState === 'object' && persistedState !== null
            ? (persistedState as { data?: unknown }).data
            : undefined;

        if (candidate === undefined) {
          return currentState;
        }

        const parsed = UserStateV1Schema.safeParse(candidate);
        if (parsed.success) {
          return {
            ...currentState,
            data: parsed.data,
          };
        }

        return {
          ...currentState,
          recovery: {
            message: CORRUPT_RECORD_MESSAGE,
            raw: serializeForRecovery(persistedState),
          },
        };
      },

      onRehydrateStorage: (initialState) => (state, error) => {
        const target = state ?? initialState;
        target.finishHydration(error);
        void getStorageBackend().then((backend) =>
          target.setStorageBackend(backend),
        );
      },
    },
  ),
);

export { STORAGE_NAME };
