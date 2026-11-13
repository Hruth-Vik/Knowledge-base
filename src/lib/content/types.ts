import type { ConceptRegistry } from '../concepts/registry.js';
import type { InterviewQuestion, LessonContent } from '../schema/lesson.js';
import type { LanguageManifest, LevelManifest } from '../schema/curriculum.js';
import type { Question } from '../schema/question.js';

export interface ContentIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface LessonSource {
  readonly path: string;
  readonly data: unknown;
}

export interface LevelFileSource {
  readonly path: string;
  readonly data: unknown;
}

export interface CompiledLesson {
  readonly lesson: LessonContent;
  readonly path: string;
}

export interface CompiledChapter {
  readonly id: string;
  readonly title: string;
  readonly lessons: readonly CompiledLesson[];
}

export interface CompiledLevel {
  readonly manifest: LevelManifest;
  readonly chapters: readonly CompiledChapter[];
}

export interface CompiledLanguage {
  readonly manifest: LanguageManifest;
  readonly levels: readonly CompiledLevel[];
}

export type QuizQuestionReference =
  | {
      readonly question: Question;
      readonly lessonId: string;
      readonly purpose: 'recall';
    }
  | {
      readonly question: InterviewQuestion;
      readonly lessonId: string;
      readonly purpose: 'interview';
    };

export interface ContentCatalog {
  readonly languages: readonly CompiledLanguage[];
  readonly lessons: readonly CompiledLesson[];
  readonly concepts: ConceptRegistry;
  readonly questionsById: ReadonlyMap<string, QuizQuestionReference>;
}
