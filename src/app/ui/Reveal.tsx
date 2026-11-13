import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import styles from './Reveal.module.css';

interface RevealProps {
  readonly children: ReactNode;
  readonly delay?: number;
  readonly className?: string;
  readonly as?: 'div' | 'section' | 'li' | 'article';
}

/**
 * Content is visible without JavaScript and never waits for an observer to
 * decide whether it exists. The animation is a small entrance, not a gate.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = 'div',
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }
    if (!('IntersectionObserver' in window)) {
      setRevealed(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      className={[styles.reveal, revealed ? styles.in : '', className]
        .filter(Boolean)
        .join(' ')}
      ref={ref as never}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
