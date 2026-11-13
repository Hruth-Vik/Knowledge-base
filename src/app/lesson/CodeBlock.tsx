import type { CSSProperties } from 'react';
import highlightedCode from '@/content/generated/highlighted-code.json';
import { codeBlockKey } from '@/lib/content/code-key.js';
import styles from './CodeBlock.module.css';

interface CodeAnnotation {
  readonly line: number;
  readonly note: string;
}

interface CodeBlockProps {
  readonly filename: string;
  readonly language: string;
  readonly code: string;
  readonly annotations?: readonly CodeAnnotation[];
  readonly output?: string;
}

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
  readonly formatVersion: number;
  readonly generator: string;
  readonly themes: Readonly<Record<string, string>>;
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

export function CodeBlock({
  filename,
  language,
  code,
  annotations = [],
  output,
}: CodeBlockProps) {
  const entry = highlights.blocks[codeBlockKey(language, code)];
  const lines = entry?.lines ?? fallbackLines(code);
  const annotationByLine = new Map(
    annotations.map((annotation, index) => [
      annotation.line,
      { note: annotation.note, number: index + 1 },
    ]),
  );

  return (
    <figure className={styles.block}>
      <figcaption className={styles.bar}>
        <span className={styles.filename}>{filename}</span>
        <span className={styles.language}>{language}</span>
      </figcaption>

      <div className={styles.codeFrame}>
        <pre
          className={styles.pre}
          tabIndex={0}
          aria-label={`${filename}, ${language} source code`}
        >
          <code>
            {lines.map((tokens, lineIndex) => {
              const lineNumber = lineIndex + 1;
              const annotation = annotationByLine.get(lineNumber);

              return (
                <span
                  className={[
                    styles.line,
                    annotation ? styles.annotatedLine : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  key={lineNumber}
                  style={
                    {
                      '--line-delay': `${Math.min(lineIndex, 24) * 16}ms`,
                    } as CSSProperties
                  }
                >
                  <span className={styles.lineNumber} aria-hidden="true">
                    {lineNumber}
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
                            key={`${lineNumber}-${tokenIndex}`}
                            style={
                              {
                                '--token-light': token.l ?? 'inherit',
                                '--token-dark':
                                  token.d ?? token.l ?? 'inherit',
                              } as TokenStyle
                            }
                          >
                            {token.c}
                          </span>
                        ))}
                  </span>
                  {annotation ? (
                    <span
                      className={styles.annotationMark}
                      title={`Line ${lineNumber}: ${annotation.note}`}
                      aria-label={`Annotation ${annotation.number} on line ${lineNumber}`}
                    >
                      {annotation.number}
                    </span>
                  ) : null}
                </span>
              );
            })}
          </code>
        </pre>
      </div>

      {annotations.length > 0 ? (
        <ol className={styles.notes}>
          {annotations.map((annotation) => (
            <li className={styles.note} key={`${annotation.line}-${annotation.note}`}>
              <span className={styles.noteLine}>Line {annotation.line}</span>
              <span>{annotation.note}</span>
            </li>
          ))}
        </ol>
      ) : null}

      {output ? (
        <div className={styles.output}>
          <p className={styles.outputLabel}>Output</p>
          <pre className={styles.outputCode}>{output}</pre>
        </div>
      ) : null}
    </figure>
  );
}
