import { useEffect, useRef, type ReactNode } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import styles from './Tilt.module.css';

interface TiltProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly max?: number;
  readonly glare?: boolean;
}

/**
 * Physical card response. Pointer tilt is limited to devices with a mouse so
 * touch scrolling never fights a transform.
 *
 * Pointer events are coalesced into one write per animation frame. Motion
 * values drive the transform and glare outside React, so moving the mouse
 * never re-renders the card.
 */
export function Tilt({
  children,
  className,
  max = 5,
  glare = true,
}: TiltProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(rawX, { stiffness: 180, damping: 22, mass: 0.35 });
  const rotateY = useSpring(rawY, { stiffness: 180, damping: 22, mass: 0.35 });
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const glareBackground = useMotionTemplate`radial-gradient(220px circle at ${glareX}% ${glareY}%, rgb(255 255 255 / 0.2), transparent 68%)`;

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
    if (rect.width === 0 || rect.height === 0) {
      return;
    }
    const px = (pointer.current.x - rect.left) / rect.width;
    const py = (pointer.current.y - rect.top) / rect.height;
    rawX.set((0.5 - py) * max * 2);
    rawY.set((px - 0.5) * max * 2);
    glareX.set(px * 100);
    glareY.set(py * 100);
  };

  const settle = () => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    rawX.set(0);
    rawY.set(0);
    glareX.set(50);
    glareY.set(50);
  };

  return (
    <motion.div
      className={[styles.root, className].filter(Boolean).join(' ')}
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
      style={{
        rotateX: reduced ? 0 : rotateX,
        rotateY: reduced ? 0 : rotateY,
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
      {glare && !reduced ? (
        <motion.span
          aria-hidden="true"
          className={styles.glare}
          style={{ background: glareBackground }}
        />
      ) : null}
    </motion.div>
  );
}
