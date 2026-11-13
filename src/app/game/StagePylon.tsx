import { memo } from 'react';
import type { LessonStatus } from '@/lib/state/derive.js';
import { LESSON_STATUS_LABEL } from './status.js';
import type { TrailStage } from './trail.js';
import styles from './field-run.module.css';

interface StagePylonProps {
  readonly stage: TrailStage;
  readonly status: LessonStatus;
  readonly near: boolean;
  readonly selected: boolean;
  readonly onSelect: (stageId: string) => void;
}

function two(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * The pylon is pointer-only scenery. Its accessible twin is the curriculum
 * list below the field, which exposes the same stage and status as real links
 * and buttons.
 */
export const StagePylon = memo(function StagePylon({
  stage,
  status,
  near,
  selected,
  onSelect,
}: StagePylonProps) {
  return (
    <span
      aria-hidden="true"
      className={styles.pylon}
      data-near={near ? 'true' : undefined}
      data-selected={selected ? 'true' : undefined}
      data-stage-pylon="true"
      data-status={status}
      onClick={() => onSelect(stage.id)}
      style={{ left: `${stage.x}px` }}
      title={`${stage.title} — ${LESSON_STATUS_LABEL[status]}`}
    >
      <span className={styles.pylonBeacon} />
      <span className={styles.pylonPole} />
      <span className={styles.pylonFlag}>
        <span className={styles.pylonFlagLevel}>L{two(stage.levelIndex)}</span>
        <span className={styles.pylonFlagStage}>{two(stage.sequence)}</span>
        <span className={styles.pylonFlagStatus}>
          {LESSON_STATUS_LABEL[status]}
        </span>
      </span>
      <span className={styles.pylonBase} />
    </span>
  );
});
