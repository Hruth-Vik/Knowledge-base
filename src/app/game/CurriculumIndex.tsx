import { Link } from 'react-router-dom';
import type { LessonStatus, LevelStatus } from '@/lib/state/derive.js';
import { pluralize } from '../format.js';
import { ArrowRightIcon, MapIcon } from '../ui/icons.js';
import { LEVEL_STATUS_LABEL, LESSON_STATUS_LABEL } from './status.js';
import type { TrailWorld } from './trail.js';
import styles from './field-run.module.css';

interface CurriculumIndexProps {
  readonly world: TrailWorld;
  readonly lessonStatuses: ReadonlyMap<string, LessonStatus>;
  readonly levelStatuses: ReadonlyMap<string, LevelStatus | 'brief-only'>;
  readonly onOpenStage: (stageId: string) => void;
  readonly onLocateStage: (stageId: string) => void;
}

function two(value: number): string {
  return String(value).padStart(2, '0');
}

export function CurriculumIndex({
  world,
  lessonStatuses,
  levelStatuses,
  onOpenStage,
  onLocateStage,
}: CurriculumIndexProps) {
  return (
    <div className={styles.curriculum}>
      <ol className={styles.levelList}>
        {world.biomes.map((biome) => {
          const facet =
            levelStatuses.get(biome.levelId) ??
            (biome.hasLessons ? 'unstarted' : 'brief-only');
          const levelLabel =
            facet === 'brief-only'
              ? 'Brief only'
              : LEVEL_STATUS_LABEL[facet];

          return (
            <li className={styles.levelBlock} key={biome.levelId}>
              <div className={styles.levelNumber} aria-hidden="true">
                L{two(biome.index)}
              </div>
              <div className={styles.levelBody}>
                <div className={styles.levelTitleRow}>
                  <h3 className={styles.levelTitle}>
                    <Link to={`/java/${biome.levelId}`}>{biome.title}</Link>
                  </h3>
                  <span className={styles.statusChip} data-status={facet}>
                    <i aria-hidden="true" />
                    {levelLabel}
                  </span>
                </div>
                <p className={styles.levelDeck}>{biome.deck}</p>
                <p className={styles.levelMeta}>
                  {biome.hasLessons
                    ? `${pluralize(biome.lessonCount, 'published stage')} · ${pluralize(
                        biome.conceptCount,
                        'authored concept',
                      )}`
                    : 'No published lessons yet. The level brief is open.'}
                </p>

                {biome.hasLessons ? (
                  <ol className={styles.lessonList}>
                    {biome.stages.map((stage) => {
                      const status =
                        lessonStatuses.get(stage.id) ?? 'not-started';
                      return (
                        <li className={styles.lessonRow} key={stage.id}>
                          <span className={styles.lessonIndex} aria-hidden="true">
                            {two(stage.sequence)}
                          </span>
                          <div className={styles.lessonBody}>
                            <Link className={styles.lessonTitle} to={stage.route}>
                              {stage.title}
                              <ArrowRightIcon aria-hidden="true" />
                            </Link>
                            <span className={styles.lessonMeta}>
                              <span
                                className={styles.statusChip}
                                data-status={status}
                              >
                                <i aria-hidden="true" />
                                {LESSON_STATUS_LABEL[status]}
                              </span>
                              <span>{pluralize(stage.concepts.length, 'concept')}</span>
                              <span>{stage.estimatedMinutes} min</span>
                            </span>
                          </div>
                          <div className={styles.lessonActions}>
                            <button
                              aria-label={`Locate ${stage.title} on the trail`}
                              className={styles.miniButton}
                              onClick={() => onLocateStage(stage.id)}
                              type="button"
                            >
                              <MapIcon aria-hidden="true" />
                              Locate
                            </button>
                            <button
                              aria-label={`Open the stage card for ${stage.title}`}
                              className={styles.miniButton}
                              onClick={() => onOpenStage(stage.id)}
                              type="button"
                            >
                              Stage card
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className={styles.briefNote}>
                    The brief names the outcome. No placeholder lessons or fake
                    progress are shown.
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
