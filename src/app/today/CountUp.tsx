import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'motion/react';

interface CountUpProps {
  readonly value: number;
  readonly duration?: number;
  readonly className?: string;
  readonly ariaLabel?: string;
}

/**
 * A number that settles into place instead of snapping. The accessible value
 * is always the final number; only the visible glyphs animate.
 */
export function CountUp({
  value,
  duration = 0.9,
  className,
  ariaLabel,
}: CountUpProps) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);
  const current = useRef(reduced ? value : 0);

  useEffect(() => {
    if (reduced) {
      current.current = value;
      setDisplay(value);
      return;
    }

    const controls = animate(current.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        current.current = latest;
        const next = Math.round(latest);
        setDisplay((shown) => (shown === next ? shown : next));
      },
    });

    return () => controls.stop();
  }, [duration, reduced, value]);

  return (
    <span
      className={className}
      aria-label={ariaLabel}
      title={ariaLabel}
      aria-live="off"
    >
      {display}
    </span>
  );
}
