import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import type { LessonStatus } from '@/lib/state/derive.js';
import { pluralize } from '../format.js';
import { ArrowRightIcon, CloseIcon } from '../ui/icons.js';
import { LESSON_STATUS_LABEL, lessonStatusHint } from './status.js';
import type { TrailStage } from './trail.js';
import styles from './field-run.module.css';

interface StagePanelProps {
  readonly stage: TrailStage;
  readonly status: LessonStatus;
  readonly onClose: () => void;
}

function two(value: number): string {
  return String(value).padStart(2, '0');
}

export function StagePanel({ stage, status, onClose }: StagePanelProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const reduced = useReducedMotion() === true;

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [stage.id]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const ctaLabel =
    status === 'in-progress'
      ? 'Continue the real lesson'
      : status === 'mastered'
        ? 'Revisit the real lesson'
        : 'Open the real lesson';

  return (
    <motion.aside
      animate={{ opacity: 1, x: 0 }}
      aria-labelledby="stage-panel-title"
      aria-modal="false"
      className={styles.stagePanel}
      initial={reduced ? false : { opacity: 0, x: 28 }}
      role="dialog"
      transition={{ duration: reduced ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.panelHead}>
        <span className={styles.panelKicker}>
          L{two(stage.levelIndex)} · Stage {two(stage.sequence)}
        </span>
        <button
          aria-label="Close the stage card"
          className={styles.panelClose}
          onClick={onClose}
          type="button"
        >
          <CloseIcon />
        </button>
      </div>

      <div className={styles.panelBody}>
        <div className={styles.panelStatusRow}>
          <span className={styles.statusChip} data-status={status}>
            <i aria-hidden="true" />
            {LESSON_STATUS_LABEL[status]}
          </span>
          <span className={styles.panelMinutes}>
            {pluralize(stage.estimatedMinutes, 'minute')}
          </span>
        </div>

        <h2
          className={styles.panelTitle}
          id="stage-panel-title"
          ref={headingRef}
          tabIndex={-1}
        >
          {stage.title}
        </h2>
        <p className={styles.panelDeck}>{stage.deck}</p>

        <dl className={styles.panelMeta}>
          <div>
            <dt>Level</dt>
            <dd>
              L{two(stage.levelIndex)} · {stage.levelTitle}
            </dd>
          </div>
          <div>
            <dt>Chapter</dt>
            <dd>{stage.chapterTitle}</dd>
          </div>
          <div>
            <dt>Concepts</dt>
            <dd>{pluralize(stage.concepts.length, 'concept')}</dd>
          </div>
        </dl>

        <div className={styles.panelConcepts}>
          <p className={styles.panelLabel}>Authored concepts</p>
          <ol>
            {stage.concepts.map((concept) => (
              <li key={concept.id}>
                <strong>{concept.title}</strong>
                <span>{concept.summary}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className={styles.panelNote}>
          {lessonStatusHint(status)} This card only reads the notebook; it does
          not write to it.
        </p>
      </div>

      <div className={styles.panelFooter}>
        <Link className={styles.panelCta} to={stage.route}>
          {ctaLabel}
          <ArrowRightIcon aria-hidden="true" />
        </Link>
        <button className={styles.panelSecondary} onClick={onClose} type="button">
          Back to the trail
        </button>
      </div>
    </motion.aside>
  );
}
