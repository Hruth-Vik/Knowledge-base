import type { ReactNode } from 'react';
import styles from './StateMark.module.css';

export type StateTone =
  | 'neutral'
  | 'progress'
  | 'done'
  | 'mastered'
  | 'due'
  | 'rest';

interface StateMarkProps {
  readonly tone: StateTone;
  readonly children: ReactNode;
}

/**
 * State is always written as a word. The mark is a second, non-color cue.
 */
export function StateMark({ tone, children }: StateMarkProps) {
  return (
    <span className={[styles.mark, styles[tone]].join(' ')}>
      <span className={styles.symbol} aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}
