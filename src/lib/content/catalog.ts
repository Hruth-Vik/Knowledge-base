import { languages } from '@/content/languages.js';
import { compileContent } from './compile.js';
import type { ContentCatalog } from './types.js';

/**
 * Vite collects authored modules at build time. The same compiler and Zod
 * schemas used by `npm run validate:content` produce the in-app catalog, so
 * there is no hand-maintained second index.
 *
 * Stage 5 keeps all five lesson modules eager because the compiled catalog feeds
 * metadata, search, the map, review, and quiz selection. Splitting lesson bodies
 * into a generated metadata index is a Stage 9 performance task.
 */
const levelModules = import.meta.glob('../../content/**/levels.ts', {
  eager: true,
});
const lessonModules = import.meta.glob('../../content/**/*.lesson.ts', {
  eager: true,
});

const normalizedPath = (key: string): string =>
  `src/${key.replace(/^\.\.\/\.\.\//, '')}`.replace(/\\/g, '/');

const levelFiles = Object.entries(levelModules).flatMap(([path, module]) => {
  const data = (module as { levels?: unknown }).levels;
  return data === undefined
    ? []
    : [{ path: normalizedPath(path), data }];
});

const lessonFiles = Object.entries(lessonModules).map(([path, module]) => ({
  path: normalizedPath(path),
  data: (module as { lesson?: unknown }).lesson,
}));

const result = compileContent({
  languages,
  levelFiles,
  lessonFiles,
});

if (!result.ok) {
  const detail = result.errors
    .map((issue) => `${issue.path} [${issue.code}] ${issue.message}`)
    .join('\n');
  throw new Error(`Content failed to compile before the app could start.\n${detail}`);
}

export const catalog: ContentCatalog = result.catalog;
