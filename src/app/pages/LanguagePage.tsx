import { useParams } from 'react-router-dom';
import { catalog } from '@/lib/content/catalog.js';
import { pluralize } from '../format.js';
import { ArrowLink } from '../ui/ArrowLink.js';
import { Page } from '../ui/Page.js';
import { PageHeader } from '../ui/PageHeader.js';
import { PageSection } from '../ui/PageSection.js';
import { Prose } from '../ui/Prose.js';
import { Reveal } from '../ui/Reveal.js';
import { StateMark } from '../ui/StateMark.js';
import styles from './LanguagePage.module.css';

export function LanguagePage() {
  const { languageId } = useParams<{ languageId: string }>();
  const language = catalog.languages.find(
    (candidate) => candidate.manifest.id === languageId,
  );

  if (!language) {
    return (
      <Page>
        <PageHeader
          kicker="Language packs"
          title="Pack not found"
          deck="This language is not declared in the compiled content manifest."
        />
        <div className={styles.action}>
          <ArrowLink to="/java">Open the Java roadmap</ArrowLink>
        </div>
      </Page>
    );
  }

  const isAvailable = language.manifest.status === 'available';
  const lessonCount = language.levels.reduce(
    (total, level) =>
      total +
      level.chapters.reduce(
        (chapterTotal, chapter) => chapterTotal + chapter.lessons.length,
        0,
      ),
    0,
  );

  return (
    <Page>
      <PageHeader
        kicker="Language pack"
        title={language.manifest.name}
        deck={language.manifest.description}
        aside={
          <>
            <StateMark tone="neutral">
              {isAvailable ? 'Available' : 'Not written'}
            </StateMark>
            <br />
            <span>{language.manifest.baseline ?? 'No baseline yet'}</span>
            <br />
            <span>{pluralize(language.levels.length, 'level')}</span>
            <br />
            <span>{pluralize(lessonCount, 'lesson')}</span>
          </>
        }
      />

      <PageSection index="01" label="Status" id="pack-status">
        <Reveal className={styles.statusBlock}>
          <span className={styles.signal} aria-hidden="true" />
          <p className={styles.statusLabel}>
            {isAvailable ? 'First pack' : 'Coming soon'}
          </p>
          <h3 className={styles.statusTitle}>
            {isAvailable
              ? 'This pack is available. The curriculum is mapped; the lessons are being written.'
              : 'This pack is not written yet.'}
          </h3>
          <div className={styles.levelPath} aria-hidden="true">
            {language.levels.length > 0
              ? language.levels.map((level, index) => (
                  <span
                    className={styles.levelNode}
                    key={level.manifest.id}
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    {String(level.manifest.index).padStart(2, '0')}
                  </span>
                ))
              : [0, 1, 2].map((index) => (
                  <span
                    className={[styles.levelNode, styles.levelGhost].join(' ')}
                    key={index}
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    --
                  </span>
                ))}
          </div>
          <Prose>
            {isAvailable ? (
              <p>
                Java 21 LTS is the baseline. The path starts at the machine and
                works upward through language semantics, concurrency, the JVM,
                Spring, persistence, and production operations.
              </p>
            ) : (
              <p>
                The slot is declared so the site can name what is planned
                without publishing fake lessons. There is no chapter list, no
                progress bar, and no sign-up funnel behind this page.
              </p>
            )}
            <p>
              Exercises in this pack use a rubric self-check rather than a fake
              browser runtime.
            </p>
          </Prose>
          <div className={styles.action}>
            <ArrowLink to={isAvailable ? '/java' : '/'}>
              {isAvailable ? 'Open the Java roadmap' : 'Return to Today'}
            </ArrowLink>
          </div>
        </Reveal>
      </PageSection>

      <PageSection index="02" label="Pack facts" id="pack-facts">
        <dl className={styles.facts}>
          <Reveal as="div" className={styles.fact}>
            <dt>Status</dt>
            <dd>{isAvailable ? 'Available' : 'Coming soon'}</dd>
          </Reveal>
          <Reveal as="div" className={styles.fact} delay={80}>
            <dt>Baseline</dt>
            <dd>{language.manifest.baseline ?? 'Chosen when the pack starts'}</dd>
          </Reveal>
          <Reveal as="div" className={styles.fact} delay={160}>
            <dt>Exercise mode</dt>
            <dd>
              {language.manifest.exerciseMode === 'rubric-self-check'
                ? 'Draft plus rubric self-check'
                : 'In-browser tests'}
            </dd>
          </Reveal>
          <Reveal as="div" className={styles.fact} delay={240}>
            <dt>Levels</dt>
            <dd>{language.levels.length}</dd>
          </Reveal>
        </dl>
      </PageSection>
    </Page>
  );
}
