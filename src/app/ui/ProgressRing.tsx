import type { CSSProperties, ReactNode } from 'react';
import styles from './ProgressRing.module.css';

interface ProgressRingProps {
  readonly progress: number;
  readonly size?: number;
  readonly stroke?: number;
  readonly tone?: string;
  readonly label?: string;
  readonly children?: ReactNode;
  readonly className?: string;
}

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProgressRing({
  progress,
  size = 64,
  stroke = 7,
  tone = 'rust',
  label,
  children,
  className,
}: ProgressRingProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  const offset = CIRCUMFERENCE * (1 - clamped);

  return (
    <span
      className={[styles.ring, className].filter(Boolean).join(' ')}
      style={
        {
          '--ring-size': `${size}px`,
          '--ring-stroke': stroke,
          '--ring-tone': `var(--tone-${tone}, var(--color-accent))`,
        } as CSSProperties
      }
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <svg className={styles.svg} viewBox="0 0 100 100" aria-hidden="true">
        <circle className={styles.track} cx="50" cy="50" r={RADIUS} />
        <circle
          className={styles.value}
          cx="50"
          cy="50"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <span className={styles.center}>{children}</span>
    </span>
  );
}
