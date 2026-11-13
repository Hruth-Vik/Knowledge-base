import { z } from 'zod';
import {
  NonEmptyTextSchema,
  ShortTextSchema,
  StableIdSchema,
  strictObject,
  uniqueStrings,
} from './primitives.js';

export const ConceptKindSchema = z.enum([
  'mechanism',
  'principle',
  'term',
  'failure-mode',
]);

export const RelationshipTypeSchema = z.enum([
  'depends-on',
  'causes',
  'contrasts-with',
  'implemented-by',
  'commonly-confused-with',
]);

export const ConceptRelationshipSchema = strictObject({
  type: RelationshipTypeSchema,
  target: StableIdSchema,
});

/**
 * A concept is authored exactly once, in the lesson that introduces it.
 * The registry is compiled from these declarations and is the only source of
 * truth used by lessons, quizzes, notes, search, and the knowledge map.
 */
export const ConceptSchema = strictObject({
  id: StableIdSchema,
  title: ShortTextSchema(96),
  kind: ConceptKindSchema,
  summary: z
    .tuple([
      NonEmptyTextSchema.max(260),
      NonEmptyTextSchema.max(260),
      NonEmptyTextSchema.max(260),
    ])
    .describe('Exactly three short lines for the map node side panel.'),
  aliases: z.array(ShortTextSchema(64)).max(8),
  tags: z.array(ShortTextSchema(32)).min(1).max(4),
  relations: z.array(ConceptRelationshipSchema).max(8),
}).superRefine((concept, ctx) => {
  if (!uniqueStrings(concept.aliases)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['aliases'],
      message: 'Concept aliases must be unique.',
    });
  }
  if (!uniqueStrings(concept.tags)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['tags'],
      message: 'Concept tags must be unique.',
    });
  }

  const seenRelations = new Set<string>();
  for (const [index, relation] of concept.relations.entries()) {
    if (relation.target === concept.id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['relations', index, 'target'],
        message: 'A concept cannot relate to itself.',
      });
    }

    const key = `${relation.type}:${relation.target}`;
    if (seenRelations.has(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['relations', index],
        message: 'Duplicate relationship.',
      });
    }
    seenRelations.add(key);
  }
});

export type Concept = z.infer<typeof ConceptSchema>;
export type ConceptRelationship = z.infer<typeof ConceptRelationshipSchema>;
export type RelationshipType = z.infer<typeof RelationshipTypeSchema>;
