import { createContext, useContext } from 'react';
import {
  Handle,
  Position,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import { NotesIcon } from '../ui/icons.js';
import styles from './ConceptNode.module.css';

export type ConceptStatus = 'unseen' | 'learned' | 'decaying' | 'mastered';

export interface ConceptNodeData extends Record<string, unknown> {
  readonly conceptId: string;
  readonly title: string;
  readonly levelNumber: string;
  readonly levelTitle: string;
  readonly kind: string;
  readonly tone: string;
  readonly status: ConceptStatus;
  readonly dependsCount: number;
  readonly unlocksCount: number;
  readonly noteCount: number;
  readonly searchText: string;
}

export type ConceptFlowNode = Node<ConceptNodeData, 'concept'>;

export interface MapFocusState {
  readonly query: string;
  readonly selectedId: string | null;
  readonly traceIds: ReadonlySet<string>;
  readonly tracing: boolean;
}

export const MapFocusContext = createContext<MapFocusState>({
  query: '',
  selectedId: null,
  traceIds: new Set(),
  tracing: false,
});

const STATUS_LABEL: Record<ConceptStatus, string> = {
  unseen: 'Unseen',
  learned: 'Met',
  decaying: 'Fading',
  mastered: 'Mastered',
};

export function ConceptNode({ data }: NodeProps<ConceptFlowNode>) {
  const focus = useContext(MapFocusContext);
  const query = focus.query.trim().toLowerCase();
  const matched =
    query.length > 0 && data.searchText.toLowerCase().includes(query);
  const dimmed =
    (query.length > 0 && !matched) ||
    (focus.tracing && !focus.traceIds.has(data.conceptId));
  const selected = focus.selectedId === data.conceptId;

  return (
    <article
      className={styles.node}
      data-tone={data.tone}
      data-status={data.status}
      data-dimmed={dimmed}
      data-matched={matched}
      data-selected={selected}
      title={`${data.title} · ${data.levelTitle}`}
    >
      <Handle
        className={styles.handle}
        type="target"
        position={Position.Left}
      />

      <header className={styles.top}>
        <span className={styles.level}>L{data.levelNumber}</span>
        <span className={styles.kind}>{data.kind.replaceAll('-', ' ')}</span>
        {data.noteCount > 0 ? (
          <span className={styles.notes} title={`${data.noteCount} linked notes`}>
            <NotesIcon />
            {data.noteCount}
          </span>
        ) : null}
      </header>

      <h3 className={styles.title}>{data.title}</h3>

      <footer className={styles.footer}>
        <span className={styles.status}>
          <span className={styles.dot} aria-hidden="true" />
          {STATUS_LABEL[data.status]}
        </span>
        <span className={styles.links}>
          {data.dependsCount > 0 ? `${data.dependsCount} up` : 'root'}
          {data.unlocksCount > 0 ? ` · ${data.unlocksCount} out` : ''}
        </span>
      </footer>

      <span className={styles.selectedMark} aria-hidden="true" />

      <Handle
        className={styles.handle}
        type="source"
        position={Position.Right}
      />
    </article>
  );
}
