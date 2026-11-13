import { memo } from 'react';
import styles from './field-run.module.css';

/**
 * The sprite is intentionally made of flat, outlined SVG shapes. All motion is
 * CSS transform work driven by data attributes on the player wrapper, so the
 * run loop never re-renders this tree.
 */
export const ChibiSprite = memo(function ChibiSprite() {
  return (
    <svg
      aria-hidden="true"
      className={styles.chibi}
      focusable="false"
      viewBox="0 0 120 120"
    >
      <g className={styles.scarfBack}>
        <path
          className={`${styles.scarfTail} ${styles.scarfTailA}`}
          d="M48 64C35 60 21 64 7 58c6 11 21 14 41 11Z"
        />
        <path
          className={`${styles.scarfTail} ${styles.scarfTailB}`}
          d="M47 69C35 72 20 79 10 87c15 1 29-5 40-11Z"
        />
      </g>

      <g className={styles.legs}>
        <g className={styles.legBack}>
          <rect height="18" rx="5" width="10" x="52" y="94" />
          <rect height="8" rx="4" width="16" x="50" y="108" />
        </g>
        <g className={styles.legFront}>
          <rect height="18" rx="5" width="10" x="66" y="94" />
          <rect height="8" rx="4" width="17" x="64" y="108" />
        </g>
      </g>

      <g className={styles.armBack}>
        <path d="M46 66 35 83" />
      </g>

      <g className={styles.body}>
        <path
          className={styles.coat}
          d="M44 64c0-6 7-10 16-10s16 4 16 10l5 32c1 4-2 6-6 6H45c-4 0-7-2-6-6Z"
        />
        <path className={styles.coatSeam} d="M60 60v36" />
        <rect className={styles.pocket} height="9" rx="2" width="12" x="66" y="78" />
        <circle className={styles.badge} cx="50" cy="76" r="3.4" />
      </g>

      <g className={styles.armFront}>
        <path d="M76 66 87 83" />
      </g>

      <g className={styles.head}>
        <path
          className={styles.hairTuft}
          d="M52 12c2-8 11-11 18-8-4 2-6 5-5 9Z"
        />
        <ellipse className={styles.face} cx="60" cy="38" rx="30" ry="27" />
        <path
          className={styles.hair}
          d="M31 34c1-16 14-25 29-25 16 0 28 9 29 24-7-7-14-9-22-10-8 7-22 10-36 11Z"
        />
        <path className={styles.goggleStrap} d="M25 35h70" />
        <circle className={styles.goggleRim} cx="47" cy="39" r="15" />
        <circle className={styles.goggleRim} cx="75" cy="39" r="15" />
        <circle className={styles.goggleGlass} cx="47" cy="39" r="11.5" />
        <circle className={styles.goggleGlass} cx="75" cy="39" r="11.5" />
        <path className={styles.goggleGlare} d="M40 33c1-3 4-5 7-5" />
        <path className={styles.goggleGlare} d="M68 33c1-3 4-5 7-5" />
        <circle className={styles.eye} cx="48" cy="40" r="3.2" />
        <circle className={styles.eye} cx="76" cy="40" r="3.2" />
        <path className={styles.mouth} d="M56 55c2.6 2.2 5.4 2.2 8 0" />
        <ellipse className={styles.blush} cx="34" cy="52" rx="4.4" ry="2.5" />
        <ellipse className={styles.blush} cx="88" cy="52" rx="4.4" ry="2.5" />
      </g>

      <g className={styles.scarfFront}>
        <rect height="9" rx="4.5" width="34" x="43" y="57" />
        <path d="M56 66v5l-6 6" />
      </g>
    </svg>
  );
});
