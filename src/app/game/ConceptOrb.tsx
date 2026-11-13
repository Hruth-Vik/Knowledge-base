import { memo, type CSSProperties } from 'react';
import type { TrailConcept } from './trail.js';
import styles from './field-run.module.css';

interface ConceptOrbProps {
  readonly orb: TrailConcept;
  readonly observed: boolean;
  readonly near: boolean;
}

export const ConceptOrb = memo(function ConceptOrb({
  orb,
  observed,
  near,
}: ConceptOrbProps) {
  const style = {
    left: `${orb.x}px`,
    bottom: `calc(var(--ground) + ${orb.height}px)`,
    '--orb-delay': `${((orb.stageIndex * 0.43 + orb.indexInStage * 0.67) % 3.4).toFixed(2)}s`,
  } as CSSProperties;

  return (
    <span
      aria-hidden="true"
      className={styles.orb}
      data-near={near ? 'true' : undefined}
      data-observed={observed ? 'true' : undefined}
      style={style}
      title={`${orb.title} — ${orb.summary}`}
    >
      <span className={styles.orbHalo} />
      <span className={styles.orbGlass}>
        <span className={styles.orbCore} />
        {observed ? <span className={styles.orbCheck} /> : null}
      </span>
      <span className={styles.orbLabel}>{orb.title}</span>
    </span>
  );
});
