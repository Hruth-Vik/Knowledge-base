import { z } from 'zod';
import {
  MarkdownSchema,
  ShortTextSchema,
  SlugSchema,
  StableIdSchema,
  strictObject,
} from './primitives.js';

export const LanguageStatusSchema = z.enum(['available', 'coming-soon']);

export const ExerciseModeSchema = z.enum([
  'rubric-self-check',
  'in-browser-tests',
]);

export const LanguageManifestSchema = strictObject({
  id: SlugSchema,
  order: z.number().int().nonnegative(),
  name: ShortTextSchema(40),
  shortName: ShortTextSchema(12),
  status: LanguageStatusSchema,
  baseline: ShortTextSchema(80).nullable(),
  description: MarkdownSchema(20, 500),
  exerciseMode: ExerciseModeSchema,
}).superRefine((language, ctx) => {
  if (language.status === 'available' && language.baseline === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['baseline'],
      message: 'An available language must declare its baseline runtime version.',
    });
  }
  if (language.status === 'coming-soon' && language.exerciseMode === 'in-browser-tests') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['exerciseMode'],
      message: 'Do not advertise an execution mode that the coming-soon pack does not implement.',
    });
  }
});

export const LevelManifestSchema = strictObject({
  id: StableIdSchema,
  language: SlugSchema,
  index: z.number().int().min(0).max(99),
  title: ShortTextSchema(80),
  deck: ShortTextSchema(160),
  outcome: MarkdownSchema(20, 420),
});

export type LanguageManifest = z.infer<typeof LanguageManifestSchema>;
export type LevelManifest = z.infer<typeof LevelManifestSchema>;
export type LanguageStatus = z.infer<typeof LanguageStatusSchema>;
export type ExerciseMode = z.infer<typeof ExerciseModeSchema>;
