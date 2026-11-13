import { describe, expect, it } from 'vitest';
import { languages } from '../src/content/languages.js';
import { levels } from '../src/content/java/levels.js';
import { compileContent } from '../src/lib/content/compile.js';
import { LessonSchema } from '../src/lib/schema/lesson.js';
import { sampleLesson } from './fixtures/sample-lesson.js';

const fixturePath = 'src/content/java/l0/sample-references.lesson.ts';

function compileWith(lessons: unknown[]) {
  return compileContent({
    languages,
    levelFiles: [
      {
        path: 'src/content/java/levels.ts',
        data: levels,
      },
    ],
    lessonFiles: lessons.map((lesson) => ({
      path: fixturePath,
      data: lesson,
    })),
  });
}

function mutableSample(): any {
  return structuredClone(sampleLesson);
}

describe('lesson schema', () => {
  it('accepts a complete lesson authored to the template', () => {
    const parsed = LessonSchema.safeParse(sampleLesson);
    expect(parsed.success).toBe(true);
  });

  it('rejects a lesson missing the Interview Corner', () => {
    const lesson: any = structuredClone(sampleLesson);
    delete lesson.sections.interviewCorner;

    const parsed = LessonSchema.safeParse(lesson);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(
        parsed.error.issues.some((issue) =>
          issue.path.includes('interviewCorner'),
        ),
      ).toBe(true);
    }
  });

  it('rejects a recall check with fewer than three questions', () => {
    const lesson: any = structuredClone(sampleLesson);
    lesson.recallCheck = lesson.recallCheck.slice(0, 2);

    const parsed = LessonSchema.safeParse(lesson);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(
        parsed.error.issues.some((issue) =>
          issue.path.includes('recallCheck'),
        ),
      ).toBe(true);
    }
  });

  it('rejects a minimal code sample that has grown past 14 lines', () => {
    const lesson: any = structuredClone(sampleLesson);
    lesson.sections.code.minimal.code = Array.from(
      { length: 15 },
      (_, index) => `int value${index} = ${index};`,
    ).join('\n');
    lesson.sections.code.minimal.annotations = [
      { line: 1, note: 'First line.' },
      { line: 2, note: 'Second line.' },
    ];

    const parsed = LessonSchema.safeParse(lesson);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(
        parsed.error.issues.some((issue) =>
          issue.message.includes('14 lines'),
        ),
      ).toBe(true);
    }
  });
});

describe('content compilation', () => {
  it('builds levels, concepts, and the recall index from valid content', () => {
    const result = compileWith([sampleLesson]);
    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.catalog.lessons).toHaveLength(1);
    expect(result.catalog.concepts.all()).toHaveLength(2);
    expect(result.catalog.questionsById.size).toBe(6);
    expect(
      [...result.catalog.questionsById.values()].filter(
        (entry) => entry.purpose === 'interview',
      ),
    ).toHaveLength(3);
    expect(result.catalog.languages).toHaveLength(3);

    const java = result.catalog.languages.find(
      (language) => language.manifest.id === 'java',
    );
    expect(java?.levels).toHaveLength(11);
    expect(java?.levels[0]?.chapters[0]?.lessons).toHaveLength(1);
  });

  it('fails the build when a lesson section is missing', () => {
    const lesson: any = structuredClone(sampleLesson);
    delete lesson.sections.writeFromScratch;

    const result = compileWith([lesson]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.errors.some((issue) => issue.code === 'invalid-lesson'),
      ).toBe(true);
    }
  });

  it('fails on a duplicate concept declaration', () => {
    const second: any = structuredClone(sampleLesson);
    second.id = 'java.l0.second-lesson';
    second.slug = 'second-lesson';
    second.sequence = 2;

    const result = compileWith([sampleLesson, second]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.errors.some((issue) => issue.code === 'duplicate-concept'),
      ).toBe(true);
    }
  });

  it('fails when a concept points at a concept that does not exist', () => {
    const lesson: any = structuredClone(sampleLesson);
    lesson.concepts[0].relations[0].target = 'java.l0.missing-concept';

    const result = compileWith([lesson]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.errors.some(
          (issue) => issue.code === 'unknown-relation-target',
        ),
      ).toBe(true);
    }
  });

  it('fails when a lesson filename does not match its slug', () => {
    const result = compileContent({
      languages,
      levelFiles: [
        {
          path: 'src/content/java/levels.ts',
          data: levels,
        },
      ],
      lessonFiles: [
        {
          path: 'src/content/java/l0/not-the-slug.lesson.ts',
          data: sampleLesson,
        },
      ],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.errors.some((issue) => issue.code === 'lesson-file-name'),
      ).toBe(true);
    }
  });

  it('warns when a populated level lacks incident stories', () => {
    const result = compileWith([sampleLesson]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(
        result.warnings.some(
          (issue) => issue.code === 'incident-story-coverage',
        ),
      ).toBe(true);
    }
  });
});

describe('question invariants', () => {
  it('rejects an order-the-steps answer whose order omits a step', () => {
    const lesson: any = mutableSample();
    lesson.recallCheck[0] = {
      ...lesson.recallCheck[0],
      id: 'java.l0.sample-references.recall.order',
      type: 'order-the-steps',
      concepts: ['java.l0.sample-reference'],
      items: [
        { id: 'one', text: 'First step' },
        { id: 'two', text: 'Second step' },
        { id: 'three', text: 'Third step' },
      ],
      correctOrder: ['one', 'two'],
      prompt: 'Put the steps in order.',
      explanation: 'The third step belongs at the end.',
    };

    const parsed = LessonSchema.safeParse(lesson);
    expect(parsed.success).toBe(false);
  });
});
