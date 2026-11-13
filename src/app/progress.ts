import type { UserStateV1 } from '@/lib/state/schema.js';

/**
 * Momentum is a read-only interpretation of the notebook. It is deliberately
 * derived from persisted work, never stored, so a backup or reset cannot leave
 * a stale score behind.
 */
const XP = {
  lessonOpened: 15,
  lessonDone: 40,
  recallPassed: 25,
  exercisePassed: 25,
  note: 8,
  noteCap: 25,
  review: 4,
  quiz: 40,
} as const;

export const RANKS = [
  {
    name: 'Curious',
    xp: 0,
    tone: 'sky',
    blurb: 'The lab is open. Pick up the first tool.',
  },
  {
    name: 'Tinkerer',
    xp: 120,
    tone: 'teal',
    blurb: 'You are taking things apart on purpose now.',
  },
  {
    name: 'Builder',
    xp: 300,
    tone: 'ochre',
    blurb: 'Ideas are turning into things that run.',
  },
  {
    name: 'Debugger',
    xp: 650,
    tone: 'plum',
    blurb: 'You can follow a failure to its real cause.',
  },
  {
    name: 'Systems Thinker',
    xp: 1_100,
    tone: 'indigo',
    blurb: 'The pieces are becoming one machine in your head.',
  },
  {
    name: 'Field Engineer',
    xp: 1_800,
    tone: 'rose',
    blurb: 'You can reason about code in the wild.',
  },
  {
    name: 'Foundation Keeper',
    xp: 2_800,
    tone: 'moss',
    blurb: 'You know how the ground under the code is built.',
  },
] as const;

export type RankTone = (typeof RANKS)[number]['tone'];

export interface Achievement {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly tone: string;
  readonly earned: boolean;
}

export interface Momentum {
  readonly xp: number;
  readonly rank: (typeof RANKS)[number];
  readonly rankIndex: number;
  readonly nextRank: (typeof RANKS)[number] | null;
  readonly xpIntoRank: number;
  readonly rankSpan: number;
  readonly ringProgress: number;
  readonly lessonsOpened: number;
  readonly lessonsDone: number;
  readonly lessonsMastered: number;
  readonly recallPasses: number;
  readonly exercisesPassed: number;
  readonly notes: number;
  readonly achievements: readonly Achievement[];
  readonly earnedAchievements: number;
}

export function deriveMomentum(data: UserStateV1): Momentum {
  const progress = Object.values(data.lessons);
  const lessonsOpened = progress.length;
  const lessonsDone = progress.filter((entry) => entry.doneAt !== null).length;
  const recallPasses = progress.filter(
    (entry) => entry.recall.passedAt !== null,
  ).length;
  const exercisesPassed = progress.filter(
    (entry) => entry.exercise.passedAt !== null,
  ).length;
  const lessonsMastered = progress.filter(
    (entry) =>
      entry.doneAt !== null &&
      entry.recall.passedAt !== null &&
      entry.exercise.passedAt !== null,
  ).length;
  const notes = Object.keys(data.notes).length;
  const reviews = data.review.logs.length;
  const quizzes = data.quizzes.filter(
    (attempt) => attempt.status === 'completed',
  ).length;

  const xp =
    lessonsOpened * XP.lessonOpened +
    lessonsDone * XP.lessonDone +
    recallPasses * XP.recallPassed +
    exercisesPassed * XP.exercisePassed +
    Math.min(notes, XP.noteCap) * XP.note +
    reviews * XP.review +
    quizzes * XP.quiz;

  let rankIndex = 0;
  for (let index = RANKS.length - 1; index >= 0; index -= 1) {
    const candidate = RANKS[index];
    if (candidate && xp >= candidate.xp) {
      rankIndex = index;
      break;
    }
  }

  const rank = RANKS[rankIndex] ?? RANKS[0];
  const nextRank = RANKS[rankIndex + 1] ?? null;
  const xpIntoRank = xp - rank.xp;
  const rankSpan = nextRank ? nextRank.xp - rank.xp : 1;
  const ringProgress = nextRank
    ? Math.min(1, Math.max(0, xpIntoRank / rankSpan))
    : 1;

  const achievements: Achievement[] = [
    {
      id: 'first-spark',
      title: 'First spark',
      detail: 'Open your first lesson.',
      tone: 'sky',
      earned: lessonsOpened > 0,
    },
    {
      id: 'first-finish',
      title: 'One small ship',
      detail: 'Mark a lesson done.',
      tone: 'moss',
      earned: lessonsDone > 0,
    },
    {
      id: 'loop-closed',
      title: 'Full loop',
      detail: 'Master a lesson: done, recall, and build.',
      tone: 'ochre',
      earned: lessonsMastered > 0,
    },
    {
      id: 'recall-run',
      title: 'Memory wired',
      detail: 'Pass a recall check.',
      tone: 'indigo',
      earned: recallPasses > 0,
    },
    {
      id: 'builder',
      title: 'Built by hand',
      detail: 'Pass an exercise rubric.',
      tone: 'teal',
      earned: exercisesPassed > 0,
    },
    {
      id: 'first-note',
      title: 'Hop on',
      detail: 'Write your first note.',
      tone: 'rose',
      earned: notes > 0,
    },
    {
      id: 'notebook-three',
      title: 'Field notes',
      detail: 'Keep three notes.',
      tone: 'plum',
      earned: notes >= 3,
    },
    {
      id: 'triple-mastery',
      title: 'Constellation',
      detail: 'Master three lessons.',
      tone: 'sun',
      earned: lessonsMastered >= 3,
    },
    {
      id: 'ten-notes',
      title: 'Archivist',
      detail: 'Keep ten notes.',
      tone: 'rose',
      earned: notes >= 10,
    },
    {
      id: 'reviewer',
      title: 'Kept sharp',
      detail: 'Finish a review session.',
      tone: 'indigo',
      earned: reviews > 0,
    },
  ];

  return {
    xp,
    rank,
    rankIndex,
    nextRank,
    xpIntoRank,
    rankSpan,
    ringProgress,
    lessonsOpened,
    lessonsDone,
    lessonsMastered,
    recallPasses,
    exercisesPassed,
    notes,
    achievements,
    earnedAchievements: achievements.filter((entry) => entry.earned).length,
  };
}

const LEVEL_TONES = [
  'rose',
  'ochre',
  'teal',
  'indigo',
  'plum',
  'moss',
  'oxide',
  'sky',
  'sun',
  'indigo',
  'rose',
] as const;

export function toneForLevel(index: number): (typeof LEVEL_TONES)[number] {
  return LEVEL_TONES[index % LEVEL_TONES.length] ?? 'rose';
}

