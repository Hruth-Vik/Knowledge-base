import type { ReactNode } from 'react';
import { SectionLabel } from './SectionLabel.js';
import styles from './PageSection.module.css';

export type SectionTone =
  | 'neutral'
  | 'rust'
  | 'ochre'
  | 'teal'
  | 'moss'
  | 'oxide'
  | 'plum'
  | 'indigo';

interface PageSectionProps {
  readonly index: string;
  readonly label: string;
  readonly id?: string;
  readonly tone?: SectionTone;
  readonly children: ReactNode;
}

export function PageSection({
  index,
  label,
  id,
  tone = 'neutral',
  children,
}: PageSectionProps) {
  const labelId = id ? `${id}-label` : undefined;

  return (
    <section
      className={[styles.section, styles[tone]].join(' ')}
      id={id}
      aria-labelledby={labelId}
    >
      <SectionLabel index={index} label={label} id={labelId} />
      <div className={styles.content}>{children}</div>
    </section>
  );
}
