import { z } from 'zod';
import {
  CalendarDateSchema,
  IsoDateTimeSchema,
  ShortTextSchema,
  SlugSchema,
  StableIdSchema,
  ThemeSchema,
  strictObject,
  uniqueStrings,
} from '../schema/primitives.js';
import { RelationshipTypeSchema } from '../schema/concept.js';
import { SrsCardSchema, SrsRatingSchema } from '../srs/schema.js';

export const UserIdSchema = z.string().uuid();
export const CustomMapNodeIdSchema = z
  .string()
  .min(10)
  .max(140)
  .regex(
    /^user\.[a-z0-9]+(?:[.-][a-z0-9]+)*$/,
    'Custom map nodes must use a user.* ID.',
  );

const NullableTimestampSchema = IsoDateTimeSchema.nullable();

export const RecallAnswerSchema = strictObject({
  questionId: StableIdSchema,
  correct: z.boolean(),
  response: z.string().max(4_000).nullable(),
});

export const RecallAttemptSchema = strictObject({
  id: UserIdSchema,
  attemptedAt: IsoDateTimeSchema,
  answers: z.array(RecallAnswerSchema).length(3),
  score: z.number().int().min(0).max(3),
  passed: z.boolean(),
}).superRefine((attempt, ctx) => {
  const questionIds = attempt.answers.map((answer) => answer.questionId);
  if (!uniqueStrings(questionIds)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['answers'],
      message: 'A recall attempt cannot answer the same question twice.',
    });
  }
  if (attempt.passed !== (attempt.score === 3)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['passed'],
      message: 'Recall is passed only with all three questions correct.',
    });
  }
});

export const LessonProgressSchema = strictObject({
  lessonId: StableIdSchema,
  startedAt: IsoDateTimeSchema,
  lastVisitedAt: IsoDateTimeSchema,
  doneAt: NullableTimestampSchema,
  timeSpentSeconds: z.number().int().nonnegative(),
  recall: strictObject({
    attempts: z.array(RecallAttemptSchema).max(50),
    passedAt: NullableTimestampSchema,
  }),
  exercise: strictObject({
    draft: z.string().max(100_000),
    lastSavedAt: NullableTimestampSchema,
    rubricChecks: z.record(SlugSchema, z.boolean()),
    passedAt: NullableTimestampSchema,
  }),
});

export const ReviewLogSchema = strictObject({
  id: UserIdSchema,
  questionId: StableIdSchema,
  conceptIds: z.array(StableIdSchema).min(1).max(6),
  reviewedAt: IsoDateTimeSchema,
  rating: SrsRatingSchema,
  wasDue: z.boolean(),
  intervalBeforeDays: z.number().int().nonnegative(),
  intervalAfterDays: z.number().int().nonnegative(),
  easeAfter: z.number().min(1.3).max(5),
});

export const ReviewStateSchema = strictObject({
  cards: z.record(StableIdSchema, SrsCardSchema),
  logs: z.array(ReviewLogSchema),
});

export const QuizKindSchema = z.enum(['milestone', 'level-gate', 'interview']);
export const QuizStatusSchema = z.enum([
  'in-progress',
  'completed',
  'abandoned',
]);

export const QuizQuestionOutcomeSchema = strictObject({
  questionId: StableIdSchema,
  conceptIds: z.array(StableIdSchema).min(1).max(6),
  correct: z.boolean().nullable(),
  selfScore: z.number().int().min(0).max(5).nullable(),
  response: z.string().max(8_000).nullable(),
});

export const QuizAttemptSchema = strictObject({
  id: UserIdSchema,
  kind: QuizKindSchema,
  scope: strictObject({
    levelId: StableIdSchema.nullable(),
    lessonIds: z.array(StableIdSchema),
  }),
  startedAt: IsoDateTimeSchema,
  completedAt: NullableTimestampSchema,
  durationSeconds: z.number().int().nonnegative(),
  status: QuizStatusSchema,
  questions: z.array(QuizQuestionOutcomeSchema).min(1),
}).superRefine((attempt, ctx) => {
  const questionIds = attempt.questions.map((question) => question.questionId);
  if (!uniqueStrings(questionIds)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['questions'],
      message: 'A quiz cannot include the same question twice.',
    });
  }
  if (!uniqueStrings(attempt.scope.lessonIds)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['scope', 'lessonIds'],
      message: 'Quiz scope lesson IDs must be unique.',
    });
  }
  if (attempt.status === 'completed' && attempt.completedAt === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['completedAt'],
      message: 'A completed quiz needs a completion timestamp.',
    });
  }
  if (attempt.status !== 'completed' && attempt.completedAt !== null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['completedAt'],
      message: 'Only a completed quiz may have a completion timestamp.',
    });
  }
});

export const MilestoneSchema = strictObject({
  id: StableIdSchema,
  language: SlugSchema,
  kind: z.enum(['five-lesson', 'level-end']),
  levelId: StableIdSchema.nullable(),
  lessonIds: z.array(StableIdSchema).min(1),
  status: z.enum(['pending', 'started', 'completed']),
  quizAttemptId: UserIdSchema.nullable(),
  createdAt: IsoDateTimeSchema,
  completedAt: NullableTimestampSchema,
}).superRefine((milestone, ctx) => {
  if (!uniqueStrings(milestone.lessonIds)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['lessonIds'],
      message: 'Milestone lesson IDs must be unique.',
    });
  }
  if (milestone.kind === 'level-end' && milestone.levelId === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['levelId'],
      message: 'A level-end milestone needs a level ID.',
    });
  }
  if (milestone.status === 'completed') {
    if (milestone.completedAt === null || milestone.quizAttemptId === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['status'],
        message: 'A completed milestone needs a completion time and quiz attempt.',
      });
    }
  } else if (milestone.completedAt !== null || milestone.quizAttemptId !== null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['status'],
      message: 'Only a completed milestone may link to a completed quiz attempt.',
    });
  }
});

export const NoteExcerptSchema = strictObject({
  text: z.string().min(1).max(10_000),
  lessonId: StableIdSchema,
  sectionTitle: ShortTextSchema(120).optional(),
});

export const NoteSchema = strictObject({
  id: UserIdSchema,
  title: z.string().max(160),
  bodyMarkdown: z.string().max(200_000),
  tags: z.array(ShortTextSchema(36)).max(12),
  lessonId: StableIdSchema.nullable(),
  conceptIds: z.array(StableIdSchema).max(30),
  excerpt: NoteExcerptSchema.nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
}).superRefine((note, ctx) => {
  if (!uniqueStrings(note.tags)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['tags'],
      message: 'Note tags must be unique.',
    });
  }
  if (!uniqueStrings(note.conceptIds)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['conceptIds'],
      message: 'Linked concept IDs must be unique.',
    });
  }
});

export const MapLayoutSchema = z.enum(['radial', 'dependency', 'cluster']);

export const MapPositionSchema = strictObject({
  x: z.number().finite(),
  y: z.number().finite(),
});

export const CustomMapNodeSchema = strictObject({
  id: CustomMapNodeIdSchema,
  label: ShortTextSchema(100),
  summary: z.string().max(1_000).nullable(),
  state: z.enum(['unseen', 'learned', 'mastered']),
  links: z
    .array(
      strictObject({
        kind: z.enum(['lesson', 'concept', 'note']),
        id: StableIdSchema,
      }),
    )
    .max(12),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const CustomMapEdgeSchema = strictObject({
  id: UserIdSchema,
  source: StableIdSchema,
  target: StableIdSchema,
  relation: RelationshipTypeSchema,
  createdAt: IsoDateTimeSchema,
}).superRefine((edge, ctx) => {
  if (edge.source === edge.target) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['target'],
      message: 'A map edge cannot point to itself.',
    });
  }
});

export const CustomMapSchema = strictObject({
  nodes: z.record(CustomMapNodeIdSchema, CustomMapNodeSchema),
  edges: z.record(UserIdSchema, CustomMapEdgeSchema),
  positions: strictObject({
    radial: z.record(StableIdSchema, MapPositionSchema),
    dependency: z.record(StableIdSchema, MapPositionSchema),
    cluster: z.record(StableIdSchema, MapPositionSchema),
  }),
});

export const ActivityDaySchema = strictObject({
  date: CalendarDateSchema,
  secondsOnLearning: z.number().int().nonnegative(),
  lessonIdsTouched: z.array(StableIdSchema),
  lessonIdsCompleted: z.array(StableIdSchema),
  reviewsCompleted: z.number().int().nonnegative(),
  quizzesCompleted: z.number().int().nonnegative(),
}).superRefine((day, ctx) => {
  if (!uniqueStrings(day.lessonIdsTouched)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['lessonIdsTouched'],
      message: 'Touched lesson IDs must be unique for a day.',
    });
  }
  if (!uniqueStrings(day.lessonIdsCompleted)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['lessonIdsCompleted'],
      message: 'Completed lesson IDs must be unique for a day.',
    });
  }
  if (day.lessonIdsCompleted.some((id) => !day.lessonIdsTouched.includes(id))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['lessonIdsCompleted'],
      message: 'A completed lesson must also be recorded as touched that day.',
    });
  }
});

export const SettingsSchema = strictObject({
  activeLanguageId: SlugSchema,
  theme: ThemeSchema,
  dailyGoalLessons: z.number().int().min(1).max(3),
});

export const StreakStateSchema = strictObject({
  restDayTokens: z.number().int().min(0).max(2),
  lastTokenGrantedOn: CalendarDateSchema.nullable(),
  restDays: z.array(CalendarDateSchema),
}).superRefine((streak, ctx) => {
  if (!uniqueStrings(streak.restDays)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['restDays'],
      message: 'A rest day can only be spent once.',
    });
  }
});

export const UserStateV1Schema = strictObject({
  schemaVersion: z.literal(1),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  settings: SettingsSchema,
  lessons: z.record(StableIdSchema, LessonProgressSchema),
  review: ReviewStateSchema,
  quizzes: z.array(QuizAttemptSchema),
  milestones: z.record(StableIdSchema, MilestoneSchema),
  notes: z.record(UserIdSchema, NoteSchema),
  map: CustomMapSchema,
  activity: strictObject({
    days: z.record(CalendarDateSchema, ActivityDaySchema),
  }),
  streak: StreakStateSchema,
}).superRefine((state, ctx) => {
  for (const [lessonId, progress] of Object.entries(state.lessons)) {
    if (lessonId !== progress.lessonId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lessons', lessonId, 'lessonId'],
        message: 'Lesson progress key and lessonId must match.',
      });
    }
  }

  for (const [questionId, card] of Object.entries(state.review.cards)) {
    if (questionId !== card.questionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['review', 'cards', questionId, 'questionId'],
        message: 'SRS card key and questionId must match.',
      });
    }
  }

  for (const [milestoneId, milestone] of Object.entries(state.milestones)) {
    if (milestoneId !== milestone.id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['milestones', milestoneId, 'id'],
        message: 'Milestone key and milestone ID must match.',
      });
    }
  }

  for (const [noteId, note] of Object.entries(state.notes)) {
    if (noteId !== note.id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['notes', noteId, 'id'],
        message: 'Note key and note ID must match.',
      });
    }
  }

  for (const [nodeId, node] of Object.entries(state.map.nodes)) {
    if (nodeId !== node.id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['map', 'nodes', nodeId, 'id'],
        message: 'Custom node key and node ID must match.',
      });
    }
  }

  for (const [edgeId, edge] of Object.entries(state.map.edges)) {
    if (edgeId !== edge.id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['map', 'edges', edgeId, 'id'],
        message: 'Custom edge key and edge ID must match.',
      });
    }
  }

  for (const [calendarDate, day] of Object.entries(state.activity.days)) {
    if (calendarDate !== day.date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['activity', 'days', calendarDate, 'date'],
        message: 'Activity day key and date must match.',
      });
    }
  }
});

export const BackupEnvelopeSchema = strictObject({
  format: z.literal('foundation.backup'),
  formatVersion: z.literal(1),
  exportedAt: IsoDateTimeSchema,
  state: UserStateV1Schema,
});

export type LessonProgress = z.infer<typeof LessonProgressSchema>;
export type RecallAttempt = z.infer<typeof RecallAttemptSchema>;
export type ReviewLog = z.infer<typeof ReviewLogSchema>;
export type QuizQuestionOutcome = z.infer<typeof QuizQuestionOutcomeSchema>;
export type QuizAttempt = z.infer<typeof QuizAttemptSchema>;
export type Milestone = z.infer<typeof MilestoneSchema>;
export type Note = z.infer<typeof NoteSchema>;
export type CustomMapNode = z.infer<typeof CustomMapNodeSchema>;
export type CustomMapEdge = z.infer<typeof CustomMapEdgeSchema>;
export type MapLayout = z.infer<typeof MapLayoutSchema>;
export type ActivityDay = z.infer<typeof ActivityDaySchema>;
export type UserStateV1 = z.infer<typeof UserStateV1Schema>;
export type BackupEnvelope = z.infer<typeof BackupEnvelopeSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type StreakState = z.infer<typeof StreakStateSchema>;
