/**
 * Map layouts are pure geometry. They never read the DOM, and they never
 * mutate authored relations. Dragging a node only changes its saved position,
 * never what the content says about it.
 */
export type MapLayout = 'radial' | 'dependency' | 'cluster';

export interface MapPosition {
  readonly x: number;
  readonly y: number;
}

export interface ConceptLayoutInput {
  readonly id: string;
  readonly title: string;
  readonly levelIndex: number;
  readonly lessonSequence: number;
  readonly tags: readonly string[];
  /** Only authored `depends-on` targets that are present in this map. */
  readonly dependsOn: readonly string[];
}

export interface ClusterField {
  readonly key: string;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly count: number;
}

export interface MapLayoutResult {
  readonly positions: ReadonlyMap<string, MapPosition>;
  readonly clusters: readonly ClusterField[];
}

export const NODE_WIDTH = 216;
export const NODE_HEIGHT = 108;

const NODE_GAP_X = 88;
const NODE_GAP_Y = 46;

function sortInputs(
  items: readonly ConceptLayoutInput[],
): ConceptLayoutInput[] {
  return [...items].sort((a, b) => {
    if (a.levelIndex !== b.levelIndex) {
      return a.levelIndex - b.levelIndex;
    }
    if (a.lessonSequence !== b.lessonSequence) {
      return a.lessonSequence - b.lessonSequence;
    }
    return a.title.localeCompare(b.title);
  });
}

function radial(items: readonly ConceptLayoutInput[]): MapLayoutResult {
  const positions = new Map<string, MapPosition>();
  const sorted = sortInputs(items);
  const byLevel = new Map<number, ConceptLayoutInput[]>();

  for (const item of sorted) {
    const group = byLevel.get(item.levelIndex) ?? [];
    group.push(item);
    byLevel.set(item.levelIndex, group);
  }

  const levels = [...byLevel.keys()].sort((a, b) => a - b);

  levels.forEach((levelIndex, ringIndex) => {
    const group = byLevel.get(levelIndex) ?? [];
    const neededRadius =
      group.length > 0
        ? (group.length * (NODE_WIDTH + 26)) / (2 * Math.PI)
        : 0;
    const radius = Math.max(230 + ringIndex * 250, neededRadius);
    const offset = -Math.PI / 2 + ringIndex * 0.22;

    group.forEach((item, index) => {
      const angle =
        group.length === 1
          ? -Math.PI / 2
          : offset + (index / group.length) * Math.PI * 2;
      positions.set(item.id, {
        x: Math.cos(angle) * radius - NODE_WIDTH / 2,
        y: Math.sin(angle) * radius - NODE_HEIGHT / 2,
      });
    });
  });

  return { positions, clusters: [] };
}

function dependencyDepths(
  items: readonly ConceptLayoutInput[],
): ReadonlyMap<string, number> {
  const byId = new Map(items.map((item) => [item.id, item]));
  const depths = new Map<string, number>();
  const visiting = new Set<string>();

  const depthOf = (id: string): number => {
    const known = depths.get(id);
    if (known !== undefined) {
      return known;
    }
    if (visiting.has(id)) {
      return 0;
    }

    visiting.add(id);
    let depth = 0;
    for (const target of byId.get(id)?.dependsOn ?? []) {
      if (!byId.has(target)) {
        continue;
      }
      depth = Math.max(depth, depthOf(target) + 1);
    }
    visiting.delete(id);
    depths.set(id, depth);
    return depth;
  };

  for (const item of items) {
    depthOf(item.id);
  }
  return depths;
}

function dependency(items: readonly ConceptLayoutInput[]): MapLayoutResult {
  const positions = new Map<string, MapPosition>();
  const depths = dependencyDepths(items);
  const columns = new Map<number, ConceptLayoutInput[]>();

  for (const item of sortInputs(items)) {
    const depth = depths.get(item.id) ?? 0;
    const column = columns.get(depth) ?? [];
    column.push(item);
    columns.set(depth, column);
  }

  const orderedDepths = [...columns.keys()].sort((a, b) => a - b);

  for (const depth of orderedDepths) {
    const column = columns.get(depth) ?? [];
    const totalHeight =
      (column.length - 1) * (NODE_HEIGHT + NODE_GAP_Y);
    const startY = -totalHeight / 2;
    const x = depth * (NODE_WIDTH + NODE_GAP_X);

    column.forEach((item, index) => {
      positions.set(item.id, {
        x,
        y: startY + index * (NODE_HEIGHT + NODE_GAP_Y) - NODE_HEIGHT / 2,
      });
    });
  }

  return { positions, clusters: [] };
}

function tagLabel(tag: string): string {
  const cleaned = tag.replaceAll('-', ' ').replaceAll('_', ' ').trim();
  if (!cleaned) {
    return 'General';
  }
  return cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function cluster(items: readonly ConceptLayoutInput[]): MapLayoutResult {
  const positions = new Map<string, MapPosition>();
  const grouped = new Map<string, ConceptLayoutInput[]>();

  for (const item of sortInputs(items)) {
    const key = (item.tags[0] ?? 'general').toLowerCase();
    const group = grouped.get(key) ?? [];
    group.push(item);
    grouped.set(key, group);
  }

  const drafts = [...grouped.entries()]
    .map(([key, group]) => {
      const sorted = sortInputs(group);
      const ring =
        sorted.length <= 1
          ? 0
          : Math.max(
              126,
              (sorted.length * (NODE_WIDTH + 42)) / (2 * Math.PI),
            );
      const width = Math.max(
        300,
        2 * (ring + NODE_WIDTH / 2) + 108,
      );
      const height = Math.max(
        236,
        2 * (ring + NODE_HEIGHT / 2) + 128,
      );

      return {
        key,
        label: tagLabel(key),
        items: sorted,
        ring,
        width,
        height,
      };
    })
    .sort((a, b) => {
      if (b.items.length !== a.items.length) {
        return b.items.length - a.items.length;
      }
      return a.key.localeCompare(b.key);
    });

  const columns = drafts.length <= 2 ? Math.max(1, drafts.length) : Math.ceil(Math.sqrt(drafts.length));
  const rows = Math.max(1, Math.ceil(drafts.length / columns));
  const cellWidth = Math.max(...drafts.map((draft) => draft.width)) + 88;
  const cellHeight = Math.max(...drafts.map((draft) => draft.height)) + 88;
  const clusters: ClusterField[] = [];

  drafts.forEach((draft, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const centerX = (column - (columns - 1) / 2) * cellWidth;
    const centerY = (row - (rows - 1) / 2) * cellHeight;
    const fieldX = centerX - draft.width / 2;
    const fieldY = centerY - draft.height / 2;

    clusters.push({
      key: draft.key,
      label: draft.label,
      x: fieldX,
      y: fieldY,
      width: draft.width,
      height: draft.height,
      count: draft.items.length,
    });

    draft.items.forEach((item, itemIndex) => {
      const angle =
        draft.items.length === 1
          ? -Math.PI / 2
          : -Math.PI / 2 +
            (itemIndex / draft.items.length) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * draft.ring;
      const y = centerY + Math.sin(angle) * draft.ring + 14;

      positions.set(item.id, {
        x: x - NODE_WIDTH / 2,
        y: y - NODE_HEIGHT / 2,
      });
    });
  });

  return { positions, clusters };
}

export function computeLayout(
  layout: MapLayout,
  items: readonly ConceptLayoutInput[],
): MapLayoutResult {
  if (items.length === 0) {
    return { positions: new Map(), clusters: [] };
  }
  if (layout === 'dependency') {
    return dependency(items);
  }
  if (layout === 'cluster') {
    return cluster(items);
  }
  return radial(items);
}
