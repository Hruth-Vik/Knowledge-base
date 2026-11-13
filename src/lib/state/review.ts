import {
  createSrsCard,
  daysOverdue,
  isCardDue,
  scheduleReview,
  type SrsCard,
  type SrsRating,
} from '../srs/index.js';
import { toLocalDateKey } from './activity.js';
import type { ActivityDay, ReviewLog, UserStateV1 } from './schema.js';

export interface RecallCardInput {
  readonly questionId: string;
  readonly conceptIds: readonly string[];
  readonly correct: boolean;
}

export interface GradeReviewOptions {
  readonly now?: Date;
  readonly logId?: string;
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

function recordReviewActivity(
  state: UserStateV1,
  at: Date,
  count = 1,
): UserStateV1 {
  const date = toLocalDateKey(at);
  const current = state.activity.days[date] ?? emptyDay(date);

  return {
    ...state,
    activity: {
      ...state.activity,
      days: {
        ...state.activity.days,
        [date]: {
          ...current,
          reviewsCompleted: current.reviewsCompleted + count,
        },
      },
    },
  };
}

/**
 * A recall attempt is the first exposure, not a scheduled review. It creates the
 * card if needed and grades it so the first genuine review lands tomorrow. It
 * does not append a review log or count as review activity.
 */
export function syncCardsFromRecall(
  state: UserStateV1,
  answers: readonly RecallCardInput[],
  at: Date = new Date(),
): UserStateV1 {
  if (answers.length === 0) {
    return state;
  }

  const cards = { ...state.review.cards };

  for (const answer of answers) {
    const existing = cards[answer.questionId];
    const card =
      existing ??
      createSrsCard(answer.questionId, answer.conceptIds, { now: at });
    cards[answer.questionId] = scheduleReview(
      card,
      answer.correct ? 4 : 2,
      { now: at },
    );
  }

  return {
    ...state,
    updatedAt: at.toISOString(),
    review: {
      ...state.review,
      cards,
    },
  };
}

/**
 * Grade one due (or early) card. Mastery evidence on the lesson is untouched:
 * a weak review moves the concept toward decay, it does not erase history.
 */
export function gradeReview(
  state: UserStateV1,
  questionId: string,
  rating: SrsRating,
  options: GradeReviewOptions = {},
): UserStateV1 {
  const at = options.now ?? new Date();
  const card = state.review.cards[questionId];
  if (!card) {
    return state;
  }

  const next = scheduleReview(card, rating, { now: at });
  const log: ReviewLog = {
    id: options.logId ?? globalThis.crypto.randomUUID(),
    questionId,
    conceptIds: card.conceptIds,
    reviewedAt: at.toISOString(),
    rating,
    wasDue: isCardDue(card, at),
    intervalBeforeDays: card.intervalDays,
    intervalAfterDays: next.intervalDays,
    easeAfter: next.easeFactor,
  };

  const withReview: UserStateV1 = {
    ...state,
    updatedAt: at.toISOString(),
    review: {
      cards: {
        ...state.review.cards,
        [questionId]: next,
      },
      logs: [...state.review.logs, log],
    },
  };

  return recordReviewActivity(withReview, at);
}

export interface DueCard {
  readonly card: SrsCard;
  readonly overdueDays: number;
}

export function getDueCards(
  state: UserStateV1,
  now: Date = new Date(),
): DueCard[] {
  return Object.values(state.review.cards)
    .filter((card) => isCardDue(card, now))
    .map((card) => ({ card, overdueDays: daysOverdue(card, now) }))
    .sort((a, b) => {
      if (a.card.dueAt !== b.card.dueAt) {
        return a.card.dueAt.localeCompare(b.card.dueAt);
      }
      return b.card.lapses - a.card.lapses;
    });
}

export function reviewReason(card: SrsCard, now: Date = new Date()): string {
  if (card.phase === 'new') {
    return 'First visit';
  }
  if (card.phase === 'relearning') {
    return 'Rebuilding after a missed recall';
  }
  if (card.lastRating !== null && card.lastRating <= 2) {
    return 'Last recall was weak';
  }
  const overdue = daysOverdue(card, now);
  if (overdue > 0) {
    return `${overdue} day${overdue === 1 ? '' : 's'} overdue`;
  }
  return 'Due now';
}
