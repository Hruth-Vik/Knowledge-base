import { z } from 'zod';
import {
  ConceptRegistry,
  type RegisteredConcept,
} from '../concepts/registry.js';
import {
  LanguageManifestSchema,
  LevelManifestSchema,
  type LanguageManifest,
  type LevelManifest,
} from '../schema/curriculum.js';
import { LessonSchema } from '../schema/lesson.js';
import type {
  CompiledChapter,
  CompiledLanguage,
  CompiledLevel,
  CompiledLesson,
  ContentCatalog,
  ContentIssue,
  LessonSource,
  LevelFileSource,
  QuizQuestionReference,
} from './types.js';

export interface CompileContentInput {
  readonly languages: unknown;
  readonly levelFiles: readonly LevelFileSource[];
  readonly lessonFiles: readonly LessonSource[];
}

export type CompileContentResult =
  | {
      readonly ok: true;
      readonly catalog: ContentCatalog;
      readonly warnings: readonly ContentIssue[];
    }
  | {
      readonly ok: false;
      readonly errors: readonly ContentIssue[];
      readonly warnings: readonly ContentIssue[];
    };

const LanguageListSchema = z.array(LanguageManifestSchema).min(1);
const LevelFileSchema = z.array(LevelManifestSchema);

interface LessonOrder {
  readonly levelIndex: number;
  readonly sequence: number;
}

export function compileContent(input: CompileContentInput): CompileContentResult {
  const errors: ContentIssue[] = [];
  const warnings: ContentIssue[] = [];

  const languageParse = LanguageListSchema.safeParse(input.languages);
  if (!languageParse.success) {
    for (const issue of languageParse.error.issues) {
      errors.push({
        code: 'invalid-language-manifest',
        path: `languages.${formatPath(issue.path)}`,
        message: issue.message,
      });
    }
  }

  const languages = languageParse.success ? languageParse.data : [];
  const languageById = new Map<string, LanguageManifest>();
  const languageOrders = new Set<number>();

  for (const [index, language] of languages.entries()) {
    if (languageById.has(language.id)) {
      errors.push({
        code: 'duplicate-language',
        path: `languages.${index}.id`,
        message: `Language "${language.id}" is declared more than once.`,
      });
    } else {
      languageById.set(language.id, language);
    }
    if (languageOrders.has(language.order)) {
      errors.push({
        code: 'duplicate-language-order',
        path: `languages.${index}.order`,
        message: `Language order ${language.order} is used more than once.`,
      });
    }
    languageOrders.add(language.order);
  }

  const levels = parseLevelFiles(input.levelFiles, languageById, errors);
  const levelById = new Map<string, LevelManifest>();
  const levelOrderByKey = new Set<string>();

  for (const level of levels) {
    if (levelById.has(level.id)) {
      errors.push({
        code: 'duplicate-level',
        path: level.id,
        message: `Level "${level.id}" is declared more than once.`,
      });
      continue;
    }
    levelById.set(level.id, level);

    if (!level.id.startsWith(`${level.language}.`)) {
      errors.push({
        code: 'level-prefix',
        path: level.id,
        message: `Level IDs must start with their language ID ("${level.language}.").`,
      });
    }

    const orderKey = `${level.language}:${level.index}`;
    if (levelOrderByKey.has(orderKey)) {
      errors.push({
        code: 'duplicate-level-index',
        path: level.id,
        message: `Language "${level.language}" already has a level at index ${level.index}.`,
      });
    }
    levelOrderByKey.add(orderKey);
  }

  for (const language of languages) {
    if (
      language.status === 'available' &&
      !levels.some((level) => level.language === language.id)
    ) {
      errors.push({
        code: 'missing-levels',
        path: `languages.${language.id}`,
        message: `Available language "${language.id}" has no level manifest.`,
      });
    }
    if (
      language.status === 'coming-soon' &&
      levels.some((level) => level.language === language.id)
    ) {
      errors.push({
        code: 'coming-soon-content',
        path: `languages.${language.id}`,
        message: 'A coming-soon language cannot ship levels or lessons yet.',
      });
    }
  }

  const lessons = parseLessonFiles(
    input.lessonFiles,
    languageById,
    levelById,
    errors,
  );
  validateLessonRelationships(lessons, languageById, levelById, errors);

  const globalOrder = new Map<string, LessonOrder>();
  for (const record of lessons) {
    const level = levelById.get(record.lesson.levelId);
    if (level) {
      globalOrder.set(record.lesson.id, {
        levelIndex: level.index,
        sequence: record.lesson.sequence,
      });
    }
  }

  const conceptEntries: RegisteredConcept[] = [];
  for (const record of lessons) {
    const level = levelById.get(record.lesson.levelId);
    if (!level) {
      continue;
    }
    for (const concept of record.lesson.concepts) {
      conceptEntries.push({
        ...concept,
        owner: {
          language: record.lesson.language,
          levelId: record.lesson.levelId,
          levelIndex: level.index,
          lessonId: record.lesson.id,
          lessonSequence: record.lesson.sequence,
          chapterId: record.lesson.chapter.id,
        },
      });
    }
  }

  const registryResult = ConceptRegistry.build(conceptEntries);
  for (const issue of registryResult.errors) {
    errors.push({
      code: issue.code,
      path: issue.conceptId,
      message: issue.message,
    });
  }

  const allQuestionIds = new Set<string>();
  const questionsById = new Map<string, QuizQuestionReference>();
  const questionConceptIssues = new Set<string>();

  for (const record of lessons) {
    const { lesson } = record;
    const introduced = new Set(lesson.concepts.map((concept) => concept.id));
    const revisited = new Set(lesson.revisits);

    for (const conceptId of lesson.revisits) {
      const target = registryResult.registry.get(conceptId);
      if (!target) {
        errors.push({
          code: 'unknown-revisit',
          path: record.path,
          message: `Lesson "${lesson.id}" revisits unknown concept "${conceptId}".`,
        });
        continue;
      }

      const currentOrder = globalOrder.get(lesson.id);
      const targetOrder = globalOrder.get(target.owner.lessonId);
      if (
        currentOrder &&
        targetOrder &&
        compareOrder(targetOrder, currentOrder) >= 0
      ) {
        errors.push({
          code: 'forward-revisit',
          path: record.path,
          message: `Concept "${conceptId}" must be taught before lesson "${lesson.id}" revisits it.`,
        });
      }
    }

    for (const concept of lesson.concepts) {
      if (!concept.id.startsWith(`${lesson.language}.`)) {
        errors.push({
          code: 'concept-prefix',
          path: `${record.path}:${concept.id}`,
          message: `Concept IDs must start with their language ID ("${lesson.language}.").`,
        });
      }

      const currentOrder = globalOrder.get(lesson.id);
      for (const relation of concept.relations) {
        if (relation.type !== 'depends-on') {
          continue;
        }
        const target = registryResult.registry.get(relation.target);
        const targetOrder = target
          ? globalOrder.get(target.owner.lessonId)
          : undefined;
        if (
          currentOrder &&
          targetOrder &&
          compareOrder(targetOrder, currentOrder) > 0
        ) {
          errors.push({
            code: 'forward-dependency',
            path: `${record.path}:${concept.id}`,
            message: `depends-on target "${relation.target}" is taught after this concept.`,
          });
        }
      }
    }

    for (const recallQuestion of lesson.recallCheck) {
      if (!recallQuestion.id.startsWith(`${lesson.id}.`)) {
        errors.push({
          code: 'question-prefix',
          path: record.path,
          message: `Recall question "${recallQuestion.id}" must start with "${lesson.id}."`,
        });
      }

      if (allQuestionIds.has(recallQuestion.id)) {
        errors.push({
          code: 'duplicate-question',
          path: record.path,
          message: `Question ID "${recallQuestion.id}" is used more than once.`,
        });
      }
      allQuestionIds.add(recallQuestion.id);
      questionsById.set(recallQuestion.id, {
        question: recallQuestion,
        lessonId: lesson.id,
        purpose: 'recall',
      });

      for (const conceptId of recallQuestion.concepts) {
        if (!introduced.has(conceptId) && !revisited.has(conceptId)) {
          const issueKey = `${record.path}:${recallQuestion.id}:${conceptId}`;
          if (!questionConceptIssues.has(issueKey)) {
            errors.push({
              code: 'question-concept-scope',
              path: record.path,
              message: `Question "${recallQuestion.id}" references "${conceptId}", which this lesson neither introduces nor revisits.`,
            });
            questionConceptIssues.add(issueKey);
          }
        }
      }
    }

    for (const interviewQuestion of lesson.sections.interviewCorner.questions) {
      if (!interviewQuestion.id.startsWith(`${lesson.id}.interview.`)) {
        errors.push({
          code: 'interview-question-prefix',
          path: record.path,
          message: `Interview question "${interviewQuestion.id}" must start with "${lesson.id}.interview."`,
        });
      }
      if (allQuestionIds.has(interviewQuestion.id)) {
        errors.push({
          code: 'duplicate-question',
          path: record.path,
          message: `Question ID "${interviewQuestion.id}" is used more than once.`,
        });
      }
      allQuestionIds.add(interviewQuestion.id);
      questionsById.set(interviewQuestion.id, {
        question: interviewQuestion,
        lessonId: lesson.id,
        purpose: 'interview',
      });
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors, warnings };
  }

  const languageOrder = new Map(
    languages.map((language) => [language.id, language.order]),
  );
  const levelIndex = new Map(
    levels.map((level) => [level.id, level.index]),
  );
  const compiledLessons: CompiledLesson[] = [...lessons].sort((a, b) =>
    compareLessons(a, b, languageOrder, levelIndex),
  );
  const compiledLanguages = compileLanguages(
    languages,
    levels,
    compiledLessons,
    warnings,
  );

  return {
    ok: true,
    warnings,
    catalog: {
      languages: compiledLanguages,
      lessons: compiledLessons,
      concepts: registryResult.registry,
      questionsById,
    },
  };
}

function parseLevelFiles(
  files: readonly LevelFileSource[],
  languageById: ReadonlyMap<string, LanguageManifest>,
  errors: ContentIssue[],
): LevelManifest[] {
  const levels: LevelManifest[] = [];

  for (const file of files) {
    const parsed = LevelFileSchema.safeParse(file.data);
    if (!parsed.success) {
      addZodIssues(errors, parsed.error, file.path, 'invalid-level-manifest');
      continue;
    }

    for (const [index, level] of parsed.data.entries()) {
      if (!languageById.has(level.language)) {
        errors.push({
          code: 'unknown-language',
          path: `${file.path}[${index}].language`,
          message: `Level references unknown language "${level.language}".`,
        });
        continue;
      }
      if (!isWithinContentLanguage(file.path, level.language)) {
        errors.push({
          code: 'level-file-location',
          path: file.path,
          message: `Level "${level.id}" must live under src/content/${level.language}/.`,
        });
      }
      levels.push(level);
    }
  }

  return levels;
}

function parseLessonFiles(
  files: readonly LessonSource[],
  languageById: ReadonlyMap<string, LanguageManifest>,
  levelById: ReadonlyMap<string, LevelManifest>,
  errors: ContentIssue[],
): CompiledLesson[] {
  const lessons: CompiledLesson[] = [];
  const lessonIds = new Set<string>();
  const slugKeys = new Set<string>();
  const levelSequences = new Set<string>();

  for (const file of files) {
    const parsed = LessonSchema.safeParse(file.data);
    if (!parsed.success) {
      addZodIssues(errors, parsed.error, file.path, 'invalid-lesson');
      continue;
    }

    const lesson = parsed.data;
    const language = languageById.get(lesson.language);
    if (!language) {
      errors.push({
        code: 'unknown-language',
        path: `${file.path}:language`,
        message: `Lesson references unknown language "${lesson.language}".`,
      });
      continue;
    }
    if (language.status !== 'available') {
      errors.push({
        code: 'coming-soon-content',
        path: file.path,
        message: `Lessons cannot be published for ${language.status} language "${language.id}".`,
      });
    }

    if (!lesson.id.startsWith(`${lesson.language}.`)) {
      errors.push({
        code: 'lesson-prefix',
        path: `${file.path}:id`,
        message: `Lesson IDs must start with their language ID ("${lesson.language}.").`,
      });
    }

    const level = levelById.get(lesson.levelId);
    if (!level) {
      errors.push({
        code: 'unknown-level',
        path: `${file.path}:levelId`,
        message: `Lesson references unknown level "${lesson.levelId}".`,
      });
      continue;
    }
    if (level.language !== lesson.language) {
      errors.push({
        code: 'level-language-mismatch',
        path: `${file.path}:levelId`,
        message: `Level "${level.id}" belongs to a different language.`,
      });
    }

    if (!isWithinContentLanguage(file.path, lesson.language)) {
      errors.push({
        code: 'lesson-file-location',
        path: file.path,
        message: `Lesson "${lesson.id}" must live under src/content/${lesson.language}/.`,
      });
    }

    const expectedSuffix = `/${lesson.slug}.lesson.ts`;
    if (!file.path.replace(/\\/g, '/').endsWith(expectedSuffix)) {
      errors.push({
        code: 'lesson-file-name',
        path: file.path,
        message: `Lesson file must be named "${lesson.slug}.lesson.ts".`,
      });
    }

    if (lessonIds.has(lesson.id)) {
      errors.push({
        code: 'duplicate-lesson',
        path: file.path,
        message: `Lesson ID "${lesson.id}" is used more than once.`,
      });
    }
    lessonIds.add(lesson.id);

    const slugKey = `${lesson.language}:${lesson.slug}`;
    if (slugKeys.has(slugKey)) {
      errors.push({
        code: 'duplicate-lesson-slug',
        path: file.path,
        message: `Lesson slug "${lesson.slug}" is used more than once in ${lesson.language}.`,
      });
    }
    slugKeys.add(slugKey);

    const sequenceKey = `${lesson.levelId}:${lesson.sequence}`;
    if (levelSequences.has(sequenceKey)) {
      errors.push({
        code: 'duplicate-lesson-sequence',
        path: file.path,
        message: `Level "${lesson.levelId}" already has a lesson at sequence ${lesson.sequence}.`,
      });
    }
    levelSequences.add(sequenceKey);

    lessons.push({ lesson, path: file.path });
  }

  return lessons;
}

function validateLessonRelationships(
  lessons: readonly CompiledLesson[],
  languageById: ReadonlyMap<string, LanguageManifest>,
  levelById: ReadonlyMap<string, LevelManifest>,
  errors: ContentIssue[],
): void {
  const chapters = new Map<string, { title: string; path: string }>();

  for (const { lesson, path } of lessons) {
    if (!languageById.has(lesson.language)) {
      continue;
    }
    if (!levelById.has(lesson.levelId)) {
      continue;
    }

    const chapterKey = `${lesson.levelId}:${lesson.chapter.id}`;
    const existingChapter = chapters.get(chapterKey);
    if (existingChapter && existingChapter.title !== lesson.chapter.title) {
      errors.push({
        code: 'chapter-title-mismatch',
        path,
        message: `Chapter "${lesson.chapter.id}" has conflicting titles: "${existingChapter.title}" and "${lesson.chapter.title}".`,
      });
    } else if (!existingChapter) {
      chapters.set(chapterKey, {
        title: lesson.chapter.title,
        path,
      });
    }
  }
}

function compileLanguages(
  languages: readonly LanguageManifest[],
  levels: readonly LevelManifest[],
  lessons: readonly CompiledLesson[],
  warnings: ContentIssue[],
): readonly CompiledLanguage[] {
  return [...languages]
    .sort((a, b) => a.order - b.order)
    .map((language) => {
      const languageLevels = levels
        .filter((level) => level.language === language.id)
        .sort((a, b) => a.index - b.index)
        .map<CompiledLevel>((manifest) => {
          const levelLessons = lessons
            .filter((record) => record.lesson.levelId === manifest.id)
            .sort((a, b) => a.lesson.sequence - b.lesson.sequence);

          const incidents = levelLessons.filter(
            (record) => record.lesson.kind === 'incident-story',
          ).length;
          if (levelLessons.length > 0 && incidents < 2) {
            warnings.push({
              code: 'incident-story-coverage',
              path: manifest.id,
              message: `Level "${manifest.id}" needs at least two incident-story lessons; it currently has ${incidents}.`,
            });
          }

          return {
            manifest,
            chapters: groupIntoChapters(levelLessons),
          };
        });

      return {
        manifest: language,
        levels: languageLevels,
      };
    });
}

function groupIntoChapters(
  lessons: readonly CompiledLesson[],
): readonly CompiledChapter[] {
  const chapters = new Map<
    string,
    { id: string; title: string; lessons: CompiledLesson[] }
  >();

  for (const record of lessons) {
    const existing = chapters.get(record.lesson.chapter.id);
    if (existing) {
      existing.lessons.push(record);
    } else {
      chapters.set(record.lesson.chapter.id, {
        id: record.lesson.chapter.id,
        title: record.lesson.chapter.title,
        lessons: [record],
      });
    }
  }

  return [...chapters.values()];
}

function compareLessons(
  a: CompiledLesson,
  b: CompiledLesson,
  languageOrder: ReadonlyMap<string, number>,
  levelIndex: ReadonlyMap<string, number>,
): number {
  const language =
    (languageOrder.get(a.lesson.language) ?? 0) -
    (languageOrder.get(b.lesson.language) ?? 0);
  if (language !== 0) {
    return language;
  }
  const level =
    (levelIndex.get(a.lesson.levelId) ?? 0) -
    (levelIndex.get(b.lesson.levelId) ?? 0);
  if (level !== 0) {
    return level;
  }
  return a.lesson.sequence - b.lesson.sequence;
}

function compareOrder(a: LessonOrder, b: LessonOrder): number {
  if (a.levelIndex !== b.levelIndex) {
    return a.levelIndex - b.levelIndex;
  }
  return a.sequence - b.sequence;
}

function addZodIssues(
  errors: ContentIssue[],
  error: z.ZodError,
  path: string,
  code: string,
): void {
  for (const issue of error.issues) {
    errors.push({
      code,
      path: `${path}.${formatPath(issue.path)}`,
      message: issue.message,
    });
  }
}

function isWithinContentLanguage(filePath: string, language: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  const expectedRoot = `src/content/${language}/`;
  return (
    normalized.startsWith(expectedRoot) ||
    normalized.includes(`/${expectedRoot}`)
  );
}

function formatPath(path: PropertyKey[]): string {
  if (path.length === 0) {
    return '$';
  }

  return path
    .map((part) =>
      typeof part === 'number' ? `[${part}]` : `.${String(part)}`,
    )
    .join('')
    .replace(/^\./, '');
}
