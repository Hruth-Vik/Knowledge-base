import { z } from 'zod';
import {
  CodeLanguageSchema,
  MarkdownSchema,
  NonEmptyTextSchema,
  SlugSchema,
  StableIdSchema,
  lineCount,
  referencedPlaceholders,
  strictObject,
  uniqueStrings,
} from './primitives.js';

const QuestionBaseShape = {
  id: StableIdSchema,
  concepts: z.array(StableIdSchema).min(1).max(6),
  prompt: MarkdownSchema(4, 1_200),
  explanation: MarkdownSchema(4, 2_000),
};

const MultipleChoiceQuestionSchema = strictObject({
  ...QuestionBaseShape,
  type: z.literal('multiple-choice'),
  options: z
    .array(
      strictObject({
        id: SlugSchema,
        text: NonEmptyTextSchema.max(500),
      }),
    )
    .min(3)
    .max(6),
  correctOptionId: SlugSchema,
});

const PredictOutputQuestionSchema = strictObject({
  ...QuestionBaseShape,
  type: z.literal('predict-output'),
  code: z.string().min(1).max(3_000),
  codeLanguage: CodeLanguageSchema,
  expectedOutput: NonEmptyTextSchema.max(1_000),
  acceptedOutputs: z.array(NonEmptyTextSchema.max(1_000)).min(1).max(8).optional(),
});

const SpotTheBugQuestionSchema = strictObject({
  ...QuestionBaseShape,
  type: z.literal('spot-the-bug'),
  code: z.string().min(1).max(4_000),
  codeLanguage: CodeLanguageSchema,
  bugLine: z.number().int().positive(),
  bugSummary: NonEmptyTextSchema.max(500),
});

const OrderTheStepsQuestionSchema = strictObject({
  ...QuestionBaseShape,
  type: z.literal('order-the-steps'),
  items: z
    .array(
      strictObject({
        id: SlugSchema,
        text: NonEmptyTextSchema.max(400),
      }),
    )
    .min(3)
    .max(8),
  correctOrder: z.array(SlugSchema).min(3).max(8),
});

const ExplainQuestionSchema = strictObject({
  ...QuestionBaseShape,
  type: z.literal('explain'),
  keyPoints: z.array(NonEmptyTextSchema.max(400)).min(3).max(6),
  modelAnswer: MarkdownSchema(20, 2_500),
});

const FillCodeQuestionSchema = strictObject({
  ...QuestionBaseShape,
  type: z.literal('fill-the-code'),
  template: z.string().min(1).max(3_000),
  codeLanguage: CodeLanguageSchema,
  blanks: z
    .array(
      strictObject({
        id: SlugSchema,
        acceptedAnswers: z.array(NonEmptyTextSchema.max(300)).min(1).max(6),
        hint: NonEmptyTextSchema.max(300),
      }),
    )
    .min(1)
    .max(6),
});

export const QuestionSchema = z
  .discriminatedUnion('type', [
    MultipleChoiceQuestionSchema,
    PredictOutputQuestionSchema,
    SpotTheBugQuestionSchema,
    OrderTheStepsQuestionSchema,
    ExplainQuestionSchema,
    FillCodeQuestionSchema,
  ])
  .superRefine((question, ctx) => {
    const addIssue = (path: string[], message: string): void => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path,
        message,
      });
    };

    if (question.type === 'multiple-choice') {
      const optionIds = question.options.map((option) => option.id);
      if (!uniqueStrings(optionIds)) {
        addIssue(['options'], 'Option IDs must be unique.');
      }
      if (!optionIds.includes(question.correctOptionId)) {
        addIssue(
          ['correctOptionId'],
          'The correct option must exist in options.',
        );
      }
      return;
    }

    if (question.type === 'spot-the-bug') {
      if (question.bugLine > lineCount(question.code)) {
        addIssue(
          ['bugLine'],
          'The bug line must exist in the supplied code.',
        );
      }
      return;
    }

    if (question.type === 'order-the-steps') {
      const itemIds = question.items.map((item) => item.id);
      if (!uniqueStrings(itemIds)) {
        addIssue(['items'], 'Step IDs must be unique.');
      }
      if (
        question.correctOrder.length !== itemIds.length ||
        !question.correctOrder.every((id) => itemIds.includes(id)) ||
        !uniqueStrings(question.correctOrder)
      ) {
        addIssue(
          ['correctOrder'],
          'Correct order must contain every step ID exactly once.',
        );
      }
      return;
    }

    if (question.type === 'fill-the-code') {
      const blankIds = question.blanks.map((blank) => blank.id);
      if (!uniqueStrings(blankIds)) {
        addIssue(['blanks'], 'Blank IDs must be unique.');
      }

      const placeholders = referencedPlaceholders(question.template);
      if (!uniqueStrings(placeholders)) {
        addIssue(
          ['template'],
          'Each code blank may appear only once.',
        );
      }

      const missing = blankIds.filter((id) => !placeholders.includes(id));
      const orphaned = placeholders.filter((id) => !blankIds.includes(id));
      if (missing.length > 0) {
        addIssue(
          ['template'],
          `Template is missing placeholders for: ${missing.join(', ')}.`,
        );
      }
      if (orphaned.length > 0) {
        addIssue(
          ['template'],
          `Template contains undeclared blanks: ${orphaned.join(', ')}.`,
        );
      }
    }
  });

export const RecallCheckSchema = z
  .array(QuestionSchema)
  .length(3, 'Every lesson needs exactly three recall-check questions.');

export type Question = z.infer<typeof QuestionSchema>;
export type MultipleChoiceQuestion = Extract<
  Question,
  { type: 'multiple-choice' }
>;
export type PredictOutputQuestion = Extract<
  Question,
  { type: 'predict-output' }
>;
export type SpotTheBugQuestion = Extract<Question, { type: 'spot-the-bug' }>;
export type OrderTheStepsQuestion = Extract<
  Question,
  { type: 'order-the-steps' }
>;
export type ExplainQuestion = Extract<Question, { type: 'explain' }>;
export type FillCodeQuestion = Extract<Question, { type: 'fill-the-code' }>;
