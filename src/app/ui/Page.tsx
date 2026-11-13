import type { ReactNode } from 'react';
import styles from './Page.module.css';

interface PageProps {
  readonly children: ReactNode;
  readonly wide?: boolean;
  readonly className?: string;
}

export function Page({ children, wide = false, className }: PageProps) {
  return (
    <div
      className={[styles.page, wide ? styles.wide : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
