import {
  SM2_DEFAULT_EASE_FACTOR,
  SM2_MIN_EASE_FACTOR,
  type SrsCard,
  type SrsRating,
} from './schema.js';

const DAY_MS = 86_400_000;

function addDays(at: Date, days: number): Date {
  return new Date(at.getTime() + days * DAY_MS);
}

/**
 * SM-2 quality adjustment. A perfect answer nudges ease up, a good answer keeps
 * it, and every failed recall makes the next interval shorter.
 */
export function adjustEaseFactor(easeFactor: number, rating: SrsRating): number {
  const delta =
    0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02);
  return Math.min(5, Math.max(SM2_MIN_EASE_FACTOR, easeFactor + delta));
}

export interface CreateCardOptions {
  readonly now?: Date;
}

/**
 * A card starts due immediately. The normal creation path is a recall attempt,
 * which grades the card at the same time and therefore schedules it forward.
 */
export function createSrsCard(
  questionId: string,
  conceptIds: readonly string[],
  options: CreateCardOptions = {},
): SrsCard {
  const now = options.now ?? new Date();
  const timestamp = now.toISOString();

  return {
    questionId,
    conceptIds: [...conceptIds].slice(0, 6),
    phase: 'new',
    easeFactor: SM2_DEFAULT_EASE_FACTOR,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    dueAt: timestamp,
    lastReviewedAt: null,
    lastRating: null,
    createdAt: timestamp,
  };
}

export interface ScheduleReviewOptions {
  readonly now?: Date;
}

/**
 * Apply one SM-2 grade to a card. This is a pure function: the same card,
 * rating, and clock always produce the same next card.
 */
export function scheduleReview(
  card: SrsCard,
  rating: SrsRating,
  options: ScheduleReviewOptions = {},
): SrsCard {
  const now = options.now ?? new Date();
  const easeFactor = adjustEaseFactor(card.easeFactor, rating);

  if (rating < 3) {
    return {
      ...card,
      phase: 'relearning',
      easeFactor,
      intervalDays: 1,
      repetitions: 0,
      lapses: card.lapses + 1,
      dueAt: addDays(now, 1).toISOString(),
      lastReviewedAt: now.toISOString(),
      lastRating: rating,
    };
  }

  const repetitions = card.repetitions + 1;
  const intervalDays =
    repetitions === 1
      ? 1
      : repetitions === 2
        ? 6
        : Math.max(1, Math.round(card.intervalDays * easeFactor));

  return {
    ...card,
    phase: 'review',
    easeFactor,
    intervalDays,
    repetitions,
    dueAt: addDays(now, intervalDays).toISOString(),
    lastReviewedAt: now.toISOString(),
    lastRating: rating,
  };
}

export function isCardDue(card: SrsCard, now: Date = new Date()): boolean {
  return Date.parse(card.dueAt) <= now.getTime();
}

export function daysOverdue(card: SrsCard, now: Date = new Date()): number {
  const overdueMs = now.getTime() - Date.parse(card.dueAt);
  return Math.max(0, Math.floor(overdueMs / DAY_MS));
}
