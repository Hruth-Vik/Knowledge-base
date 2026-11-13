import type { UserStateV1 } from './schema.js';

export interface CreateEmptyUserStateOptions {
  readonly now?: Date;
  readonly activeLanguageId?: string;
}

export function createEmptyUserState(
  options: CreateEmptyUserStateOptions = {},
): UserStateV1 {
  const now = (options.now ?? new Date()).toISOString();

  return {
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
    settings: {
      activeLanguageId: options.activeLanguageId ?? 'java',
      theme: 'system',
      dailyGoalLessons: 1,
    },
    lessons: {},
    review: {
      cards: {},
      logs: [],
    },
    quizzes: [],
    milestones: {},
    notes: {},
    map: {
      nodes: {},
      edges: {},
      positions: {
        radial: {},
        dependency: {},
        cluster: {},
      },
    },
    activity: {
      days: {},
    },
    streak: {
      restDayTokens: 1,
      lastTokenGrantedOn: null,
      restDays: [],
    },
  };
}
