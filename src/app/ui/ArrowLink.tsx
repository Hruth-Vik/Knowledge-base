import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from './icons.js';
import styles from './ArrowLink.module.css';

interface ArrowLinkProps {
  readonly to: string;
  readonly children: ReactNode;
  readonly className?: string;
}

export function ArrowLink({ to, children, className }: ArrowLinkProps) {
  return (
    <Link
      className={[styles.link, className].filter(Boolean).join(' ')}
      to={to}
    >
      <span>{children}</span>
      <ArrowRightIcon className={styles.arrow} />
    </Link>
  );
}
