import { z } from 'zod';
import {
  CodeLanguageSchema,
  DifficultySchema,
  MarkdownSchema,
  NonEmptyTextSchema,
  ShortTextSchema,
  SlugSchema,
  StableIdSchema,
  lineCount,
  strictObject,
  uniqueStrings,
} from './primitives.js';
import { ConceptSchema } from './concept.js';
import { RecallCheckSchema } from './question.js';

const CodeAnnotationSchema = strictObject({
  line: z.number().int().positive(),
  note: NonEmptyTextSchema.max(420),
});

const CodeBlockShape = {
  filename: ShortTextSchema(100),
  language: CodeLanguageSchema,
  code: z.string().min(1).max(24_000),
  annotations: z.array(CodeAnnotationSchema).min(1).max(20),
  output: z.string().min(1).max(4_000).optional(),
};

const CodeFragmentSchema = strictObject({
  filename: ShortTextSchema(100),
  language: CodeLanguageSchema,
  code: z.string().min(1).max(12_000),
});

function makeCodeBlockSchema(minAnnotations: number, maxCodeLines: number) {
  return strictObject(CodeBlockShape).superRefine((block, ctx) => {
    const lines = lineCount(block.code);
    if (lines > maxCodeLines) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['code'],
        message: `Code must fit in ${maxCodeLines} lines. Split the idea instead of compressing it.`,
      });
    }
    if (block.annotations.length < minAnnotations) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['annotations'],
        message: `Add at least ${minAnnotations} line annotations.`,
      });
    }
    const seenLines = new Set<number>();
    for (const [index, annotation] of block.annotations.entries()) {
      if (annotation.line > lines) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['annotations', index, 'line'],
          message: `Line ${annotation.line} does not exist; the snippet has ${lines} lines.`,
        });
      }
      if (seenLines.has(annotation.line)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['annotations', index, 'line'],
          message: 'Annotate each line at most once.',
        });
      }
      seenLines.add(annotation.line);
    }
  });
}

const MinimalCodeBlockSchema = makeCodeBlockSchema(2, 14);
const RealisticCodeBlockSchema = makeCodeBlockSchema(3, 120);
const SolutionCodeBlockSchema = makeCodeBlockSchema(2, 200);

const DiagramNodeSchema = strictObject({
  id: SlugSchema,
  label: ShortTextSchema(72),
  detail: ShortTextSchema(120).optional(),
  x: z.number().finite().nonnegative(),
  y: z.number().finite().nonnegative(),
  width: z.number().finite().positive().max(640),
  height: z.number().finite().positive().max(240),
  shape: z.enum(['box', 'cylinder', 'stack', 'note', 'circle']),
  tone: z.enum(['neutral', 'accent', 'muted', 'correct', 'warning']),
});

const DiagramEdgeSchema = strictObject({
  from: SlugSchema,
  to: SlugSchema,
  label: ShortTextSchema(48).optional(),
  kind: z.enum(['flow', 'depends', 'contrast']),
});

const DiagramAnnotationSchema = strictObject({
  x: z.number().finite().nonnegative(),
  y: z.number().finite().nonnegative(),
  text: ShortTextSchema(180),
  align: z.enum(['left', 'right']).optional(),
});

export const MentalModelFigureSchema = strictObject({
  width: z.number().finite().min(320).max(1_200),
  height: z.number().finite().min(180).max(800),
  caption: ShortTextSchema(200),
  alt: MarkdownSchema(20, 1_000),
  nodes: z.array(DiagramNodeSchema).min(2).max(12),
  edges: z.array(DiagramEdgeSchema).max(16),
  annotations: z.array(DiagramAnnotationSchema).max(6),
}).superRefine((figure, ctx) => {
  const nodeIds = figure.nodes.map((node) => node.id);
  if (!uniqueStrings(nodeIds)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['nodes'],
      message: 'Diagram node IDs must be unique.',
    });
  }

  for (const [index, node] of figure.nodes.entries()) {
    if (node.x + node.width > figure.width || node.y + node.height > figure.height) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['nodes', index],
        message: 'Diagram node falls outside the figure viewport.',
      });
    }
  }

  for (const [index, edge] of figure.edges.entries()) {
    if (edge.from === edge.to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['edges', index],
        message: 'A diagram edge cannot point to its own node.',
      });
    }
    for (const endpoint of [edge.from, edge.to]) {
      if (!nodeIds.includes(endpoint)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['edges', index],
          message: `Unknown diagram node "${endpoint}".`,
        });
      }
    }
  }

  for (const [index, annotation] of figure.annotations.entries()) {
    if (annotation.x > figure.width || annotation.y > figure.height) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['annotations', index],
        message: 'Diagram annotation falls outside the figure viewport.',
      });
    }
  }
});

const AnalogySchema = strictObject({
  title: ShortTextSchema(100),
  body: MarkdownSchema(40, 1_800),
  mapping: z
    .array(
      strictObject({
        technical: ShortTextSchema(160),
        everyday: ShortTextSchema(180),
      }),
    )
    .min(3)
    .max(7),
  whereItBreaks: MarkdownSchema(30, 1_200),
});

const UnderTheHoodStepSchema = strictObject({
  title: ShortTextSchema(100),
  body: MarkdownSchema(30, 2_200),
  code: RealisticCodeBlockSchema.optional(),
});

const UnderTheHoodSchema = strictObject({
  intro: MarkdownSchema(30, 1_500),
  steps: z.array(UnderTheHoodStepSchema).min(3).max(8),
  outro: MarkdownSchema(20, 1_200).optional(),
});

const CodeSectionSchema = strictObject({
  intro: MarkdownSchema(20, 900),
  minimal: MinimalCodeBlockSchema,
  realistic: RealisticCodeBlockSchema,
});

const BreakItSchema = strictObject({
  title: ShortTextSchema(110),
  scenario: MarkdownSchema(30, 1_000),
  brokenCode: CodeFragmentSchema,
  predictionPrompt: MarkdownSchema(15, 500),
  failureKind: z.enum([
    'compile-time',
    'runtime',
    'logic',
    'resource',
    'concurrency',
    'configuration',
  ]),
  reveal: strictObject({
    observed: MarkdownSchema(10, 2_000),
    explanation: MarkdownSchema(40, 2_000),
    repair: MarkdownSchema(20, 1_500),
    correctedCode: CodeFragmentSchema.optional(),
  }),
});

const AiMistakeSchema = strictObject({
  title: ShortTextSchema(100),
  generatedPattern: MarkdownSchema(20, 1_200),
  whyItFails: MarkdownSchema(20, 1_200),
  correction: MarkdownSchema(20, 1_200),
  telltale: ShortTextSchema(240),
});

const AiMistakesSchema = strictObject({
  intro: MarkdownSchema(20, 800),
  mistakes: z.array(AiMistakeSchema).min(2).max(5),
  reviewChecklist: z.array(NonEmptyTextSchema.max(320)).min(3).max(8),
}).superRefine((section, ctx) => {
  if (!uniqueStrings(section.mistakes.map((mistake) => mistake.title))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['mistakes'],
      message: 'Mistake titles must be unique.',
    });
  }
});

const InterviewQuestionSchema = strictObject({
  id: StableIdSchema,
  difficulty: DifficultySchema,
  question: MarkdownSchema(12, 800),
  code: CodeFragmentSchema.optional(),
  modelAnswer: MarkdownSchema(40, 3_000),
  weakAnswer: MarkdownSchema(20, 1_000),
  strongAnswer: MarkdownSchema(20, 1_500),
  followUp: MarkdownSchema(12, 500),
});

const InterviewCornerSchema = strictObject({
  intro: MarkdownSchema(12, 500),
  questions: z.array(InterviewQuestionSchema).min(3).max(6),
}).superRefine((corner, ctx) => {
  const ids = corner.questions.map((question) => question.id);
  if (!uniqueStrings(ids)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['questions'],
      message: 'Interview question IDs must be unique.',
    });
  }

  for (const difficulty of DifficultySchema.options) {
    if (!corner.questions.some((question) => question.difficulty === difficulty)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['questions'],
        message: `Interview Corner needs at least one ${difficulty}-level question.`,
      });
    }
  }
});

const WriteFromScratchSchema = strictObject({
  title: ShortTextSchema(110),
  brief: MarkdownSchema(40, 1_800),
  constraints: z.array(NonEmptyTextSchema.max(320)).min(3).max(7),
  starterCode: strictObject({
    filename: ShortTextSchema(100),
    language: CodeLanguageSchema,
    code: z.string().max(6_000),
  }),
  referenceSolution: SolutionCodeBlockSchema,
  rubric: z
    .array(
      strictObject({
        id: SlugSchema,
        check: NonEmptyTextSchema.max(240),
        detail: MarkdownSchema(10, 700),
        mustPass: z.boolean(),
      }),
    )
    .min(3)
    .max(8),
  verification: z.array(NonEmptyTextSchema.max(500)).min(1).max(6),
}).superRefine((exercise, ctx) => {
  if (!uniqueStrings(exercise.rubric.map((item) => item.id))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['rubric'],
      message: 'Rubric IDs must be unique.',
    });
  }
  if (exercise.rubric.filter((item) => item.mustPass).length < 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['rubric'],
      message: 'At least two rubric checks must be hard requirements for mastery.',
    });
  }
});

const LessonSectionsSchema = strictObject({
  problem: MarkdownSchema(50, 1_800),
  analogy: AnalogySchema,
  mentalModel: strictObject({
    title: ShortTextSchema(110),
    figure: MentalModelFigureSchema,
  }),
  underTheHood: UnderTheHoodSchema,
  code: CodeSectionSchema,
  breakIt: BreakItSchema,
  aiMistakes: AiMistakesSchema,
  interviewCorner: InterviewCornerSchema,
  writeFromScratch: WriteFromScratchSchema,
  recap: z.array(NonEmptyTextSchema.max(320)).min(3).max(5),
});

export const LessonSchema = strictObject({
  formatVersion: z.literal(1),
  id: StableIdSchema,
  language: SlugSchema,
  levelId: StableIdSchema,
  chapter: strictObject({
    id: SlugSchema,
    title: ShortTextSchema(90),
  }),
  sequence: z.number().int().positive().max(999),
  slug: SlugSchema,
  title: ShortTextSchema(110),
  deck: ShortTextSchema(240),
  kind: z.enum(['standard', 'incident-story']),
  estimatedMinutes: z.number().int().min(10).max(20),
  tags: z.array(ShortTextSchema(36)).min(1).max(8),
  concepts: z.array(ConceptSchema).min(2).max(6),
  revisits: z.array(StableIdSchema).max(12),
  versionCaveats: z.array(NonEmptyTextSchema.max(300)).max(4).optional(),
  references: z
    .array(
      strictObject({
        title: ShortTextSchema(140),
        url: z.string().url().max(500),
        note: ShortTextSchema(220).optional(),
      }),
    )
    .max(5)
    .optional(),
  sections: LessonSectionsSchema,
  recallCheck: RecallCheckSchema,
}).superRefine((lesson, ctx) => {
  if (!uniqueStrings(lesson.tags)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['tags'],
      message: 'Lesson tags must be unique.',
    });
  }

  const conceptIds = lesson.concepts.map((concept) => concept.id);
  if (!uniqueStrings(conceptIds)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['concepts'],
      message: 'A lesson cannot introduce the same concept twice.',
    });
  }

  if (!uniqueStrings(lesson.revisits)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['revisits'],
      message: 'Revisited concepts must be unique.',
    });
  }

  const overlap = lesson.revisits.filter((id) => conceptIds.includes(id));
  if (overlap.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['revisits'],
      message: `These concepts are introduced by this lesson and cannot also be revisits: ${overlap.join(', ')}.`,
    });
  }

  const recallIds = lesson.recallCheck.map((question) => question.id);
  if (!uniqueStrings(recallIds)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['recallCheck'],
      message: 'Recall question IDs must be unique.',
    });
  }
});

export type LessonContent = z.infer<typeof LessonSchema>;
export type MentalModelFigure = z.infer<typeof MentalModelFigureSchema>;
export type InterviewQuestion = z.infer<typeof InterviewQuestionSchema>;
export type WriteFromScratch = z.infer<
  typeof LessonSectionsSchema
>['writeFromScratch'];

/**
 * Identity helper used by content modules. Validation is intentionally done by
 * the build-time validator, not on every content read.
 */
export function defineLesson(lesson: LessonContent): LessonContent {
  return lesson;
}
