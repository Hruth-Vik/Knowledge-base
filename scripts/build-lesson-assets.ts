import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHighlighter, type BundledLanguage } from 'shiki';
import { codeBlockKey } from '../src/lib/content/code-key.js';

const ROOT = process.cwd();
const CONTENT_ROOT = path.join(ROOT, 'src', 'content');
const OUTPUT_FILE = path.join(
  ROOT,
  'src',
  'content',
  'generated',
  'highlighted-code.json',
);

const LIGHT_THEME = 'everforest-light';
const DARK_THEME = 'everforest-dark';
const SHIKI_VERSION = '4.6.0';

const LANGUAGE_MAP = {
  java: 'java',
  python: 'python',
  javascript: 'javascript',
  typescript: 'typescript',
  sql: 'sql',
  bash: 'bash',
  shell: 'bash',
  json: 'json',
  yaml: 'yaml',
  xml: 'xml',
  properties: 'ini',
  html: 'html',
  text: 'text',
};

interface CollectedCodeBlock {
  readonly language: string;
  readonly code: string;
}

interface GeneratedToken {
  readonly c: string;
  readonly l: string | null;
  readonly d: string | null;
  readonly i?: boolean;
  readonly b?: boolean;
  readonly u?: boolean;
}

type GeneratedLine = GeneratedToken[];

await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });

const lessonFiles = await findFiles(CONTENT_ROOT, '.lesson.ts');
const highlighter = await createHighlighter({
  themes: [LIGHT_THEME, DARK_THEME],
  langs: [...new Set(Object.values(LANGUAGE_MAP))],
});

const blocks = new Map<
  string,
  { source: string; language: string; lines: GeneratedLine[] }
>();
let codeBlockCount = 0;

for (const file of lessonFiles) {
  const module = await import(pathToFileURL(file).href);
  const lesson = module.lesson;

  if (!lesson || typeof lesson !== 'object') {
    throw new Error(`${relative(file)} does not export a lesson object.`);
  }

  for (const block of collectCodeBlocks(lesson)) {
    codeBlockCount += 1;
    const key = codeBlockKey(block.language, block.code);
    const existing = blocks.get(key);

    if (existing) {
      if (existing.source !== block.code || existing.language !== block.language) {
        throw new Error(`Highlight key collision at ${relative(file)}.`);
      }
      continue;
    }

    const shikiLanguage = (
      LANGUAGE_MAP as Record<string, string | undefined>
    )[block.language];
    if (!shikiLanguage) {
      throw new Error(`No Shiki language mapping for "${block.language}".`);
    }

    const result = await highlighter.codeToTokensWithThemes(block.code, {
      lang: shikiLanguage as BundledLanguage,
      themes: { light: LIGHT_THEME, dark: DARK_THEME },
    });

    const lines = result.map((line) =>
      line.map((token) => {
        const light = token.variants.light;
        const dark = token.variants.dark;
        const style = light?.fontStyle ?? 0;
        const tokenRecord = {
          c: token.content,
          l: light?.color ?? null,
          d: dark?.color ?? null,
          ...(style & 1 ? { i: true } : {}),
          ...(style & 2 ? { b: true } : {}),
          ...(style & 4 ? { u: true } : {}),
        };
        return tokenRecord;
      }),
    );

    blocks.set(key, {
      source: block.code,
      language: block.language,
      lines,
    });
  }
}

const output = {
  formatVersion: 1,
  generator: `shiki@${SHIKI_VERSION}`,
  themes: {
    light: LIGHT_THEME,
    dark: DARK_THEME,
  },
  blocks: Object.fromEntries(
    [...blocks.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, block]) => [
        key,
        {
          language: block.language,
          lines: block.lines,
        },
      ]),
  ),
};

await fs.writeFile(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
highlighter.dispose();

console.log(
  `Highlighted ${codeBlockCount} code block${codeBlockCount === 1 ? '' : 's'} from ${lessonFiles.length} lesson${lessonFiles.length === 1 ? '' : 's'} into ${relative(OUTPUT_FILE)}.`,
);

async function findFiles(directory: string, suffix: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const found: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...(await findFiles(fullPath, suffix)));
    } else if (entry.isFile() && entry.name.endsWith(suffix)) {
      found.push(fullPath);
    }
  }

  return found.sort();
}

function collectCodeBlocks(value: unknown): CollectedCodeBlock[] {
  const found: CollectedCodeBlock[] = [];
  const seen = new WeakSet<object>();

  function visit(node: unknown): void {
    if (node === null || typeof node !== 'object' || seen.has(node)) {
      return;
    }
    seen.add(node);

    if (Array.isArray(node)) {
      for (const item of node) {
        visit(item);
      }
      return;
    }

    const record = node as Record<string, unknown>;
    if (
      typeof record.language === 'string' &&
      typeof record.code === 'string' &&
      record.code.length > 0
    ) {
      found.push({ language: record.language, code: record.code });
    }

    for (const child of Object.values(record)) {
      visit(child);
    }
  }

  visit(value);
  return found;
}

function relative(file: string): string {
  return path.relative(ROOT, file).replace(/\\/g, '/');
}
