import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { catalog } from '@/lib/content/catalog.js';
import type { CompiledLesson } from '@/lib/content/types.js';
import type { RegisteredConcept } from '@/lib/concepts/registry.js';
import { deriveLessonStatus, type LessonStatus } from '@/lib/state/derive.js';
import { pluralize } from '../format.js';
import { useAppStore } from '../store.js';
import { ArrowRightIcon, CloseIcon, MapIcon, SparkIcon } from '../ui/icons.js';
import styles from './FieldAtlas.module.css';

type ConceptStatus = 'unseen' | 'learned' | 'decaying' | 'mastered';

const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 680;
const CENTER_X = VIEW_WIDTH / 2;
const CENTER_Y = VIEW_HEIGHT / 2;

const JAVA = catalog.languages.find(
  (language) => language.manifest.id === 'java',
);
const LEVELS = (JAVA?.levels ?? []).filter((level) =>
  catalog.concepts
    .forLanguage('java')
    .some((concept) => concept.owner.levelId === level.manifest.id),
);
const LEVEL_BY_ID = new Map(LEVELS.map((level) => [level.manifest.id, level]));
const LESSON_BY_ID = new Map(
  catalog.lessons.map((record) => [record.lesson.id, record]),
);
const CONCEPTS_BY_LEVEL = new Map(
  LEVELS.map((level) => [
    level.manifest.id,
    catalog.concepts
      .forLanguage('java')
      .filter((concept) => concept.owner.levelId === level.manifest.id),
  ]),
);

const STATUS_LABEL: Record<ConceptStatus, string> = {
  unseen: 'Unseen',
  learned: 'Met',
  decaying: 'Fading',
  mastered: 'Mastered',
};

const KIND_TONE: Record<RegisteredConcept['kind'], string> = {
  mechanism: 'teal',
  principle: 'indigo',
  term: 'ochre',
  'failure-mode': 'oxide',
};

interface AtlasNode {
  readonly concept: RegisteredConcept;
  readonly x: number;
  readonly y: number;
  readonly labelX: number;
  readonly labelY: number;
  readonly labelTransform: string;
  readonly tone: string;
  readonly status: ConceptStatus;
}

interface AtlasBranch {
  readonly lesson: CompiledLesson;
  readonly anchorX: number;
  readonly anchorY: number;
  readonly labelX: number;
  readonly labelY: number;
  readonly nodes: readonly AtlasNode[];
}

interface AtlasEdge {
  readonly id: string;
  readonly from: AtlasNode;
  readonly to: AtlasNode;
  readonly type: string;
  readonly path: string;
}

function conceptStatus(
  lessonStatus: LessonStatus,
  weakConceptIds: ReadonlySet<string>,
  conceptId: string,
): ConceptStatus {
  if (weakConceptIds.has(conceptId)) {
    return 'decaying';
  }
  if (lessonStatus === 'mastered') {
    return 'mastered';
  }
  if (lessonStatus === 'not-started') {
    return 'unseen';
  }
  return 'learned';
}

function buildBranches(
  concepts: readonly RegisteredConcept[],
  weakConceptIds: ReadonlySet<string>,
  lessonStatusFor: (lessonId: string) => LessonStatus,
): AtlasBranch[] {
  const grouped = new Map<string, RegisteredConcept[]>();
  for (const concept of concepts) {
    const group = grouped.get(concept.owner.lessonId) ?? [];
    group.push(concept);
    grouped.set(concept.owner.lessonId, group);
  }

  const ordered = [...grouped.entries()]
    .map(([lessonId, group]) => {
      const lesson = LESSON_BY_ID.get(lessonId);
      return {
        lesson,
        group: [...group].sort((a, b) => a.id.localeCompare(b.id)),
      };
    })
    .filter(
      (entry): entry is { lesson: CompiledLesson; group: RegisteredConcept[] } =>
        entry.lesson !== undefined,
    )
    .sort((a, b) => a.lesson.lesson.sequence - b.lesson.lesson.sequence);

  return ordered.map(({ lesson, group }, branchIndex) => {
    const angle =
      -Math.PI / 2 + (branchIndex / Math.max(ordered.length, 1)) * Math.PI * 2;
    const anchorX = CENTER_X + Math.cos(angle) * 258;
    const anchorY = CENTER_Y + Math.sin(angle) * 188;
    const spread = Math.min(0.42, 1.15 / Math.max(group.length, 1));
    const lessonStatus = lessonStatusFor(lesson.lesson.id);

    const nodes = group.map((concept, conceptIndex) => {
      const localAngle =
        angle +
        (conceptIndex - (group.length - 1) / 2) * spread;
      const distance = 74 + (conceptIndex % 2) * 12;
      const x = anchorX + Math.cos(localAngle) * distance;
      const y = anchorY + Math.sin(localAngle) * distance;
      const horizontal = Math.cos(localAngle);
      const vertical = Math.sin(localAngle);
      const alignX = horizontal > 0.28 ? 0 : horizontal < -0.28 ? -100 : -50;
      const alignY = vertical > 0.4 ? 0 : vertical < -0.4 ? -100 : -50;

      return {
        concept,
        x,
        y,
        labelX: horizontal * 34,
        labelY: vertical * 29,
        labelTransform: `translate(${alignX}%, ${alignY}%)`,
        tone: KIND_TONE[concept.kind],
        status: conceptStatus(lessonStatus, weakConceptIds, concept.id),
      };
    });

    return {
      lesson,
      anchorX,
      anchorY,
      labelX: anchorX - Math.cos(angle) * 64,
      labelY: anchorY - Math.sin(angle) * 58,
      nodes,
    };
  });
}

function edgePath(from: AtlasNode, to: AtlasNode): string {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const controlX = midX + (CENTER_X - midX) * 0.16;
  const controlY = midY + (CENTER_Y - midY) * 0.16;
  return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
}

interface FieldAtlasProps {
  readonly initialLevelId?: string;
}

export function FieldAtlas({ initialLevelId }: FieldAtlasProps) {
  const data = useAppStore((state) => state.data);
  const reduced = useReducedMotion();
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const mapScrollRef = useRef<HTMLDivElement>(null);
  const [levelId, setLevelId] = useState(() =>
    initialLevelId && LEVEL_BY_ID.has(initialLevelId)
      ? initialLevelId
      : (LEVELS[0]?.manifest.id ?? ''),
  );
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [traceOn, setTraceOn] = useState(false);

  const level = LEVEL_BY_ID.get(levelId) ?? LEVELS[0];
  const concepts = CONCEPTS_BY_LEVEL.get(level?.manifest.id ?? '') ?? [];

  const weakConceptIds = useMemo(() => {
    const weak = new Set<string>();
    for (const card of Object.values(data.review.cards)) {
      if (
        card.phase === 'relearning' ||
        (card.lastRating !== null && card.lastRating <= 2)
      ) {
        for (const conceptId of card.conceptIds) {
          weak.add(conceptId);
        }
      }
    }
    return weak;
  }, [data.review.cards]);

  const branches = useMemo(() => {
    if (!level) {
      return [];
    }
    return buildBranches(
      concepts,
      weakConceptIds,
      (lessonId) => deriveLessonStatus(data.lessons[lessonId]),
    );
  }, [concepts, data.lessons, level, weakConceptIds]);

  const nodes = useMemo(
    () => branches.flatMap((branch) => branch.nodes),
    [branches],
  );
  const nodeById = useMemo(
    () => new Map(nodes.map((node) => [node.concept.id, node])),
    [nodes],
  );

  const edges = useMemo<AtlasEdge[]>(() => {
    const seen = new Set<string>();
    const result: AtlasEdge[] = [];
    for (const node of nodes) {
      for (const relation of node.concept.relations) {
        const target = nodeById.get(relation.target);
        if (!target) {
          continue;
        }
        const key = [node.concept.id, relation.target].sort().join('|');
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        result.push({
          id: `${node.concept.id}-${relation.target}`,
          from: node,
          to: target,
          type: relation.type,
          path: edgePath(node, target),
        });
      }
    }
    return result;
  }, [nodeById, nodes]);

  const activeId = hoveredId ?? pinnedId;
  const activeNode = activeId ? nodeById.get(activeId) : undefined;
  const activeConcept = activeNode?.concept;
  const activeLesson = activeConcept
    ? LESSON_BY_ID.get(activeConcept.owner.lessonId)
    : undefined;
  const traceTargets = useMemo(() => {
    if (!activeConcept) {
      return new Set<string>();
    }
    const traced = catalog.concepts.traceDependencies(activeConcept.id);
    return new Set([activeConcept.id, ...traced.map((concept) => concept.id)]);
  }, [activeConcept]);
  const traceCount = Math.max(0, traceTargets.size - 1);
  const tracedConcepts = useMemo(
    () =>
      activeConcept
        ? catalog.concepts
            .traceDependencies(activeConcept.id)
            .map((concept) => concept.title)
        : [],
    [activeConcept],
  );

  const activeBranchLessonId = activeConcept?.owner.lessonId;
  const isDimmed = (id: string): boolean =>
    traceOn && activeConcept !== undefined && !traceTargets.has(id);

  const selectLevel = (nextLevelId: string) => {
    setLevelId(nextLevelId);
    setPinnedId(null);
    setHoveredId(null);
    setTraceOn(false);
  };

  useEffect(() => {
    const node = mapScrollRef.current;
    if (!node) {
      return;
    }
    const center = () => {
      const overflow = node.scrollWidth - node.clientWidth;
      if (overflow > 0) {
        node.scrollLeft = overflow / 2;
      }
    };
    center();
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(center);
    observer?.observe(node);
    return () => observer?.disconnect();
  }, [levelId]);

  if (!level) {
    return null;
  }

  return (
    <div className={styles.atlas}>
      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist" aria-label="Concept atlas level">
          {LEVELS.map((candidate) => {
            const isActive = candidate.manifest.id === level.manifest.id;
            const count =
              CONCEPTS_BY_LEVEL.get(candidate.manifest.id)?.length ?? 0;
            return (
              <button
                aria-controls={`atlas-panel-${candidate.manifest.id}`}
                aria-selected={isActive}
                className={styles.tab}
                id={`atlas-tab-${candidate.manifest.id}`}
                key={candidate.manifest.id}
                onClick={() => selectLevel(candidate.manifest.id)}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
                    return;
                  }
                  event.preventDefault();
                  const index = LEVELS.findIndex(
                    (item) => item.manifest.id === candidate.manifest.id,
                  );
                  const offset = event.key === 'ArrowRight' ? 1 : -1;
                  const next =
                    LEVELS[(index + offset + LEVELS.length) % LEVELS.length];
                  if (next) {
                    selectLevel(next.manifest.id);
                    tabRefs.current.get(next.manifest.id)?.focus();
                  }
                }}
                ref={(node) => {
                  if (node) {
                    tabRefs.current.set(candidate.manifest.id, node);
                  } else {
                    tabRefs.current.delete(candidate.manifest.id);
                  }
                }}
                role="tab"
                tabIndex={isActive ? 0 : -1}
                type="button"
              >
                <span className={styles.tabIndex}>
                  L{candidate.manifest.index}
                </span>
                <span className={styles.tabCount}>{count}</span>
              </button>
            );
          })}
        </div>
        <p className={styles.toolbarNote}>
          <span className={styles.liveDot} aria-hidden="true" />
          {pluralize(concepts.length, 'concept')} ·{' '}
          {pluralize(branches.length, 'lesson')}
        </p>
      </div>

      <div
        aria-labelledby={`atlas-tab-${level.manifest.id}`}
        className={styles.body}
        id={`atlas-panel-${level.manifest.id}`}
        role="tabpanel"
      >
        <div className={styles.mapFrame}>
          <span className={styles.mapHint} aria-hidden="true">
            Hover, tap, or drag
          </span>
          <span className={styles.mapLegend} aria-hidden="true">
            <i data-kind="solid" /> depends on
            <i data-kind="dashed" /> other authored link
          </span>
          <div className={styles.mapScroll} ref={mapScrollRef}>
            <div className={styles.map}>
              <svg
                aria-hidden="true"
                className={styles.edges}
                viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
              >
              <defs>
                <radialGradient id="atlas-core-glow">
                  <stop offset="0%" stopColor="var(--tone-teal)" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="var(--tone-teal)" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle
                cx={CENTER_X}
                cy={CENTER_Y}
                fill="url(#atlas-core-glow)"
                r="250"
              />
              {[0, 1, 2].map((ring) => (
                <ellipse
                  className={styles.orbitRing}
                  cx={CENTER_X}
                  cy={CENTER_Y}
                  key={ring}
                  rx={210 + ring * 78}
                  ry={146 + ring * 56}
                />
              ))}
              {branches.map((branch) => (
                <line
                  className={styles.spoke}
                  key={`spoke-${branch.lesson.lesson.id}`}
                  x1={CENTER_X}
                  x2={branch.anchorX}
                  y1={CENTER_Y}
                  y2={branch.anchorY}
                />
              ))}
              {branches.flatMap((branch) =>
                branch.nodes.map((node) => (
                  <line
                    className={styles.stem}
                    key={`stem-${node.concept.id}`}
                    x1={branch.anchorX}
                    x2={node.x}
                    y1={branch.anchorY}
                    y2={node.y}
                  />
                )),
              )}
              {edges.map((edge) => {
                const connected =
                  activeConcept !== undefined &&
                  (edge.from.concept.id === activeConcept.id ||
                    edge.to.concept.id === activeConcept.id);
                return (
                  <path
                    className={styles.relation}
                    data-active={connected || undefined}
                    data-dim={
                      activeConcept !== undefined && !connected
                        ? 'true'
                        : undefined
                    }
                    data-dashed={
                      edge.type === 'depends-on' ? undefined : 'true'
                    }
                    d={edge.path}
                    key={edge.id}
                  />
                );
              })}
            </svg>

            <div className={styles.core} aria-hidden="true">
              <span className={styles.coreLevel}>L{level.manifest.index}</span>
              <span className={styles.coreTitle}>{level.manifest.title}</span>
              <span className={styles.coreCount}>
                {concepts.length} concepts
              </span>
            </div>

            {branches.map((branch) => (
              <div
                className={styles.branch}
                data-active={
                  activeBranchLessonId === branch.lesson.lesson.id || undefined
                }
                key={branch.lesson.lesson.id}
                style={{
                  left: `${(branch.labelX / VIEW_WIDTH) * 100}%`,
                  top: `${(branch.labelY / VIEW_HEIGHT) * 100}%`,
                }}
              >
                <span className={styles.branchIndex}>
                  {String(branch.lesson.lesson.sequence).padStart(2, '0')}
                </span>
                <span className={styles.branchTitle}>
                  {branch.lesson.lesson.title}
                </span>
              </div>
            ))}

            {nodes.map((node, index) => {
              const isActive = activeId === node.concept.id;
              const isPinned = pinnedId === node.concept.id;
              const dimmed = isDimmed(node.concept.id);
              return (
                <motion.button
                  animate={{ opacity: dimmed ? 0.28 : 1, scale: 1 }}
                  aria-label={`${node.concept.title}. ${STATUS_LABEL[node.status]}. ${node.concept.summary[0]}`}
                  aria-pressed={isPinned}
                  className={styles.node}
                  data-active={isActive || undefined}
                  data-dimmed={dimmed || undefined}
                  data-status={node.status}
                  data-tone={node.tone}
                  initial={reduced ? false : { opacity: 0, scale: 0.6 }}
                  key={node.concept.id}
                  onBlur={() => setHoveredId(null)}
                  onClick={() => {
                    setPinnedId((current) =>
                      current === node.concept.id ? null : node.concept.id,
                    );
                    setTraceOn(false);
                  }}
                  onFocus={() => setHoveredId(node.concept.id)}
                  onPointerEnter={() => setHoveredId(node.concept.id)}
                  style={{
                    left: `${(node.x / VIEW_WIDTH) * 100}%`,
                    top: `${(node.y / VIEW_HEIGHT) * 100}%`,
                  }}
                  transition={{
                    duration: reduced ? 0 : 0.5,
                    delay: reduced ? 0 : 0.05 + index * 0.018,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  type="button"
                >
                  <span className={styles.nodeDot} aria-hidden="true" />
                  <span
                    className={styles.nodeLabel}
                    style={{
                      transform: `${node.labelTransform} translate(${node.labelX}px, ${node.labelY}px)`,
                    }}
                  >
                    {node.concept.title}
                  </span>
                </motion.button>
              );
            })}
            </div>
          </div>
        </div>

        <aside
          aria-live="polite"
          className={styles.inspector}
          data-active={activeConcept ? 'true' : undefined}
        >
          {activeConcept && activeNode ? (
            <>
              <div className={styles.inspectorTop}>
                <span
                  className={styles.kindTag}
                  data-tone={activeNode.tone}
                >
                  {activeConcept.kind.replaceAll('-', ' ')}
                </span>
                <button
                  aria-label="Clear selected concept"
                  className={styles.clearButton}
                  onClick={() => {
                    setPinnedId(null);
                    setHoveredId(null);
                    setTraceOn(false);
                  }}
                  type="button"
                >
                  <CloseIcon />
                </button>
              </div>

              <h3 className={styles.inspectorTitle}>{activeConcept.title}</h3>

              <div className={styles.statusRow}>
                <span
                  className={styles.statusDot}
                  data-status={activeNode.status}
                  aria-hidden="true"
                />
                <span>{STATUS_LABEL[activeNode.status]}</span>
                {activeLesson ? (
                  <>
                    <span className={styles.statusRule} aria-hidden="true" />
                    <span>
                      Lesson{' '}
                      {String(activeLesson.lesson.sequence).padStart(2, '0')}
                    </span>
                  </>
                ) : null}
              </div>

              <ol className={styles.summary}>
                {activeConcept.summary.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>

              <div className={styles.tags}>
                {activeConcept.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>

              {traceCount > 0 ? (
                <div className={styles.traceBlock}>
                  <button
                    aria-pressed={traceOn}
                    className={styles.traceButton}
                    onClick={() => setTraceOn((current) => !current)}
                    type="button"
                  >
                    <SparkIcon />
                    {traceOn
                      ? `Tracing ${pluralize(traceCount, 'dependency', 'dependencies')}`
                      : `Trace ${pluralize(traceCount, 'dependency', 'dependencies')}`}
                  </button>
                  {traceOn ? (
                    <p className={styles.traceList}>
                      {tracedConcepts.join(' → ')}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {activeLesson ? (
                <Link
                  className={styles.lessonLink}
                  to={`/java/${activeLesson.lesson.levelId}/${activeLesson.lesson.slug}`}
                >
                  Open “{activeLesson.lesson.title}”
                  <ArrowRightIcon />
                </Link>
              ) : null}
            </>
          ) : (
            <>
              <div className={styles.inspectorTop}>
                <span className={styles.kindTag} data-tone="teal">
                  Level atlas
                </span>
                <MapIcon className={styles.inspectorIcon} />
              </div>
              <h3 className={styles.inspectorTitle}>
                L{level.manifest.index} · {level.manifest.title}
              </h3>
              <p className={styles.levelMetaLine}>
                {pluralize(concepts.length, 'concept')} ·{' '}
                {pluralize(branches.length, 'lesson')} ·{' '}
                {pluralize(edges.length, 'authored link')}
              </p>

              <div className={styles.indexHead}>
                <span>Concept index</span>
                <span>Hover to locate</span>
              </div>
              <ul className={styles.indexList}>
                {branches.flatMap((branch) =>
                  branch.nodes.map((node, nodeIndex) => (
                    <li
                      data-boundary={nodeIndex === 0 || undefined}
                      key={node.concept.id}
                    >
                      <button
                        aria-pressed={pinnedId === node.concept.id}
                        className={styles.indexRow}
                        onBlur={() =>
                          setHoveredId((current) =>
                            current === node.concept.id ? null : current,
                          )
                        }
                        onClick={() => {
                          setPinnedId((current) =>
                            current === node.concept.id
                              ? null
                              : node.concept.id,
                          );
                          setTraceOn(false);
                        }}
                        onFocus={() => setHoveredId(node.concept.id)}
                        onPointerEnter={() => setHoveredId(node.concept.id)}
                        onPointerLeave={() =>
                          setHoveredId((current) =>
                            current === node.concept.id ? null : current,
                          )
                        }
                        type="button"
                      >
                        <span
                          className={styles.indexDot}
                          data-status={node.status}
                          aria-hidden="true"
                        />
                        <span className={styles.indexLesson} aria-hidden="true">
                          {String(
                            branch.lesson.lesson.sequence,
                          ).padStart(2, '0')}
                        </span>
                        <span className={styles.indexTitle}>
                          {node.concept.title}
                        </span>
                      </button>
                    </li>
                  )),
                )}
              </ul>

              <Link className={styles.lessonLink} to="/map">
                Open the full concept map
                <ArrowRightIcon />
              </Link>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
