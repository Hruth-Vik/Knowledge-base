import { useId } from 'react';
import type { MentalModelFigure } from '@/lib/schema/lesson.js';
import styles from './Diagram.module.css';

interface DiagramProps {
  readonly figure: MentalModelFigure;
  readonly label?: string;
}

interface Point {
  readonly x: number;
  readonly y: number;
}

type DiagramNode = MentalModelFigure['nodes'][number];

const NODE_TONE_CLASS: Record<DiagramNode['tone'], string | undefined> = {
  neutral: styles.toneNeutral,
  accent: styles.toneAccent,
  muted: styles.toneMuted,
  correct: styles.toneCorrect,
  warning: styles.toneWarning,
};

function centerOf(node: DiagramNode): Point {
  return {
    x: node.x + node.width / 2,
    y: node.y + node.height / 2,
  };
}

function boundaryToward(node: DiagramNode, target: Point): Point {
  const center = centerOf(node);
  const dx = target.x - center.x;
  const dy = target.y - center.y;
  if (dx === 0 && dy === 0) {
    return center;
  }

  const horizontal = dx === 0 ? Infinity : node.width / 2 / Math.abs(dx);
  const vertical = dy === 0 ? Infinity : node.height / 2 / Math.abs(dy);
  const scale = Math.min(horizontal, vertical);

  return {
    x: center.x + dx * scale,
    y: center.y + dy * scale,
  };
}

function NodeShape({ node }: { readonly node: DiagramNode }) {
  const { x, y, width, height, shape } = node;
  const fold = Math.min(16, width / 5);

  if (shape === 'note') {
    return (
      <>
        <path
          className={styles.nodeBody}
          d={`M${x} ${y}H${x + width - fold}L${x + width} ${y + fold}V${y + height}H${x}Z`}
        />
        <path
          className={styles.nodeDetail}
          d={`M${x + width - fold} ${y}V${y + fold}H${x + width}`}
        />
      </>
    );
  }

  if (shape === 'cylinder') {
    const radius = Math.min(18, height / 5);
    return (
      <>
        <rect
          className={styles.nodeBody}
          x={x}
          y={y + radius}
          width={width}
          height={height - radius}
        />
        <ellipse
          className={styles.nodeBody}
          cx={x + width / 2}
          cy={y + radius}
          rx={width / 2}
          ry={radius}
        />
      </>
    );
  }

  if (shape === 'circle') {
    return (
      <rect
        className={styles.nodeBody}
        x={x}
        y={y}
        width={width}
        height={height}
        rx={height / 2}
      />
    );
  }

  return (
    <>
      <rect
        className={styles.nodeBody}
        x={x}
        y={y}
        width={width}
        height={height}
        rx={shape === 'stack' ? 1 : 2}
      />
      {shape === 'stack' ? (
        <>
          <line
            className={styles.nodeDetail}
            x1={x + 5}
            y1={y + 7}
            x2={x + width - 5}
            y2={y + 7}
          />
          <line
            className={styles.nodeDetail}
            x1={x + 5}
            y1={y + height - 7}
            x2={x + width - 5}
            y2={y + height - 7}
          />
        </>
      ) : null}
    </>
  );
}

export function Diagram({ figure, label = 'Diagram' }: DiagramProps) {
  const key = useId().replaceAll(':', '');
  const titleId = `diagram-title-${key}`;
  const descriptionId = `diagram-description-${key}`;
  const markerId = `diagram-arrow-${key}`;
  const nodesById = new Map(figure.nodes.map((node) => [node.id, node]));

  return (
    <figure className={styles.figure}>
      <div
        className={styles.canvasWrap}
        tabIndex={0}
        role="group"
        aria-label="Diagram viewport"
      >
        <svg
          className={styles.canvas}
          viewBox={`0 0 ${figure.width} ${figure.height}`}
          style={{ minWidth: figure.width }}
          role="img"
          aria-labelledby={`${titleId} ${descriptionId}`}
        >
          <title id={titleId}>{label}</title>
          <desc id={descriptionId}>{figure.alt}</desc>
          <defs>
            <marker
              id={markerId}
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path className={styles.arrowHead} d="M0 0L8 4L0 8Z" />
            </marker>
          </defs>

          {figure.edges.map((edge, index) => {
            const from = nodesById.get(edge.from);
            const to = nodesById.get(edge.to);
            if (!from || !to) {
              return null;
            }

            const fromCenter = centerOf(from);
            const toCenter = centerOf(to);
            const start = boundaryToward(from, toCenter);
            const end = boundaryToward(to, fromCenter);

            return (
              <g
                className={[
                  styles.edge,
                  edge.kind === 'depends' ? styles.edgeDepends : '',
                  edge.kind === 'contrast' ? styles.edgeContrast : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={`${edge.from}-${edge.to}-${index}`}
              >
                <line
                  className={styles.edgeLine}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  markerEnd={`url(#${markerId})`}
                />
              </g>
            );
          })}

          {figure.nodes.map((node) => (
            <g className={NODE_TONE_CLASS[node.tone]} key={node.id}>
              <NodeShape node={node} />
              <foreignObject
                x={node.x + 12}
                y={node.y + 10}
                width={Math.max(0, node.width - 24)}
                height={Math.max(0, node.height - 20)}
              >
                <div className={styles.nodeText}>
                  <span className={styles.nodeLabel}>{node.label}</span>
                  {node.detail ? (
                    <span className={styles.nodeDetailText}>{node.detail}</span>
                  ) : null}
                </div>
              </foreignObject>
            </g>
          ))}

          {figure.edges.map((edge, index) => {
            const from = nodesById.get(edge.from);
            const to = nodesById.get(edge.to);
            if (!from || !to || !edge.label) {
              return null;
            }

            const start = boundaryToward(from, centerOf(to));
            const end = boundaryToward(to, centerOf(from));

            return (
              <text
                className={styles.edgeLabel}
                key={`label-${edge.from}-${edge.to}-${index}`}
                x={(start.x + end.x) / 2}
                y={(start.y + end.y) / 2 - 7}
                textAnchor="middle"
              >
                {edge.label}
              </text>
            );
          })}

          {figure.annotations.map((annotation, index) => (
            <text
              className={styles.annotation}
              key={`${annotation.x}-${annotation.y}-${index}`}
              x={annotation.x}
              y={annotation.y}
              textAnchor={annotation.align === 'right' ? 'end' : 'start'}
            >
              {annotation.text.split('\n').map((line, lineIndex) => (
                <tspan
                  key={`${lineIndex}-${line}`}
                  x={annotation.x}
                  dy={lineIndex === 0 ? 0 : '1.35em'}
                >
                  {line}
                </tspan>
              ))}
            </text>
          ))}
        </svg>
      </div>
      {figure.width > 760 ? (
        <p className={styles.scrollHint}>
          Scroll the figure sideways for the full path.
        </p>
      ) : null}
      <figcaption className={styles.caption}>{figure.caption}</figcaption>
    </figure>
  );
}
