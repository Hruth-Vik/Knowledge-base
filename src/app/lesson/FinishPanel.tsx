import type { LessonProgress } from '@/lib/state/schema.js';
import { getMasteryChecklist } from '@/lib/state/derive.js';
import { Button } from '../ui/Button.js';
import styles from './FinishPanel.module.css';

interface FinishPanelProps {
  readonly progress: LessonProgress | undefined;
  readonly onToggleDone: (done: boolean) => void;
}

export function FinishPanel({ progress, onToggleDone }: FinishPanelProps) {
  const checklist = getMasteryChecklist(progress);
  const done = Boolean(progress?.doneAt);

  return (
    <div
      className={[styles.panel, checklist.mastered ? styles.mastered : '']
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.head}>
        <div>
          <p className={styles.kicker}>
            {checklist.mastered ? 'Mastery recorded' : 'Lesson result'}
          </p>
          <h3 className={styles.title}>
            {checklist.mastered
              ? 'You have finished the whole loop.'
              : done
                ? 'Done is recorded. Mastery is still open.'
                : 'Finish with evidence, not a scroll position.'}
          </h3>
        </div>
        <span
          className={[styles.state, checklist.mastered ? styles.stateMastered : '']
            .filter(Boolean)
            .join(' ')}
        >
          {checklist.mastered
            ? 'Mastered'
            : done
              ? 'Done'
              : 'In progress'}
        </span>
      </div>

      <ul className={styles.checklist}>
        <li className={styles.item}>
          <span
            className={[styles.mark, done ? styles.markDone : ''].join(' ')}
            aria-hidden="true"
          />
          <div>
            <p className={styles.itemTitle}>Marked done</p>
            <p className={styles.itemNote}>
              A deliberate signal that you can explain the mechanism without
              the page.
            </p>
          </div>
          <span className={styles.itemState}>{done ? 'Recorded' : 'Open'}</span>
        </li>
        <li className={styles.item}>
          <span
            className={[
              styles.mark,
              checklist.recallPassed ? styles.markDone : '',
            ].join(' ')}
            aria-hidden="true"
          />
          <div>
            <p className={styles.itemTitle}>Recall check</p>
            <p className={styles.itemNote}>
              Three questions, all three correct. The explain question is
              self-marked against its key points.
            </p>
          </div>
          <span className={styles.itemState}>
            {checklist.recallPassed ? '3 / 3' : 'Open'}
          </span>
        </li>
        <li className={styles.item}>
          <span
            className={[
              styles.mark,
              checklist.exercisePassed ? styles.markDone : '',
            ].join(' ')}
            aria-hidden="true"
          />
          <div>
            <p className={styles.itemTitle}>Exercise</p>
            <p className={styles.itemNote}>
              The required rubric checks are marked. You still verify the
              program on your own machine.
            </p>
          </div>
          <span className={styles.itemState}>
            {checklist.exercisePassed ? 'Complete' : 'Open'}
          </span>
        </li>
      </ul>

      <div className={styles.actionRow}>
        {done ? (
          <Button onClick={() => onToggleDone(false)}>Undo done mark</Button>
        ) : (
          <Button variant="primary" onClick={() => onToggleDone(true)}>
            Mark lesson done
          </Button>
        )}
        <p className={styles.note}>
          Marking done records the lesson in today&apos;s activity. Mastery
          requires done, recall, and exercise together.
        </p>
      </div>
    </div>
  );
}
