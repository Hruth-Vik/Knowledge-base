import { useMemo, useState } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import type { Concept } from '@/lib/schema/concept.js';
import styles from './Specimen.module.css';

const KIND_TONE: Record<Concept['kind'], string> = {
  mechanism: 'teal',
  principle: 'indigo',
  term: 'ochre',
  'failure-mode': 'oxide',
};

const KIND_LABEL: Record<Concept['kind'], string> = {
  mechanism: 'Mechanism',
  principle: 'Principle',
  term: 'Term',
  'failure-mode': 'Failure mode',
};

interface SpecimenProps {
  readonly concepts: readonly Concept[];
  readonly lessonNumber: string;
  readonly lessonTitle: string;
  readonly readout: string;
}

interface NodePosition {
  readonly concept: Concept;
  readonly x: number;
  readonly y: number;
  readonly angle: number;
  readonly tone: string;
}

function placeConcepts(concepts: readonly Concept[]): NodePosition[] {
  const radiusX = concepts.length <= 3 ? 31 : 35;
  const radiusY = concepts.length <= 3 ? 29 : 31;
  const start = -Math.PI / 2;
  return concepts.map((concept, index) => {
    const angle = start + (index / concepts.length) * Math.PI * 2;
    return {
      concept,
      angle,
      tone: KIND_TONE[concept.kind],
      x: 50 + Math.cos(angle) * radiusX,
      y: 50 + Math.sin(angle) * radiusY,
    };
  });
}

export function Specimen({
  concepts,
  lessonNumber,
  lessonTitle,
  readout,
}: SpecimenProps) {
  const reduced = useReducedMotion();
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const positions = useMemo(() => placeConcepts(concepts), [concepts]);
  const byId = useMemo(
    () => new Map(concepts.map((concept) => [concept.id, concept])),
    [concepts],
  );
  const edges = useMemo(
    () =>
      concepts.flatMap((concept) =>
        concept.relations
          .filter((relation) => byId.has(relation.target))
          .map((relation) => ({
            from: concept.id,
            to: relation.target,
            type: relation.type,
          })),
      ),
    [byId, concepts],
  );
  const activeId = hoveredId ?? pinnedId;
  const active = activeId ? byId.get(activeId) : undefined;

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const stageX = useSpring(rawX, { stiffness: 120, damping: 22, mass: 0.5 });
  const stageY = useSpring(rawY, { stiffness: 120, damping: 22, mass: 0.5 });

  return (
    <div className={styles.wrap}>
      <div
        className={styles.stage}
        onPointerLeave={() => {
          setHoveredId(null);
          rawX.set(0);
          rawY.set(0);
        }}
        onPointerMove={(event) => {
          if (reduced || event.pointerType !== 'mouse') {
            return;
          }
          const rect = event.currentTarget.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width - 0.5;
          const py = (event.clientY - rect.top) / rect.height - 0.5;
          rawX.set(px * 16);
          rawY.set(py * 11);
        }}
      >
        <span className={styles.scan} aria-hidden="true" />
        <span className={styles.reticle} aria-hidden="true" />
        <span className={`${styles.ring} ${styles.ringOuter}`} aria-hidden="true" />
        <span className={`${styles.ring} ${styles.ringInner}`} aria-hidden="true" />
        <span className={styles.crosshairX} aria-hidden="true" />
        <span className={styles.crosshairY} aria-hidden="true" />

        <motion.div
          className={styles.orbit}
          style={{ x: reduced ? 0 : stageX, y: reduced ? 0 : stageY }}
        >
          <svg
            aria-hidden="true"
            className={styles.bonds}
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            {edges.map((edge, index) => {
              const from = positions.find(
                (position) => position.concept.id === edge.from,
              );
              const to = positions.find(
                (position) => position.concept.id === edge.to,
              );
              if (!from || !to) {
                return null;
              }
              const connected =
                activeId !== null &&
                (edge.from === activeId || edge.to === activeId);
              return (
                <motion.line
                  animate={{ opacity: 1, pathLength: 1 }}
                  className={styles.bond}
                  data-active={connected || undefined}
                  data-dashed={
                    edge.type === 'depends-on' ? undefined : 'true'
                  }
                  initial={reduced ? false : { opacity: 0, pathLength: 0 }}
                  key={`${edge.from}-${edge.to}-${index}`}
                  transition={{
                    duration: reduced ? 0 : 0.8,
                    delay: reduced ? 0 : 0.18 + index * 0.07,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  x1={from.x}
                  x2={to.x}
                  y1={from.y}
                  y2={to.y}
                />
              );
            })}
          </svg>

          <div className={styles.core} aria-hidden="true">
            <span className={styles.coreCode}>{lessonNumber}</span>
            <span className={styles.coreLabel}>
              {active ? active.title : lessonTitle}
            </span>
            <span className={styles.coreMeta}>
              {active ? KIND_LABEL[active.kind] : `${concepts.length} concepts`}
            </span>
          </div>

          {positions.map((position, index) => {
            const isActive = activeId === position.concept.id;
            const isPinned = pinnedId === position.concept.id;
            return (
              <motion.button
                animate={{ opacity: 1, scale: 1 }}
                aria-label={`${position.concept.title}. ${KIND_LABEL[position.concept.kind]}. ${position.concept.summary[0]}`}
                aria-pressed={isPinned}
                className={styles.node}
                data-active={isActive || undefined}
                data-tone={position.tone}
                initial={reduced ? false : { opacity: 0, scale: 0.72 }}
                key={position.concept.id}
                onBlur={() => setHoveredId(null)}
                onClick={() => {
                  setPinnedId((current) =>
                    current === position.concept.id
                      ? null
                      : position.concept.id,
                  );
                }}
                onFocus={() => setHoveredId(position.concept.id)}
                onPointerEnter={() => setHoveredId(position.concept.id)}
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                }}
                transition={{
                  duration: reduced ? 0 : 0.55,
                  delay: reduced ? 0 : 0.12 + index * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                type="button"
              >
                <span className={styles.nodeDot} aria-hidden="true" />
                <span className={styles.nodeLabel}>{position.concept.title}</span>
              </motion.button>
            );
          })}
        </motion.div>

        <div className={styles.legend} aria-hidden="true">
          <span>
            <i className={styles.solidLine} /> depends on
          </span>
          <span>
            <i className={styles.dashedLine} /> other authored link
          </span>
        </div>
      </div>

      <p className={styles.readout} aria-live="polite">
        <span className={styles.readoutMark} aria-hidden="true" />
        {active ? active.summary[0] : readout}
      </p>
    </div>
  );
}
