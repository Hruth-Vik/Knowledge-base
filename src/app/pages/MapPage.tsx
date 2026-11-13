import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type NodeProps,
  type OnNodeDrag,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { catalog } from '@/lib/content/catalog.js';
import type { LevelManifest } from '@/lib/schema/curriculum.js';
import type { RelationshipType } from '@/lib/schema/concept.js';
import { deriveLessonStatus } from '@/lib/state/derive.js';
import type { MapLayout } from '@/lib/state/schema.js';
import { pluralize } from '../format.js';
import {
  computeLayout,
  type ClusterField,
  type ConceptLayoutInput,
  NODE_WIDTH,
} from '../map/layouts.js';
import {
  ConceptNode,
  MapFocusContext,
  type ConceptFlowNode,
  type ConceptStatus,
} from '../map/ConceptNode.js';
import { useAppStore } from '../store.js';
import { toneForLevel } from '../progress.js';
import { ArrowLink } from '../ui/ArrowLink.js';
import { Page } from '../ui/Page.js';
import { PageHeader } from '../ui/PageHeader.js';
import {
  ArrowRightIcon,
  CloseIcon,
  CompassIcon,
  FlowIcon,
  ListIcon,
  MapIcon,
  NotesIcon,
  SearchIcon,
  SparkIcon,
} from '../ui/icons.js';
import styles from './MapPage.module.css';

interface ConceptView {
  readonly concept: ReturnType<typeof catalog.concepts.all>[number];
  readonly status: ConceptStatus;
  readonly noteCount: number;
  readonly dependsCount: number;
  readonly unlocksCount: number;
  readonly searchText: string;
  readonly tone: string;
  readonly levelNumber: string;
  readonly levelTitle: string;
  readonly lessonTitle: string;
  readonly lessonRoute: string;
}

interface ClusterNodeData extends Record<string, unknown> {
  readonly label: string;
  readonly count: number;
}

type ClusterFlowNode = Node<ClusterNodeData, 'cluster'>;

type MapNode = ConceptFlowNode | ClusterFlowNode;

const LAYOUTS: readonly {
  readonly value: MapLayout;
  readonly label: string;
  readonly hint: string;
}[] = [
  { value: 'radial', label: 'Rings', hint: 'orbit by level' },
  { value: 'dependency', label: 'Flow', hint: 'left to right' },
  { value: 'cluster', label: 'Fields', hint: 'group by topic' },
];

const STATUS_META: Record<
  ConceptStatus,
  { readonly label: string; readonly blurb: string }
> = {
  unseen: { label: 'Unseen', blurb: 'The lesson has not been opened.' },
  learned: { label: 'Met', blurb: 'The lesson has been started or marked done.' },
  decaying: { label: 'Fading', blurb: 'A recall card needs another pass.' },
  mastered: { label: 'Mastered', blurb: 'Done, recalled, and exercised.' },
};

const RELATION_ORDER: readonly RelationshipType[] = [
  'depends-on',
  'causes',
  'contrasts-with',
  'implemented-by',
  'commonly-confused-with',
];

const RELATION_LABEL: Record<RelationshipType, string> = {
  'depends-on': 'needs first',
  causes: 'causes',
  'contrasts-with': 'contrasts with',
  'implemented-by': 'implemented by',
  'commonly-confused-with': 'often confused with',
};

const RELATION_COLOR: Record<RelationshipType, string> = {
  'depends-on': 'var(--color-ink-secondary)',
  causes: 'var(--tone-rust)',
  'contrasts-with': 'var(--tone-plum)',
  'implemented-by': 'var(--tone-teal)',
  'commonly-confused-with': 'var(--tone-oxide)',
};

const RELATION_DASH: Partial<Record<RelationshipType, string>> = {
  'contrasts-with': '7 5',
  'implemented-by': '2 5',
  'commonly-confused-with': '7 5',
};

const ALL_CONCEPTS = catalog.concepts.all();

const LEVEL_BY_ID = new Map<string, LevelManifest>();
for (const language of catalog.languages) {
  for (const level of language.levels) {
    LEVEL_BY_ID.set(level.manifest.id, level.manifest);
  }
}

const LESSON_BY_ID = new Map(
  catalog.lessons.map((record) => [record.lesson.id, record.lesson]),
);

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function ClusterFieldNode({ data }: NodeProps<ClusterFlowNode>) {
  return (
    <div className={styles.clusterField}>
      <span className={styles.clusterLabel}>{data.label}</span>
      <span className={styles.clusterCount}>
        {pluralize(data.count, 'concept')}
      </span>
    </div>
  );
}

const nodeTypes = {
  concept: ConceptNode,
  cluster: ClusterFieldNode,
};

function relationMeaning(type: RelationshipType): string {
  return RELATION_LABEL[type];
}

function conceptStatus(
  conceptId: string,
  lessonStatus: ReturnType<typeof deriveLessonStatus>,
  weakConceptIds: ReadonlySet<string>,
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

function MapPageShell() {
  const data = useAppStore((state) => state.data);
  const saveMapPosition = useAppStore((state) => state.saveMapPosition);
  const clearMapLayout = useAppStore((state) => state.clearMapLayout);
  const { fitView } = useReactFlow();

  const [layout, setLayout] = useState<MapLayout>('radial');
  const [view, setView] = useState<'map' | 'list'>('map');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tracing, setTracing] = useState(false);

  const conceptViews = useMemo<ConceptView[]>(() => {
    const weakConceptIds = new Set<string>();
    for (const card of Object.values(data.review.cards)) {
      if (
        card.phase === 'relearning' ||
        (card.lastRating !== null && card.lastRating <= 2)
      ) {
        for (const conceptId of card.conceptIds) {
          weakConceptIds.add(conceptId);
        }
      }
    }

    const noteCounts = new Map<string, number>();
    for (const note of Object.values(data.notes)) {
      for (const conceptId of note.conceptIds) {
        noteCounts.set(conceptId, (noteCounts.get(conceptId) ?? 0) + 1);
      }
    }

    const unlockCounts = new Map<string, number>();
    for (const concept of ALL_CONCEPTS) {
      for (const relation of concept.relations) {
        if (relation.type !== 'depends-on') {
          continue;
        }
        unlockCounts.set(
          relation.target,
          (unlockCounts.get(relation.target) ?? 0) + 1,
        );
      }
    }

    return ALL_CONCEPTS.map((concept) => {
      const level = LEVEL_BY_ID.get(concept.owner.levelId);
      const lesson = LESSON_BY_ID.get(concept.owner.lessonId);
      const lessonStatus = deriveLessonStatus(
        data.lessons[concept.owner.lessonId],
      );
      const dependsCount = concept.relations.filter(
        (relation) => relation.type === 'depends-on',
      ).length;

      return {
        concept,
        status: conceptStatus(concept.id, lessonStatus, weakConceptIds),
        noteCount: noteCounts.get(concept.id) ?? 0,
        dependsCount,
        unlocksCount: unlockCounts.get(concept.id) ?? 0,
        searchText: [
          concept.title,
          concept.kind.replaceAll('-', ' '),
          concept.summary.join(' '),
          concept.aliases.join(' '),
          concept.tags.join(' '),
          level?.title ?? '',
          lesson?.title ?? '',
        ]
          .join(' ')
          .toLowerCase(),
        tone: toneForLevel(concept.owner.levelIndex),
        levelNumber: String(level?.index ?? concept.owner.levelIndex).padStart(
          2,
          '0',
        ),
        levelTitle: level?.title ?? concept.owner.levelId,
        lessonTitle: lesson?.title ?? 'Unknown lesson',
        lessonRoute: lesson
          ? `/java/${concept.owner.levelId}/${lesson.slug}`
          : `/java/${concept.owner.levelId}`,
      };
    });
  }, [data.lessons, data.notes, data.review.cards]);

  const conceptViewById = useMemo(
    () =>
      new Map(
        conceptViews.map((viewItem) => [viewItem.concept.id, viewItem]),
      ),
    [conceptViews],
  );

  const layoutInputs = useMemo<ConceptLayoutInput[]>(
    () =>
      conceptViews.map(({ concept }) => ({
        id: concept.id,
        title: concept.title,
        levelIndex: concept.owner.levelIndex,
        lessonSequence: concept.owner.lessonSequence,
        tags: concept.tags,
        dependsOn: concept.relations
          .filter((relation) => relation.type === 'depends-on')
          .map((relation) => relation.target),
      })),
    [conceptViews],
  );

  const normalizedQuery = query.trim().toLowerCase();
  const matchedViews = useMemo(
    () =>
      normalizedQuery
        ? conceptViews.filter((viewItem) =>
            viewItem.searchText.includes(normalizedQuery),
          )
        : conceptViews,
    [conceptViews, normalizedQuery],
  );
  const matchedIds = useMemo(
    () => new Set(matchedViews.map((viewItem) => viewItem.concept.id)),
    [matchedViews],
  );

  const traceIds = useMemo(() => {
    if (!tracing || !selectedId) {
      return new Set<string>();
    }
    const ids = new Set<string>([selectedId]);
    for (const dependency of catalog.concepts.traceDependencies(selectedId)) {
      ids.add(dependency.id);
    }
    return ids;
  }, [selectedId, tracing]);

  const focus = useMemo(
    () => ({
      query: normalizedQuery,
      selectedId,
      traceIds,
      tracing,
    }),
    [normalizedQuery, selectedId, traceIds, tracing],
  );

  const selectedView = selectedId ? conceptViewById.get(selectedId) : undefined;
  const savedPositions = data.map.positions[layout];
  const savedCount = Object.keys(savedPositions).length;
  const traceCount = Math.max(0, traceIds.size - 1);

  const computedNodes = useMemo<MapNode[]>(() => {
    if (conceptViews.length === 0) {
      return [];
    }

    const result = computeLayout(layout, layoutInputs);
    const clusterNodes: MapNode[] = result.clusters.map(
      (cluster: ClusterField) => ({
        id: `cluster:${cluster.key}`,
        type: 'cluster',
        position: { x: cluster.x, y: cluster.y },
        data: { label: cluster.label, count: cluster.count },
        style: { width: cluster.width, height: cluster.height },
        className: styles.clusterNode,
        draggable: false,
        selectable: false,
        focusable: false,
        connectable: false,
        deletable: false,
        zIndex: 0,
        ariaLabel: `${cluster.label} field, ${pluralize(cluster.count, 'concept')}`,
      }),
    );

    const nodes: MapNode[] = conceptViews.map((viewItem) => {
      const basePosition = result.positions.get(viewItem.concept.id) ?? {
        x: 0,
        y: 0,
      };
      const savedPosition = savedPositions[viewItem.concept.id];
      return {
        id: viewItem.concept.id,
        type: 'concept',
        position: savedPosition ?? basePosition,
        data: {
          conceptId: viewItem.concept.id,
          title: viewItem.concept.title,
          levelNumber: viewItem.levelNumber,
          levelTitle: viewItem.levelTitle,
          kind: viewItem.concept.kind,
          tone: viewItem.tone,
          status: viewItem.status,
          dependsCount: viewItem.dependsCount,
          unlocksCount: viewItem.unlocksCount,
          noteCount: viewItem.noteCount,
          searchText: viewItem.searchText,
        },
        style: { width: NODE_WIDTH },
        zIndex: 2,
        ariaLabel: `${viewItem.concept.title}, ${STATUS_META[viewItem.status].label}, level ${viewItem.levelNumber}`,
      };
    });

    return [...clusterNodes, ...nodes];
  }, [conceptViews, layout, layoutInputs, savedPositions]);

  const [nodes, setNodes, onNodesChange] = useNodesState<MapNode>(computedNodes);

  useEffect(() => {
    setNodes(computedNodes);
  }, [computedNodes, setNodes]);

  const edges = useMemo<Edge[]>(() => {
    const edgeList: Edge[] = [];

    for (const viewItem of conceptViews) {
      const source = viewItem.concept.id;
      for (const relation of viewItem.concept.relations) {
        const targetView = conceptViewById.get(relation.target);
        if (!targetView) {
          continue;
        }
        const target = relation.target;
        const inTrace =
          tracing &&
          relation.type === 'depends-on' &&
          traceIds.has(source) &&
          traceIds.has(target);
        const bothMatched =
          normalizedQuery.length > 0 &&
          matchedIds.has(source) &&
          matchedIds.has(target);
        const connected =
          selectedId !== null &&
          (source === selectedId || target === selectedId);

        let opacity = relation.type === 'depends-on' ? 0.72 : 0.46;
        let width = relation.type === 'depends-on' ? 1.6 : 1.2;
        let active = true;

        if (tracing) {
          active = inTrace;
          opacity = inTrace ? 1 : 0.05;
          width = inTrace ? 2.3 : 1.1;
        } else if (normalizedQuery.length > 0) {
          active = bothMatched;
          opacity = bothMatched ? 0.92 : 0.05;
          width = bothMatched ? 2 : 1.1;
        } else if (selectedId !== null) {
          active = connected;
          opacity = connected ? 0.95 : 0.14;
          width = connected ? 2.15 : 1.1;
        }

        edgeList.push({
          id: `${source}->${target}:${relation.type}`,
          source,
          target,
          type: 'smoothstep',
          animated: tracing && inTrace,
          style: {
            stroke: RELATION_COLOR[relation.type],
            strokeWidth: width,
            strokeDasharray: RELATION_DASH[relation.type],
            opacity,
          },
          markerEnd:
            relation.type === 'depends-on' && active
              ? {
                  type: MarkerType.ArrowClosed,
                  color: RELATION_COLOR['depends-on'],
                  width: 14,
                  height: 14,
                }
              : undefined,
          ariaLabel: `${viewItem.concept.title} ${relationMeaning(relation.type)} ${targetView.concept.title}`,
        });
      }
    }

    return edgeList;
  }, [
    conceptViews,
    conceptViewById,
    matchedIds,
    normalizedQuery,
    selectedId,
    traceIds,
    tracing,
  ]);

  useEffect(() => {
    if (view !== 'map' || conceptViews.length === 0) {
      return;
    }
    const narrow = window.matchMedia('(max-width: 720px)').matches;
    const sheetOpen = selectedId !== null && !narrow;
    const timer = window.setTimeout(
      () => {
        void fitView({
          duration: prefersReducedMotion() ? 0 : 520,
          padding: sheetOpen
            ? {
                top: '56px',
                right: '420px',
                bottom: '56px',
                left: '56px',
              }
            : 0.18,
          minZoom: narrow ? 0.78 : 0.22,
        });
      },
      sheetOpen ? 140 : 80,
    );
    return () => window.clearTimeout(timer);
  }, [conceptViews.length, fitView, layout, selectedId, view]);

  const chooseConcept = useCallback((conceptId: string) => {
    setSelectedId(conceptId);
  }, []);

  const closeSheet = useCallback(() => {
    setSelectedId(null);
    setTracing(false);
  }, []);

  const focusConcept = useCallback(
    (conceptId: string) => {
      if (view !== 'map') {
        return;
      }
      void fitView({
        nodes: [{ id: conceptId }],
        duration: prefersReducedMotion() ? 0 : 480,
        padding: 1.5,
        maxZoom: 1.35,
      });
    },
    [fitView, view],
  );

  const handleNodeClick: NodeMouseHandler<MapNode> = useCallback(
    (_event, node) => {
      if (node.type !== 'concept') {
        return;
      }
      chooseConcept(node.id);
    },
    [chooseConcept],
  );

  const handleNodeDragStop: OnNodeDrag<MapNode> = useCallback(
    (_event, node) => {
      if (node.type !== 'concept') {
        return;
      }
      saveMapPosition(layout, node.id, node.position);
    },
    [layout, saveMapPosition],
  );

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'Escape') {
      setQuery('');
      event.currentTarget.blur();
      return;
    }
    if (event.key === 'Enter') {
      const first = matchedViews[0];
      if (first) {
        chooseConcept(first.concept.id);
        focusConcept(first.concept.id);
      }
    }
  };

  const handleResetPositions = () => {
    clearMapLayout(layout);
    triggerFit();
  };

  function triggerFit() {
    window.setTimeout(() => {
      if (view !== 'map') {
        return;
      }
      void fitView({
        duration: prefersReducedMotion() ? 0 : 520,
        padding: 0.18,
      });
    }, 120);
  }

  const relationLegend = useMemo(() => {
    const counts = new Map<RelationshipType, number>();
    for (const viewItem of conceptViews) {
      for (const relation of viewItem.concept.relations) {
        counts.set(relation.type, (counts.get(relation.type) ?? 0) + 1);
      }
    }
    return RELATION_ORDER.map((type) => ({
      type,
      count: counts.get(type) ?? 0,
    })).filter((item) => item.count > 0);
  }, [conceptViews]);

  const relationCount = relationLegend.reduce(
    (total, item) => total + item.count,
    0,
  );
  const masteredCount = conceptViews.filter(
    (viewItem) => viewItem.status === 'mastered',
  ).length;
  const decayingCount = conceptViews.filter(
    (viewItem) => viewItem.status === 'decaying',
  ).length;
  const metCount = conceptViews.filter(
    (viewItem) => viewItem.status !== 'unseen',
  ).length;

  const listGroups = useMemo(() => {
    const groups = new Map<number, ConceptView[]>();
    for (const viewItem of matchedViews) {
      const group = groups.get(viewItem.concept.owner.levelIndex) ?? [];
      group.push(viewItem);
      groups.set(viewItem.concept.owner.levelIndex, group);
    }
    return [...groups.entries()]
      .sort(([left], [right]) => left - right)
      .map(([levelIndex, views]) => ({
        levelIndex,
        levelNumber:
          views[0]?.levelNumber ?? String(levelIndex).padStart(2, '0'),
        levelTitle: views[0]?.levelTitle ?? '',
        views,
      }));
  }, [matchedViews]);

  const openNotes = () => {
    window.dispatchEvent(new Event('foundation:open-notes'));
  };

  const layoutMeta =
    LAYOUTS.find((item) => item.value === layout) ?? LAYOUTS[0];

  const sheet = selectedView ? (
    <aside
      aria-labelledby="map-sheet-title"
      className={[
        styles.sheet,
        view === 'list' ? styles.sheetFloating : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-tone={selectedView.tone}
    >
      <div className={styles.sheetHead}>
        <span className={styles.sheetLevel}>
          L{selectedView.levelNumber} · {selectedView.levelTitle}
        </span>
        <button
          aria-label="Close concept details"
          className={styles.sheetClose}
          onClick={closeSheet}
          type="button"
        >
          <CloseIcon />
        </button>
      </div>

      <h2 className={styles.sheetTitle} id="map-sheet-title">
        {selectedView.concept.title}
      </h2>

      <div className={styles.sheetMeta}>
        <span
          className={styles.statusChip}
          data-status={selectedView.status}
        >
          {STATUS_META[selectedView.status].label}
        </span>
        <span className={styles.sheetKind}>
          {selectedView.concept.kind.replaceAll('-', ' ')}
        </span>
        <span className={styles.sheetNotes}>
          <NotesIcon />
          {pluralize(selectedView.noteCount, 'note')}
        </span>
      </div>

      <p className={styles.sheetStatusNote}>
        {STATUS_META[selectedView.status].blurb}
      </p>

      <ol className={styles.summaryList}>
        {selectedView.concept.summary.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>

      <div className={styles.sheetActions}>
        <Link className={styles.primaryLink} to={selectedView.lessonRoute}>
          {selectedView.status === 'unseen'
            ? 'Start the lesson'
            : 'Revisit the lesson'}
          <ArrowRightIcon />
        </Link>
        <button
          aria-pressed={tracing}
          className={styles.sheetButton}
          onClick={() => setTracing((current) => !current)}
          type="button"
        >
          <CompassIcon />
          {tracing ? 'Stop tracing' : 'Trace prerequisites'}
        </button>
      </div>

      <div className={styles.sheetSection}>
        <h3>Prerequisite trail</h3>
        {selectedView.dependsCount > 0 ? (
          <div className={styles.relationList}>
            {selectedView.concept.relations
              .filter((relation) => relation.type === 'depends-on')
              .map((relation) => {
                const target = conceptViewById.get(relation.target);
                return target ? (
                  <button
                    className={styles.relationButton}
                    key={relation.target}
                    onClick={() => chooseConcept(target.concept.id)}
                    type="button"
                  >
                    <span>{target.concept.title}</span>
                    <span className={styles.relationDirection}>needs</span>
                  </button>
                ) : null;
              })}
          </div>
        ) : (
          <p className={styles.sheetEmpty}>
            Nothing below it. This is a root concept.
          </p>
        )}
      </div>

      <div className={styles.sheetSection}>
        <h3>Unlocks</h3>
        {selectedView.unlocksCount > 0 ? (
          <div className={styles.relationList}>
            {conceptViews
              .filter((viewItem) =>
                viewItem.concept.relations.some(
                  (relation) =>
                    relation.type === 'depends-on' &&
                    relation.target === selectedView.concept.id,
                ),
              )
              .map((viewItem) => (
                <button
                  className={styles.relationButton}
                  key={viewItem.concept.id}
                  onClick={() => chooseConcept(viewItem.concept.id)}
                  type="button"
                >
                  <span>{viewItem.concept.title}</span>
                  <span className={styles.relationDirection}>after this</span>
                </button>
              ))}
          </div>
        ) : (
          <p className={styles.sheetEmpty}>
            No other concept declares it as a prerequisite yet.
          </p>
        )}
      </div>

      {selectedView.concept.relations.some(
        (relation) => relation.type !== 'depends-on',
      ) ? (
        <div className={styles.sheetSection}>
          <h3>Other links</h3>
          <div className={styles.relationList}>
            {selectedView.concept.relations
              .filter((relation) => relation.type !== 'depends-on')
              .map((relation) => {
                const target = conceptViewById.get(relation.target);
                return target ? (
                  <button
                    className={styles.relationButton}
                    data-relation={relation.type}
                    key={`${relation.type}:${relation.target}`}
                    onClick={() => chooseConcept(target.concept.id)}
                    type="button"
                  >
                    <span>{target.concept.title}</span>
                    <span className={styles.relationDirection}>
                      {relationMeaning(relation.type)}
                    </span>
                  </button>
                ) : null;
              })}
          </div>
        </div>
      ) : null}

      <div className={styles.sheetNotesBox}>
        <NotesIcon />
        <p>
          {selectedView.noteCount > 0
            ? `${pluralize(selectedView.noteCount, 'note')} linked to this concept in your notebook.`
            : 'No notes are linked to this concept yet. A question counts.'}
        </p>
        <button onClick={openNotes} type="button">
          Open notebook
        </button>
      </div>
    </aside>
  ) : null;

  return (
    <Page>
      <PageHeader
        aside={
          <>
            <span className={styles.asideLabel}>Concepts met</span>
            <span className={styles.asideBig}>
              {metCount}
              <small>/{conceptViews.length}</small>
            </span>
            <span>
              {pluralize(masteredCount, 'mastered')} · {decayingCount} fading
            </span>
            <br />
            <span>
              {pluralize(relationCount, 'relation')} from the registry
            </span>
          </>
        }
        deck="Every concept the lessons actually teach, drawn from the same registry that powers notes and search. Meet the shape of the language, then trace what a node stands on."
        kicker="Notebook / Map"
        title="Knowledge map"
      />

      <section aria-label="Map controls" className={styles.toolPanel}>
        <div className={styles.toolTop}>
          <div aria-label="Map layout" className={styles.layoutGroup} role="group">
            {LAYOUTS.map((item) => (
              <button
                aria-pressed={layout === item.value}
                className={styles.layoutButton}
                key={item.value}
                onClick={() => setLayout(item.value)}
                type="button"
              >
                <span>{item.label}</span>
                <small>{item.hint}</small>
              </button>
            ))}
          </div>

          <div className={styles.toolRight}>
            <label className={styles.searchBox}>
              <SearchIcon />
              <input
                aria-label="Search concepts"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Find a concept…"
                type="search"
                value={query}
              />
              {query ? (
                <button
                  aria-label="Clear concept search"
                  className={styles.searchClear}
                  onClick={() => setQuery('')}
                  type="button"
                >
                  <CloseIcon />
                </button>
              ) : null}
            </label>

            <div aria-label="View mode" className={styles.viewGroup} role="group">
              <button
                aria-pressed={view === 'map'}
                onClick={() => setView('map')}
                type="button"
              >
                <FlowIcon /> Canvas
              </button>
              <button
                aria-pressed={view === 'list'}
                onClick={() => setView('list')}
                type="button"
              >
                <ListIcon /> List
              </button>
            </div>
          </div>
        </div>

        <div className={styles.toolBottom}>
          <p aria-live="polite" className={styles.resultLine}>
            {normalizedQuery
              ? `${matchedViews.length} of ${pluralize(conceptViews.length, 'concept')} match “${query.trim()}”.`
              : `Showing all ${pluralize(conceptViews.length, 'concept')} · ${pluralize(relationCount, 'relation')}`}
          </p>

          <div className={styles.toolActions}>
            <button
              aria-pressed={tracing}
              className={[styles.toolButton, tracing ? styles.toolButtonActive : '']
                .filter(Boolean)
                .join(' ')}
              disabled={!selectedView}
              onClick={() => setTracing((current) => !current)}
              title={
                selectedView
                  ? 'Follow depends-on edges only'
                  : 'Select a concept first'
              }
              type="button"
            >
              <CompassIcon />
              {tracing ? `Tracing ${pluralize(traceCount, 'link')}` : 'Trace'}
            </button>
            {savedCount > 0 ? (
              <button
                className={styles.toolButton}
                onClick={handleResetPositions}
                type="button"
              >
                Reset drags
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {tracing && selectedView ? (
        <div className={styles.traceBar} role="status">
          <CompassIcon />
          <p>
            Tracing {pluralize(traceCount, 'prerequisite')} behind{' '}
            <strong>{selectedView.concept.title}</strong>. Only depends-on
            edges are part of the path.
          </p>
          <button onClick={() => setTracing(false)} type="button">
            Stop tracing
          </button>
        </div>
      ) : null}

      <div
        className={styles.workspace}
        data-sheet={selectedView ? 'true' : 'false'}
        data-view={view}
      >
        {conceptViews.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden="true">
              <MapIcon />
            </span>
            <p className={styles.emptyKicker}>Empty registry</p>
            <h2 className={styles.emptyTitle}>
              No concept has been published yet.
            </h2>
            <p className={styles.emptyText}>
              Nodes appear here only after a lesson declares them. The map never
              invents filler concepts to look busy.
            </p>
            <ArrowLink to="/java">Open the Java roadmap</ArrowLink>
          </div>
        ) : view === 'map' ? (
          <div className={styles.canvas}>
            <MapFocusContext.Provider value={focus}>
              <ReactFlow
                aria-label="Concept map. Drag nodes to rearrange them."
                className={styles.flow}
                edges={edges}
                edgesFocusable={false}
                fitView
                fitViewOptions={{ padding: 0.18 }}
                maxZoom={1.6}
                minZoom={0.22}
                nodeTypes={nodeTypes}
                nodes={nodes}
                nodesConnectable={false}
                onNodeClick={handleNodeClick}
                onNodeDragStop={handleNodeDragStop}
                onNodesChange={onNodesChange}
                onPaneClick={closeSheet}
                proOptions={{ hideAttribution: true }}
              >
                <Background
                  color="var(--color-rule-strong)"
                  gap={24}
                  size={1.15}
                  variant={BackgroundVariant.Dots}
                />
                <Controls position="bottom-left" showInteractive={false} />
                {conceptViews.length > 5 ? (
                  <MiniMap
                    nodeColor="var(--color-rule-strong)"
                    pannable
                    position="top-right"
                    zoomable
                  />
                ) : null}
              </ReactFlow>
            </MapFocusContext.Provider>

            <div aria-hidden="true" className={styles.canvasBadge}>
              <span>{layoutMeta?.label ?? 'Rings'}</span>
              <small>{layoutMeta?.hint ?? 'orbit by level'}</small>
            </div>

            {normalizedQuery && matchedViews.length === 0 ? (
              <div className={styles.noMatches}>
                <MapIcon />
                <p>No concept matches “{query.trim()}”.</p>
                <button onClick={() => setQuery('')} type="button">
                  Clear search
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className={styles.listView}>
            {matchedViews.length === 0 ? (
              <div className={styles.listEmpty}>
                <SearchIcon />
                <p>No concept matches “{query.trim()}”.</p>
                <button onClick={() => setQuery('')} type="button">
                  Clear search
                </button>
              </div>
            ) : (
              listGroups.map((group) => (
                <section className={styles.listGroup} key={group.levelIndex}>
                  <header className={styles.listGroupHead}>
                    <span className={styles.listGroupNumber}>
                      L{group.levelNumber}
                    </span>
                    <h2>{group.levelTitle}</h2>
                    <span>{pluralize(group.views.length, 'concept')}</span>
                  </header>
                  <ul className={styles.conceptList}>
                    {group.views.map((viewItem) => (
                      <li key={viewItem.concept.id}>
                        <button
                          aria-current={
                            selectedId === viewItem.concept.id
                              ? 'true'
                              : undefined
                          }
                          className={styles.conceptRow}
                          data-status={viewItem.status}
                          data-tone={viewItem.tone}
                          onClick={() => chooseConcept(viewItem.concept.id)}
                          type="button"
                        >
                          <span className={styles.rowMain}>
                            <span className={styles.rowTop}>
                              <span className={styles.rowTitle}>
                                {viewItem.concept.title}
                              </span>
                              <span
                                className={styles.statusChip}
                                data-status={viewItem.status}
                              >
                                {STATUS_META[viewItem.status].label}
                              </span>
                            </span>
                            <span className={styles.rowSummary}>
                              {viewItem.concept.summary[0]}
                            </span>
                            <span className={styles.rowMeta}>
                              <span>{viewItem.concept.kind.replaceAll('-', ' ')}</span>
                              <span>{viewItem.lessonTitle}</span>
                              {viewItem.dependsCount > 0 ? (
                                <span>{viewItem.dependsCount} in</span>
                              ) : (
                                <span>root</span>
                              )}
                              {viewItem.unlocksCount > 0 ? (
                                <span>{viewItem.unlocksCount} out</span>
                              ) : null}
                              {viewItem.noteCount > 0 ? (
                                <span>
                                  <NotesIcon />
                                  {viewItem.noteCount}
                                </span>
                              ) : null}
                            </span>
                          </span>
                          <span className={styles.rowArrow} aria-hidden="true">
                            <ArrowRightIcon />
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            )}
          </div>
        )}

        {sheet}
      </div>

      <div className={styles.legend}>
        <section aria-label="Concept states" className={styles.legendBlock}>
          <h2>State</h2>
          <ul className={styles.legendList}>
            {(Object.keys(STATUS_META) as ConceptStatus[]).map((status) => (
              <li data-status={status} key={status}>
                <span className={styles.statusDot} aria-hidden="true" />
                <span>{STATUS_META[status].label}</span>
                <small>{STATUS_META[status].blurb}</small>
              </li>
            ))}
          </ul>
        </section>

        {relationLegend.length > 0 ? (
          <section aria-label="Relationship types" className={styles.legendBlock}>
            <h2>Edges</h2>
            <ul className={styles.legendList}>
              {relationLegend.map((item) => (
                <li key={item.type}>
                  <span
                    aria-hidden="true"
                    className={styles.relationSwatch}
                    data-relation={item.type}
                  />
                  <span>{RELATION_LABEL[item.type]}</span>
                  <small>{pluralize(item.count, 'edge')}</small>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className={styles.legendNote}>
          <SparkIcon />
          Positions, notes, and progress stay in this browser. Drag a node to
          arrange a layout; reset it when the drawing stops helping.
        </p>
      </div>
    </Page>
  );
}

export function MapPage() {
  return (
    <ReactFlowProvider>
      <MapPageShell />
    </ReactFlowProvider>
  );
}
