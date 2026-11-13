import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { languages } from '../src/content/languages.js';
import { compileContent } from '../src/lib/content/compile.js';
import type {
  ContentIssue,
  LessonSource,
  LevelFileSource,
} from '../src/lib/content/types.js';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const contentRoot = path.join(repositoryRoot, 'src', 'content');

interface LoadFailure {
  readonly path: string;
  readonly message: string;
}

async function main(): Promise<void> {
  const levelFiles: LevelFileSource[] = [];
  const lessonFiles: LessonSource[] = [];
  const loadFailures: LoadFailure[] = [];

  for (const language of languages) {
    if (language.status !== 'available') {
      continue;
    }

    const levelsPath = path.join(contentRoot, language.id, 'levels.ts');
    try {
      const module = await import(pathToFileURL(levelsPath).href);
      if (!('levels' in module)) {
        loadFailures.push({
          path: relativePath(levelsPath),
          message: 'Level module must export a `levels` array.',
        });
      } else {
        levelFiles.push({
          path: relativePath(levelsPath),
          data: module.levels,
        });
      }
    } catch (error) {
      if (isMissingFile(error)) {
        loadFailures.push({
          path: relativePath(levelsPath),
          message: 'No level manifest found for an available language.',
        });
      } else {
        loadFailures.push({
          path: relativePath(levelsPath),
          message: formatUnknownError(error),
        });
      }
    }
  }

  const contentFiles = await walk(contentRoot);
  const lessonPaths = contentFiles.filter((file) =>
    file.endsWith('.lesson.ts'),
  );

  const recognizedTypeScriptFiles = new Set<string>([
    relativePath(path.join(contentRoot, 'languages.ts')),
    ...levelFiles.map((file) => file.path),
    ...lessonPaths.map((file) => relativePath(file)),
  ]);

  for (const contentFile of contentFiles) {
    const relative = relativePath(contentFile);
    if (
      relative.endsWith('.ts') &&
      !recognizedTypeScriptFiles.has(relative)
    ) {
      loadFailures.push({
        path: relative,
        message:
          'Unrecognized content module. Lessons must end in .lesson.ts and level manifests must be level-root levels.ts files.',
      });
    }
  }

  for (const lessonPath of lessonPaths) {
    try {
      const module = await import(pathToFileURL(lessonPath).href);
      if (!('lesson' in module)) {
        loadFailures.push({
          path: relativePath(lessonPath),
          message: 'Lesson module must export a `lesson` object.',
        });
      } else {
        lessonFiles.push({
          path: relativePath(lessonPath),
          data: module.lesson,
        });
      }
    } catch (error) {
      loadFailures.push({
        path: relativePath(lessonPath),
        message: formatUnknownError(error),
      });
    }
  }

  const result = compileContent({
    languages,
    levelFiles,
    lessonFiles,
  });

  const errors: ContentIssue[] = [...loadFailures.map((failure) => ({
    code: 'content-load-failure',
    path: failure.path,
    message: failure.message,
  }))];

  if (!result.ok) {
    errors.push(...result.errors);
  }

  printIssues('Errors', errors);
  printIssues('Warnings', result.warnings);

  if (errors.length > 0 || !result.ok) {
    process.exitCode = 1;
    console.error(`\nContent validation failed with ${errors.length} error(s).`);
    return;
  }

  const { catalog } = result;
  const availableLanguages = catalog.languages.filter(
    (language) => language.manifest.status === 'available',
  );
  const lessonCount = catalog.lessons.length;

  console.log('Foundation content validation');
  console.log(
    `  Languages: ${catalog.languages.length} declared, ${availableLanguages.length} available`,
  );
  for (const language of catalog.languages) {
    const details =
      language.manifest.status === 'available'
        ? `${language.levels.length} levels`
        : 'coming soon';
    console.log(`  ${language.manifest.name}: ${details}`);
  }
  console.log(`  Lessons: ${lessonCount}`);
  console.log(`  Concepts: ${catalog.concepts.all().length}`);
  console.log(`  Recall questions: ${catalog.questionsById.size}`);

  if (lessonCount === 0) {
    console.log(
      '\nNo lessons are published yet. The schema is proven by unit tests; every lesson file placed under src/content is validated automatically.',
    );
  }

  console.log('\nContent is valid.');
}

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function relativePath(filePath: string): string {
  return path.relative(repositoryRoot, filePath).split(path.sep).join('/');
}

function printIssues(label: string, issues: readonly ContentIssue[]): void {
  if (issues.length === 0) {
    return;
  }

  console.error(`\n${label}:`);
  for (const issue of issues) {
    console.error(`  [${issue.code}] ${issue.path}`);
    console.error(`    ${issue.message}`);
  }
}

function formatUnknownError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ERR_MODULE_NOT_FOUND'
  );
}

await main();
