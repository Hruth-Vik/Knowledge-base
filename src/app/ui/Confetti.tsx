import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import styles from './Confetti.module.css';

interface ConfettiProps {
  /**
   * Increment this number to fire a new burst. A value of 0 renders nothing.
   */
  readonly fire: number;
  readonly pieces?: number;
}

const TONES = ['rust', 'sun', 'teal', 'indigo', 'rose', 'moss'];

export function Confetti({ fire, pieces = 42 }: ConfettiProps) {
  const [visible, setVisible] = useState(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
  }, []);

  useEffect(() => {
    if (fire <= 0 || reducedMotion.current) {
      return;
    }
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 1900);
    return () => window.clearTimeout(timer);
  }, [fire]);

  const shards = useMemo(
    () =>
      Array.from({ length: pieces }, (_, index) => {
        const left = (index * 37 + 11) % 100;
        const drift = ((index * 53) % 120) - 60;
        const delay = (index * 41) % 320;
        const duration = 1000 + ((index * 67) % 700);
        const rotate = ((index * 97) % 720) - 360;
        return {
          left,
          drift,
          delay,
          duration,
          rotate,
          tone: TONES[index % TONES.length],
          round: index % 3 === 0,
        };
      }),
    [pieces],
  );

  if (!visible) {
    return null;
  }

  return (
    <span className={styles.field} aria-hidden="true">
      {shards.map((shard, index) => (
        <span
          className={[styles.shard, shard.round ? styles.round : '']
            .filter(Boolean)
            .join(' ')}
          key={index}
          style={
            {
              '--left': `${shard.left}%`,
              '--drift': `${shard.drift}px`,
              '--delay': `${shard.delay}ms`,
              '--duration': `${shard.duration}ms`,
              '--rotate': `${shard.rotate}deg`,
              '--shard-tone': `var(--tone-${shard.tone})`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}
