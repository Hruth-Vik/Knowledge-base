import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LessonStatus, LevelStatus } from '@/lib/state/derive.js';
import { deriveLessonStatus, deriveLevelStatus } from '@/lib/state/derive.js';
import { Page } from '../ui/Page.js';
import { ArrowRightIcon, SparkIcon } from '../ui/icons.js';
import { useAppStore } from '../store.js';
import { CurriculumIndex } from '../game/CurriculumIndex.js';
import { TrailScene, type TrailSceneHandle } from '../game/TrailScene.js';
import { trailWorld } from '../game/trail.js';
import styles from './PlayPage.module.css';

function two(value: number): string {
  return String(value).padStart(2, '0');
}

export function PlayPage() {
  const data = useAppStore((state) => state.data);
  const sceneRef = useRef<TrailSceneHandle>(null);
  const panelWasOpen = useRef(false);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  const lessonStatuses = new Map<string, LessonStatus>();
  for (const stage of trailWorld.stages) {
    lessonStatuses.set(
      stage.id,
      deriveLessonStatus(data.lessons[stage.lessonId]),
    );
  }

  const levelStatuses = new Map<string, LevelStatus | 'brief-only'>();
  for (const biome of trailWorld.biomes) {
    levelStatuses.set(
      biome.levelId,
      biome.hasLessons
        ? deriveLevelStatus(data, biome.lessonIds)
        : 'brief-only',
    );
  }

  const selectedStage =
    (selectedStageId
      ? trailWorld.stages.find((stage) => stage.id === selectedStageId)
      : null) ?? null;

  const scrollToField = useCallback(() => {
    const field = document.getElementById('chibi-field');
    if (!field) {
      return;
    }
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    field.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    });
  }, []);

  const openStage = useCallback(
    (stageId: string) => {
      setSelectedStageId(stageId);
      scrollToField();
    },
    [scrollToField],
  );

  const closeStage = useCallback(() => {
    setSelectedStageId(null);
  }, []);

  const locateStage = useCallback(
    (stageId: string) => {
      sceneRef.current?.locateStage(stageId);
      scrollToField();
    },
    [scrollToField],
  );

  useEffect(() => {
    if (panelWasOpen.current && selectedStageId === null) {
      sceneRef.current?.focusField();
    }
    panelWasOpen.current = selectedStageId !== null;
  }, [selectedStageId]);

  const focusTrail = () => {
    window.requestAnimationFrame(() => sceneRef.current?.focusField());
  };

  return (
    <Page className={styles.page} wide>
      <section aria-labelledby="play-title" className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            <span aria-hidden="true" className={styles.eyebrowDot} />
            Field station · Java side trail
          </p>
          <h1 className={styles.title} id="play-title">
            Chibi <span className={styles.titleAccent}>Field Run</span>
          </h1>
          <p className={styles.deck}>
            A tiny lab sprite with oversized goggles runs the real Java trail.
            Each biome is a curriculum level, every pylon is a published lesson,
            and every floating orb holds an authored concept. The notebook still
            owns the truth, and the list below reaches every lesson without
            playing.
          </p>
          <div className={styles.heroActions}>
            <a
              className={styles.primaryAction}
              href="#chibi-field"
              onClick={focusTrail}
            >
              Enter the trail
              <ArrowRightIcon aria-hidden="true" />
            </a>
            <Link className={styles.secondaryAction} to="/java">
              Read the roadmap
            </Link>
          </div>
          <p className={styles.heroKeys}>
            <kbd>←</kbd>
            <kbd>→</kbd> or <kbd>A</kbd>
            <kbd>D</kbd> run · <kbd>Space</kbd> jump · <kbd>Enter</kbd> opens the
            nearest pylon
          </p>
          <p className={styles.heroPromise}>
            No combat, timers, economy, or invented XP. Discovery is not
            completion. This page writes no notebook fields.
          </p>
        </div>

        <aside aria-label="What the trail contains" className={styles.pass}>
          <div className={styles.passHead}>
            <span>Java trail pass</span>
            <span className={styles.passStamp} aria-hidden="true">
              F
            </span>
          </div>
          <dl className={styles.passStats}>
            <div>
              <dt>Biomes</dt>
              <dd>{two(trailWorld.biomes.length)}</dd>
              <span>curriculum levels</span>
            </div>
            <div>
              <dt>Stage pylons</dt>
              <dd>{two(trailWorld.stageCount)}</dd>
              <span>published lessons</span>
            </div>
            <div>
              <dt>Observation orbs</dt>
              <dd>{two(trailWorld.conceptCount)}</dd>
              <span>authored concepts</span>
            </div>
          </dl>
          <span aria-hidden="true" className={styles.passRule} />
          <p className={styles.passNote}>
            Counts and titles are read from the compiled catalog. Stage status is
            derived from this browser&rsquo;s notebook.
          </p>
          <p className={styles.passFoot}>
            <SparkIcon aria-hidden="true" />
            Every level is on the trail. Nothing is locked.
          </p>
        </aside>
      </section>

      <section
        aria-labelledby="field-title"
        className={styles.gameSection}
        id="chibi-field"
      >
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.kicker}>
              <span aria-hidden="true">01</span>
              The field
            </p>
            <h2 className={styles.sectionTitle} id="field-title">
              Run the published trail
            </h2>
          </div>
          <p className={styles.sectionNote}>
            Keyboard, touch, and the register below reach the same lessons. The
            trail is an additional way in, never the only one.
          </p>
        </div>

        <TrailScene
          onCloseStage={closeStage}
          onSelectStage={openStage}
          ref={sceneRef}
          selectedStage={selectedStage}
          statuses={lessonStatuses}
          world={trailWorld}
        />
      </section>

      <section
        aria-labelledby="register-title"
        className={styles.registerSection}
      >
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.kicker}>
              <span aria-hidden="true">02</span>
              The register
            </p>
            <h2 className={styles.sectionTitle} id="register-title">
              The trail, as a list
            </h2>
          </div>
          <p className={styles.sectionNote}>
            Every level and published lesson in curriculum order. Locate a stage
            on the trail, open its card, or go straight to the real lesson.
          </p>
        </div>

        <CurriculumIndex
          lessonStatuses={lessonStatuses}
          levelStatuses={levelStatuses}
          onLocateStage={locateStage}
          onOpenStage={openStage}
          world={trailWorld}
        />
      </section>

      <p className={styles.pageFoot}>
        Prefer the working notebook? <Link to="/java">Open the Java roadmap</Link>{' '}
        or <Link to="/">return to Today</Link>.
      </p>
    </Page>
  );
}
