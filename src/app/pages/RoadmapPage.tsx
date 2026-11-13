import { Link } from 'react-router-dom';
import { catalog } from '@/lib/content/catalog.js';
import type { CompiledLevel } from '@/lib/content/types.js';
import { deriveLessonStatus, deriveLevelStatus } from '@/lib/state/derive.js';
import { useAppStore } from '../store.js';
import { pluralize } from '../format.js';
import { toneForLevel } from '../progress.js';
import { Page } from '../ui/Page.js';
import { PageHeader } from '../ui/PageHeader.js';
import { PageSection } from '../ui/PageSection.js';
import { Reveal } from '../ui/Reveal.js';
import { StateMark } from '../ui/StateMark.js';
import { ArrowRightIcon, LayersIcon, SparkIcon } from '../ui/icons.js';
import styles from './RoadmapPage.module.css';

function collectLessonIds(level: CompiledLevel): string[] {
  return level.chapters.flatMap((chapter) =>
    chapter.lessons.map((record) => record.lesson.id),
  );
}

export function RoadmapPage() {
  const data = useAppStore((state) => state.data);
  const java = catalog.languages.find(
    (language) => language.manifest.id === 'java',
  );
  const otherLanguages = catalog.languages.filter(
    (language) => language.manifest.id !== 'java',
  );
  const conceptsByLevel = new Map<string, number>();

  for (const concept of catalog.concepts.forLanguage('java')) {
    conceptsByLevel.set(
      concept.owner.levelId,
      (conceptsByLevel.get(concept.owner.levelId) ?? 0) + 1,
    );
  }

  if (!java) {
    return (
      <Page>
        <PageHeader
          kicker="Curriculum"
          title="Java"
          deck="The Java language manifest is missing from the compiled catalog."
        />
      </Page>
    );
  }

  const publishedLessons = java.levels.flatMap((level) =>
    level.chapters.flatMap((chapter) =>
      chapter.lessons.map((record) => ({ level, record })),
    ),
  );
  const recommendedEntry = publishedLessons.find(
    ({ record }) =>
      deriveLessonStatus(data.lessons[record.lesson.id]) !== 'mastered',
  );
  const recommendedLevel = recommendedEntry?.level ?? null;
  const allPublishedMastered =
    publishedLessons.length > 0 && !recommendedEntry;
  const masteredPublished = publishedLessons.filter(
    ({ record }) =>
      deriveLessonStatus(data.lessons[record.lesson.id]) === 'mastered',
  ).length;

  return (
    <Page>
      <PageHeader
        kicker="Curriculum / Java"
        title="The Java trail"
        deck="Eleven camps, one machine. Each level is a story you can open in any order — no locks, no fake prerequisites, no busywork."
        aside={
          <>
            <span className={styles.asideLabel}>Trail status</span>
            <span className={styles.asideBig}>
              {masteredPublished}/{publishedLessons.length}
            </span>
            <span>published lessons mastered</span>
            <br />
            <span>{java.manifest.baseline}</span>
          </>
        }
      />

      <PageSection index="01" label="Camps on the trail" id="levels" tone="ochre">
        <div className={styles.introRow}>
          <p className={styles.intro}>
            {allPublishedMastered
              ? 'Every published lesson is mastered. New camps will light up as content ships.'
              : 'The camps are ordered, but none of them are locked. Walk ahead if curiosity pulls you.'}
          </p>
          <p className={styles.legend}>
            <span>
              <i className={styles.legendDot} data-state="unstarted" /> waiting
            </span>
            <span>
              <i className={styles.legendDot} data-state="progress" /> in the
              works
            </span>
            <span>
              <i className={styles.legendDot} data-state="mastered" /> mastered
            </span>
          </p>
        </div>

        <ol className={styles.grid}>
          {java.levels.map((level, mapIndex) => {
            const lessonIds = collectLessonIds(level);
            const lessonCount = lessonIds.length;
            const conceptCount = conceptsByLevel.get(level.manifest.id) ?? 0;
            const status = deriveLevelStatus(data, lessonIds);
            const masteredCount = lessonIds.filter(
              (id) => deriveLessonStatus(data.lessons[id]) === 'mastered',
            ).length;
            const touchedCount = lessonIds.filter(
              (id) =>
                deriveLessonStatus(data.lessons[id]) !== 'not-started',
            ).length;
            const isRecommended =
              recommendedLevel?.manifest.id === level.manifest.id;
            const levelIndex = String(level.manifest.index).padStart(2, '0');
            const progress =
              lessonCount === 0
                ? 0
                : Math.round((masteredCount / lessonCount) * 100);
            const touched =
              lessonCount === 0
                ? 0
                : Math.round((touchedCount / lessonCount) * 100);

            const statusView =
              lessonCount === 0
                ? { tone: 'neutral' as const, label: 'Brief only' }
                : status === 'mastered'
                  ? { tone: 'mastered' as const, label: 'Mastered' }
                  : status === 'in-progress'
                    ? { tone: 'progress' as const, label: 'In progress' }
                    : { tone: 'neutral' as const, label: 'Not started' };

            return (
              <Reveal
                as="li"
                className={styles.levelItem}
                delay={Math.min(mapIndex * 45, 360)}
                key={level.manifest.id}
              >
                <Link
                  className={styles.levelCard}
                  data-tone={toneForLevel(level.manifest.index)}
                  data-recommended={isRecommended}
                  to={`/java/${level.manifest.id}`}
                >
                  <span className={styles.watermark} aria-hidden="true">
                    {levelIndex}
                  </span>
                  <span className={styles.levelTop}>
                    <span className={styles.levelBadge}>
                      <span aria-hidden="true">L</span>
                      {levelIndex}
                    </span>
                    <StateMark tone={statusView.tone}>
                      {statusView.label}
                    </StateMark>
                  </span>
                  <h2 className={styles.levelTitle}>{level.manifest.title}</h2>
                  <p className={styles.levelDeck}>{level.manifest.deck}</p>
                  <span className={styles.metaRow}>
                    <span>
                      <LayersIcon /> {pluralize(lessonCount, 'lesson')}
                    </span>
                    <span>
                      <SparkIcon /> {pluralize(conceptCount, 'concept')}
                    </span>
                  </span>
                  <span className={styles.rail} aria-hidden="true">
                    <span
                      className={styles.railTouched}
                      style={{ width: `${touched}%` }}
                    />
                    <span
                      className={styles.railMastered}
                      style={{ width: `${progress}%` }}
                    />
                  </span>
                  <span className={styles.cardFooter}>
                    <span className={styles.cardCta}>
                      {lessonCount === 0
                        ? 'Open the brief'
                        : isRecommended
                          ? 'Start this camp'
                          : 'Enter the camp'}
                      <ArrowRightIcon />
                    </span>
                    <span className={styles.cardCount}>
                      {lessonCount === 0
                        ? 'being written'
                        : `${masteredCount}/${lessonCount} mastered`}
                    </span>
                  </span>
                  {isRecommended ? (
                    <span className={styles.ribbon}>Start here</span>
                  ) : null}
                </Link>
              </Reveal>
            );
          })}
        </ol>

        <p className={styles.note}>
          Java exercises use a draft editor and a rubric self-check. FOUNDATION
          does not compile Java in the browser, and does not pretend to.
        </p>
      </PageSection>

      <PageSection index="02" label="Other packs" id="other-packs" tone="plum">
        <ul className={styles.packs}>
          {otherLanguages.map((language) => (
            <li className={styles.pack} key={language.manifest.id}>
              <span className={styles.packGlyph} aria-hidden="true">
                {language.manifest.name.slice(0, 1)}
              </span>
              <div className={styles.packBody}>
                <div className={styles.packTopline}>
                  <h3 className={styles.packTitle}>
                    <Link to={`/languages/${language.manifest.id}`}>
                      {language.manifest.name}
                    </Link>
                  </h3>
                  <StateMark tone="neutral">Not written</StateMark>
                </div>
                <p className={styles.packDeck}>
                  {language.manifest.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <p className={styles.note}>
          The content engine is language-agnostic. A new pack adds manifests and
          lessons; it does not need a second application.
        </p>
      </PageSection>
    </Page>
  );
}
