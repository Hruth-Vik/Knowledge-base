import type { CSSProperties } from 'react';
import highlightedCode from '@/content/generated/highlighted-code.json';
import { codeBlockKey } from '@/lib/content/code-key.js';
import styles from './CodePeek.module.css';

interface GeneratedToken {
  readonly c: string;
  readonly l: string | null;
  readonly d: string | null;
  readonly i?: boolean;
  readonly b?: boolean;
  readonly u?: boolean;
}

interface HighlightEntry {
  readonly language: string;
  readonly lines: readonly (readonly GeneratedToken[])[];
}

interface HighlightFile {
  readonly blocks: Readonly<Record<string, HighlightEntry>>;
}

type TokenStyle = CSSProperties & {
  '--token-light'?: string;
  '--token-dark'?: string;
};

const highlights = highlightedCode as HighlightFile;

function fallbackLines(code: string): GeneratedToken[][] {
  return code
    .replace(/\s+$/, '')
    .split(/\r?\n/)
    .map((line) => [{ c: line || ' ', l: null, d: null }]);
}

interface CodePeekProps {
  readonly code: string;
  readonly filename: string;
  readonly language: string;
  readonly maxLines?: number;
}

/**
 * A live sample from the recommended lesson. This is the same pre-highlighted
 * token pipeline the lesson uses, cut to a readable window rather than a
 * second, decorative code mock.
 */
export function CodePeek({
  code,
  filename,
  language,
  maxLines = 9,
}: CodePeekProps) {
  const entry = highlights.blocks[codeBlockKey(language, code)];
  const allLines = entry?.lines ?? fallbackLines(code);
  const lines = allLines.slice(0, maxLines);
  const clipped = allLines.length > maxLines;

  return (
    <figure className={styles.peek}>
      <figcaption className={styles.bar}>
        <span className={styles.filename}>{filename}</span>
        <span className={styles.language}>{language}</span>
      </figcaption>
      <pre className={styles.pre} tabIndex={0} aria-label={`${filename} preview`}>
        <code>
          {lines.map((tokens, lineIndex) => (
            <span className={styles.line} key={lineIndex}>
              <span className={styles.lineNumber} aria-hidden="true">
                {String(lineIndex + 1).padStart(2, '0')}
              </span>
              <span className={styles.lineCode}>
                {tokens.length === 0
                  ? '\u00a0'
                  : tokens.map((token, tokenIndex) => (
                      <span
                        className={[
                          styles.token,
                          token.i ? styles.italic : '',
                          token.b ? styles.bold : '',
                          token.u ? styles.underline : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        key={`${lineIndex}-${tokenIndex}`}
                        style={
                          {
                            '--token-light': token.l ?? 'inherit',
                            '--token-dark': token.d ?? token.l ?? 'inherit',
                          } as TokenStyle
                        }
                      >
                        {token.c}
                      </span>
                    ))}
              </span>
            </span>
          ))}
          {clipped ? (
            <span className={styles.line}>
              <span className={styles.lineNumber} aria-hidden="true">
                …
              </span>
              <span className={styles.more}>more in the lesson</span>
            </span>
          ) : null}
        </code>
      </pre>
    </figure>
  );
}
