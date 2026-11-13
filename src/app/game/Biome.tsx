import { memo, type CSSProperties } from 'react';
import { pluralize } from '../format.js';
import type { BiomeDecor, TrailBiome } from './trail.js';
import styles from './field-run.module.css';

function two(value: number): string {
  return String(value).padStart(2, '0');
}

const Decor = memo(function Decor({ item }: { readonly item: BiomeDecor }) {
  const style = {
    left: `${item.x}px`,
    '--decor-scale': item.scale,
  } as CSSProperties;

  return (
    <span
      className={styles.decor}
      data-kind={item.kind}
      style={style}
    >
      {item.kind === 'reed' ? (
        <>
          <i />
          <i />
          <i />
        </>
      ) : null}
      {item.kind === 'rock' ? <i /> : null}
      {item.kind === 'flower' ? (
        <>
          <i />
          <i />
        </>
      ) : null}
      {item.kind === 'crate' ? (
        <>
          <i />
          <i />
        </>
      ) : null}
      {item.kind === 'probe' ? (
        <>
          <i />
          <i />
        </>
      ) : null}
      {item.kind === 'post' ? (
        <>
          <i />
          <i />
        </>
      ) : null}
    </span>
  );
});

export const Biome = memo(function Biome({
  biome,
}: {
  readonly biome: TrailBiome;
}) {
  return (
    <div
      aria-hidden="true"
      className={styles.biome}
      style={{
        left: `${biome.start}px`,
        width: `${biome.width}px`,
      }}
    >
      <span className={styles.biomeWash} />
      <span className={styles.biomeWatermark}>{two(biome.index)}</span>

      <span className={styles.biomeSign}>
        <span className={styles.biomeSignIndex}>L{two(biome.index)}</span>
        <span className={styles.biomeSignTitle}>{biome.title}</span>
        <span className={styles.biomeSignMeta}>
          {biome.hasLessons
            ? `${pluralize(biome.lessonCount, 'stage')} · ${pluralize(
                biome.conceptCount,
                'concept',
              )}`
            : 'Brief only · no stages yet'}
        </span>
      </span>

      {biome.hasLessons ? null : (
        <span className={styles.briefMarker}>No published stages yet</span>
      )}

      {biome.decor.map((item) => (
        <Decor item={item} key={item.id} />
      ))}
    </div>
  );
});
