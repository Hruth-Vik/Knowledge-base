import { Link, useParams } from 'react-router-dom';
import { catalog } from '@/lib/content/catalog.js';
import { deriveLessonStatus, deriveLevelStatus } from '@/lib/state/derive.js';
import type { CompiledLevel } from '@/lib/content/types.js';
import { useAppStore } from '../store.js';
import { pluralize } from '../format.js';
import { toneForLevel } from '../progress.js';
import { ArrowLink } from '../ui/ArrowLink.js';
import { Page } from '../ui/Page.js';
import { PageSection } from '../ui/PageSection.js';
import { ProgressRing } from '../ui/ProgressRing.js';
import { Reveal } from '../ui/Reveal.js';
import { StateMark } from '../ui/StateMark.js';
import {
  ArrowRightIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  ClockIcon,
  LayersIcon,
  QuoteIcon,
  SparkIcon,
  TrophyIcon,
} from '../ui/icons.js';
import styles from './LevelPage.module.css';

function collectLessonIds(level: CompiledLevel): string[] {
  return level.chapters.flatMap((chapter) =>
    chapter.lessons.map((record) => record.lesson.id),
  );
}

export function LevelPage() {
  const { levelId } = useParams<{ levelId: string }>();
  const data = useAppStore((state) => state.data);
  const java = catalog.languages.find(
    (language) => language.manifest.id === 'java',
  );
  const level = java?.levels.find(
    (candidate) => candidate.manifest.id === levelId,
  );

  if (!level || !java) {
    return (
      <Page>
        <div className={styles.missing}>
          <p className={styles.missingKicker}>Trail not found</p>
          <h1 className={styles.missingTitle}>This camp is not on the map.</h1>
          <ArrowLink to="/java">Back to the Java trail</ArrowLink>
        </div>
      </Page>
    );
  }

  const lessonIds = collectLessonIds(level);
  const lessonCount = lessonIds.length;
  const masteredCount = lessonIds.filter(
    (id) => deriveLessonStatus(data.lessons[id]) === 'mastered',
  ).length;
  const concepts = catalog.concepts
    .forLanguage('java')
    .filter((concept) => concept.owner.levelId === level.manifest.id);
  const levelStatus = deriveLevelStatus(data, lessonIds);
  const levelNumber = String(level.manifest.index).padStart(2, '0');
  const tone = toneForLevel(level.manifest.index);
  const progress = lessonCount === 0 ? 0 : masteredCount / lessonCount;
  const previousLevel = java.levels[level.manifest.index - 1];
  const nextLevel = java.levels[level.manifest.index + 1];
  const levelMilestone =
    data.milestones[`milestone.${level.manifest.id}.level-end`];
  const publishedLesson = java.levels
    .flatMap((candidate) => candidate.chapters)
    .flatMap((chapter) => chapter.lessons)[0];

  const statusView =
    lessonCount === 0
      ? { tone: 'neutral' as const, label: 'Brief only' }
      : levelStatus === 'mastered'
        ? { tone: 'mastered' as const, label: 'Mastered' }
        : levelStatus === 'in-progress'
          ? { tone: 'progress' as const, label: 'In progress' }
          : { tone: 'neutral' as const, label: 'Not started' };

  return (
    <Page>
      <div className={styles.backRow}>
        <Link className={styles.backLink} to="/java">
          <ChevronLeftIcon /> All camps
        </Link>
      </div>

      <header className={styles.hero} data-tone={tone}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>
            <span className={styles.kickerDot} aria-hidden="true" />
            Java trail / camp {levelNumber}
          </p>
          <h1 className={styles.title}>{level.manifest.title}</h1>
          <p className={styles.deck}>{level.manifest.deck}</p>
          <div className={styles.heroMeta}>
            <StateMark tone={statusView.tone}>{statusView.label}</StateMark>
            <span className={styles.metaChip}>
              <BookOpenIcon /> {pluralize(lessonCount, 'lesson')}
            </span>
            <span className={styles.metaChip}>
              <SparkIcon /> {pluralize(concepts.length, 'concept')}
            </span>
          </div>
        </div>
        <div className={styles.heroArt}>
          <span className={styles.heroNumber} aria-hidden="true">
            {levelNumber}
          </span>
          {lessonCount > 0 ? (
            <ProgressRing
              progress={progress}
              size={92}
              stroke={7}
              tone={tone}
              label={`${masteredCount} of ${lessonCount} lessons mastered`}
            >
              <span className={styles.ringCount}>
                {masteredCount}
                <small>/{lessonCount}</small>
              </span>
            </ProgressRing>
          ) : (
            <span className={styles.ringEmpty}>
              <SparkIcon />
              being written
            </span>
          )}
          <span className={styles.heroOrbit} aria-hidden="true" />
          <span className={styles.heroDot} aria-hidden="true" />
        </div>
      </header>

      {levelMilestone ? (
        <Link
          className={styles.checkpoint}
          data-state={levelMilestone.status}
          to={`/quiz/${levelMilestone.id}`}
        >
          <span className={styles.checkpointIcon} aria-hidden="true">
            <TrophyIcon />
          </span>
          <span className={styles.checkpointCopy}>
            <span className={styles.checkpointKicker}>
              {levelMilestone.status === 'completed'
                ? 'Level gate cleared'
                : 'Level gate ready'}
            </span>
            <strong>
              {levelMilestone.status === 'completed'
                ? 'Open the result and the exact recall stops to revisit.'
                : 'A short mixed check across this level. It never locks the next camp.'}
            </strong>
          </span>
          <ArrowRightIcon className={styles.checkpointArrow} />
        </Link>
      ) : null}

      <PageSection index="01" label="What you leave with" id="outcome" tone="ochre">
        <div className={styles.outcome}>
          <span className={styles.quoteMark} aria-hidden="true">
            <QuoteIcon />
          </span>
          <p className={styles.outcomeText}>{level.manifest.outcome}</p>
        </div>
        {concepts.length > 0 ? (
          <div className={styles.skills}>
            <p className={styles.skillsLabel}>Skills in this camp</p>
            <ul className={styles.skillList}>
              {concepts.map((concept) => (
                <li key={concept.id}>{concept.title}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </PageSection>

      <PageSection index="02" label="Lessons" id="chapters" tone="teal">
        {lessonCount === 0 ? (
          <div className={styles.empty} data-tone={tone}>
            <span className={styles.emptySpark} aria-hidden="true">
              <SparkIcon />
            </span>
            <p className={styles.emptyLabel}>Camp under construction</p>
            <h3 className={styles.emptyTitle}>
              This level is a brief with a promise, not a fake lesson set.
            </h3>
            <p className={styles.emptyText}>
              The title, premise, and outcome are fixed. Lessons are compiled
              content, never placeholders invented by the interface. This camp
              will light up when its stories are written.
            </p>
            <div className={styles.emptyActions}>
              {publishedLesson ? (
                <ArrowLink
                  to={`/java/${publishedLesson.lesson.levelId}/${publishedLesson.lesson.slug}`}
                >
                  Visit a published camp instead
                </ArrowLink>
              ) : (
                <ArrowLink to="/java">Back to the trail</ArrowLink>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.chapters}>
            {level.chapters.map((chapter) => (
              <section className={styles.chapter} key={chapter.id}>
                <h3 className={styles.chapterTitle}>{chapter.title}</h3>
                <ol className={styles.lessons}>
                  {chapter.lessons.map((record, lessonIndex) => {
                    const status = deriveLessonStatus(
                      data.lessons[record.lesson.id],
                    );
                    const lessonStatus =
                      status === 'mastered'
                        ? { tone: 'mastered' as const, label: 'Mastered' }
                        : status === 'done'
                          ? { tone: 'done' as const, label: 'Done' }
                          : status === 'in-progress'
                            ? {
                                tone: 'progress' as const,
                                label: 'In progress',
                              }
                            : {
                                tone: 'neutral' as const,
                                label: 'Not started',
                              };

                    return (
                      <Reveal
                        as="li"
                        className={styles.lessonItem}
                        delay={Math.min(lessonIndex * 55, 280)}
                        key={record.lesson.id}
                      >
                        <Link
                          className={styles.lesson}
                          data-tone={tone}
                          to={`/java/${level.manifest.id}/${record.lesson.slug}`}
                        >
                          <span className={styles.lessonIndex}>
                            {String(record.lesson.sequence).padStart(2, '0')}
                          </span>
                          <span className={styles.lessonBody}>
                            <span className={styles.lessonTop}>
                              <span className={styles.lessonTitle}>
                                {record.lesson.title}
                              </span>
                              <StateMark tone={lessonStatus.tone}>
                                {lessonStatus.label}
                              </StateMark>
                            </span>
                            <span className={styles.lessonDeck}>
                              {record.lesson.deck}
                            </span>
                            <span className={styles.lessonMeta}>
                              <span>
                                <ClockIcon />
                                {record.lesson.estimatedMinutes} min
                              </span>
                              <span>
                                <LayersIcon />
                                {record.lesson.kind
                                  .replaceAll('-', ' ')
                                  .replace(/^./, (character) =>
                                    character.toUpperCase(),
                                  )}
                              </span>
                              <span>
                                <SparkIcon />
                                {pluralize(record.lesson.concepts.length, 'concept')}
                              </span>
                            </span>
                          </span>
                          <span className={styles.lessonArrow} aria-hidden="true">
                            <ArrowRightIcon />
                          </span>
                        </Link>
                      </Reveal>
                    );
                  })}
                </ol>
              </section>
            ))}
            <p className={styles.note}>
              Lessons open as stories. Drafts, recall attempts, and progress are
              stored in this browser.
            </p>
          </div>
        )}
      </PageSection>

      <PageSection index="03" label="Keep walking" id="adjacent-levels" tone="plum">
        <div className={styles.adjacent}>
          {previousLevel ? (
            <Link
              className={styles.adjacentLink}
              data-direction="previous"
              to={`/java/${previousLevel.manifest.id}`}
            >
              <span className={styles.adjacentLabel}>
                <ChevronLeftIcon /> Previous camp
              </span>
              <span className={styles.adjacentTitle}>
                {previousLevel.manifest.title}
              </span>
            </Link>
          ) : (
            <span className={styles.adjacentBlank}>
              This is the first camp on the trail.
            </span>
          )}
          {nextLevel ? (
            <Link
              className={styles.adjacentLink}
              data-direction="next"
              to={`/java/${nextLevel.manifest.id}`}
            >
              <span className={styles.adjacentLabel}>
                Next camp <ArrowRightIcon />
              </span>
              <span className={styles.adjacentTitle}>
                {nextLevel.manifest.title}
              </span>
            </Link>
          ) : (
            <span className={styles.adjacentBlank}>
              The trail ends here for now.
            </span>
          )}
        </div>
      </PageSection>
    </Page>
  );
}
