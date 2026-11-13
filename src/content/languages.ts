import type { LanguageManifest } from '../lib/schema/curriculum.js';

export const languages = [
  {
    id: 'java',
    order: 0,
    name: 'Java',
    shortName: 'Java',
    status: 'available',
    baseline: 'Java 21 LTS',
    description:
      'The first complete Foundation pack. Java 21 LTS is the baseline. The path starts at the machine and works upward through language semantics, concurrency, the JVM, Spring, persistence, and production operations.',
    exerciseMode: 'rubric-self-check',
  },
  {
    id: 'python',
    order: 1,
    name: 'Python',
    shortName: 'Python',
    status: 'coming-soon',
    baseline: null,
    description:
      'Planned as a second pack on the same engine. Its exercises can eventually use real in-browser execution. No Python content is published yet.',
    exerciseMode: 'rubric-self-check',
  },
  {
    id: 'javascript',
    order: 2,
    name: 'JavaScript / TypeScript',
    shortName: 'JS / TS',
    status: 'coming-soon',
    baseline: null,
    description:
      'Planned after Python. The content model and progress system are language-agnostic; only the pack is missing. No JavaScript or TypeScript content is published yet.',
    exerciseMode: 'rubric-self-check',
  },
] satisfies readonly LanguageManifest[];
