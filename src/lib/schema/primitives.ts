import { z } from 'zod';

export const stableIdPattern = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * A stable identifier. IDs are persisted in user data, URLs, and notes.
 * Renaming one is a content migration, not a copy edit.
 */
export const StableIdSchema = z
  .string()
  .min(3)
  .max(140)
  .regex(
    stableIdPattern,
    'Use lowercase letters, digits, dots, or hyphens; start and end with a letter or digit.',
  );

export const SlugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(slugPattern, 'Use lowercase letters, digits, and single hyphens.');

export const NonEmptyTextSchema = z.string().trim().min(1);

export const ShortTextSchema = (max = 180) => NonEmptyTextSchema.max(max);

export const MarkdownSchema = (min = 1, max = 12_000) =>
  NonEmptyTextSchema.min(min).max(max);

export const CalendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a calendar date in YYYY-MM-DD form.')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
  }, 'Use a real calendar date.');

export const IsoDateTimeSchema = z
  .string()
  .datetime({ offset: true, message: 'Use an ISO-8601 timestamp with an offset.' });

export const CodeLanguageSchema = z.enum([
  'java',
  'python',
  'javascript',
  'typescript',
  'sql',
  'bash',
  'shell',
  'json',
  'yaml',
  'xml',
  'properties',
  'html',
  'text',
]);

export const DifficultySchema = z.enum(['junior', 'mid', 'senior']);

export const ThemeSchema = z.enum(['system', 'light', 'dark']);

export const strictObject = <Shape extends z.ZodRawShape>(shape: Shape) =>
  z.object(shape).strict();

export function lineCount(code: string): number {
  return code.replace(/\s+$/, '').split(/\r?\n/).length;
}

export function referencedPlaceholders(template: string): string[] {
  return [...template.matchAll(/\{\{\s*([a-z0-9][a-z0-9-]*)\s*\}\}/g)].map(
    (match) => match[1] ?? '',
  );
}

export function uniqueStrings(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}
