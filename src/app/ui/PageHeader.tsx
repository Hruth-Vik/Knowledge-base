import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  readonly kicker: string;
  readonly title: string;
  readonly deck?: string;
  readonly aside?: ReactNode;
}

export function PageHeader({ kicker, title, deck, aside }: PageHeaderProps) {
  return (
    <header className={styles.hero}>
      <div className={styles.content}>
        <p className={styles.kicker}>
          <span className={styles.kickerDot} aria-hidden="true" />
          {kicker}
        </p>
        <h1 className={styles.title}>{title}</h1>
        {deck ? <p className={styles.deck}>{deck}</p> : null}
      </div>
      {aside ? <div className={styles.aside}>{aside}</div> : null}
    </header>
  );
}
