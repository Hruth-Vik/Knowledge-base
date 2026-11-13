import type { ReactNode } from 'react';
import styles from './Prose.module.css';

interface ProseProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function Prose({ children, className }: ProseProps) {
  return (
    <div className={[styles.prose, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}
