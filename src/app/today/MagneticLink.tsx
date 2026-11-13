import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useSpring } from 'motion/react';

const MotionLink = motion.create(Link);

interface MagneticLinkProps {
  readonly to: string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly strength?: number;
}

/**
 * The primary action leans toward the pointer, then settles. Keyboard focus
 * and reduced-motion users get the same link with no displacement.
 *
 * Pointer moves are sampled once per animation frame; the spring values write
 * straight to the compositor, so React stays out of the pointer path.
 */
export function MagneticLink({
  to,
  children,
  className,
  strength = 0.18,
}: MagneticLinkProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLAnchorElement>(null);
  const frame = useRef<number | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const x = useSpring(0, { stiffness: 260, damping: 24, mass: 0.4 });
  const y = useSpring(0, { stiffness: 260, damping: 24, mass: 0.4 });

  useEffect(
    () => () => {
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
      }
    },
    [],
  );

  const flush = () => {
    frame.current = null;
    const node = ref.current;
    if (!node) {
      return;
    }
    const rect = node.getBoundingClientRect();
    const dx = pointer.current.x - (rect.left + rect.width / 2);
    const dy = pointer.current.y - (rect.top + rect.height / 2);
    x.set(dx * strength);
    y.set(dy * strength);
  };

  const settle = () => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    x.set(0);
    y.set(0);
  };

  return (
    <MotionLink
      className={className}
      onPointerLeave={settle}
      onPointerMove={(event) => {
        if (reduced || event.pointerType !== 'mouse') {
          return;
        }
        pointer.current.x = event.clientX;
        pointer.current.y = event.clientY;
        if (frame.current === null) {
          frame.current = requestAnimationFrame(flush);
        }
      }}
      ref={ref}
      style={{ x: reduced ? 0 : x, y: reduced ? 0 : y }}
      to={to}
      whileTap={reduced ? undefined : { scale: 0.985 }}
    >
      {children}
    </MotionLink>
  );
}
