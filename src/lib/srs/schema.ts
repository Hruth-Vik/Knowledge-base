import { z } from 'zod';
import {
  IsoDateTimeSchema,
  StableIdSchema,
  strictObject,
} from '../schema/primitives.js';

/**
 * SM-2 quality grade.
 * 0–2 means the answer was not recalled. 3–5 means it was.
 * The scheduler is implemented in Stage 5; this schema is the persisted shape.
 */
export const SrsRatingSchema = z.number().int().min(0).max(5);

export const SrsPhaseSchema = z.enum([
  'new',
  'learning',
  'review',
  'relearning',
]);

export const SrsCardSchema = strictObject({
  questionId: StableIdSchema,
  conceptIds: z.array(StableIdSchema).min(1).max(6),
  phase: SrsPhaseSchema,
  easeFactor: z.number().min(1.3).max(5),
  intervalDays: z.number().int().min(0).max(36_500),
  repetitions: z.number().int().nonnegative(),
  lapses: z.number().int().nonnegative(),
  dueAt: IsoDateTimeSchema,
  lastReviewedAt: IsoDateTimeSchema.nullable(),
  lastRating: SrsRatingSchema.nullable(),
  createdAt: IsoDateTimeSchema,
});

export const SM2_DEFAULT_EASE_FACTOR = 2.5;
export const SM2_MIN_EASE_FACTOR = 1.3;

export type SrsRating = z.infer<typeof SrsRatingSchema>;
export type SrsPhase = z.infer<typeof SrsPhaseSchema>;
export type SrsCard = z.infer<typeof SrsCardSchema>;
