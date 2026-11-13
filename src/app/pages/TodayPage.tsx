import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';
import { catalog } from '@/lib/content/catalog.js';
import {
  countDueCards,
  deriveCurrentStreak,
  getDailyCompletedLessons,
  hasRecordedActivity,
  recentDateKeys,
  toLocalDateKey,
} from '@/lib/state/activity.js';
import {
  deriveLessonStatus,
  deriveLevelStatus,
} from '@/lib/state/derive.js';
import { pendingMilestones } from '@/lib/review/milestones.js';
import type { Milestone } from '@/lib/state/schema.js';
import type { CompiledLevel } from '@/lib/content/types.js';
import { useAppStore } from '../store.js';
import { formatDateKey, formatLongDate, pluralize } from '../format.js';
import { deriveMomentum, toneForLevel } from '../progress.js';
import { ActivityHeatmap } from '../ui/ActivityHeatmap.js';
import { Page } from '../ui/Page.js';
import { ProgressRing } from '../ui/ProgressRing.js';
import {
  ArrowRightIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  ClockIcon,
  FlameIcon,
  LayersIcon,
  MapIcon,
  NotesIcon,
  QuoteIcon,
  ReviewIcon,
  SearchIcon,
  SparkIcon,
  TargetIcon,
  TrophyIcon,
  ZapIcon,
} from '../ui/icons.js';
import { CodePeek } from '../today/CodePeek.js';
import { CountUp } from '../today/CountUp.js';
import { FieldAtlas } from '../today/FieldAtlas.js';
import { MagneticLink } from '../today/MagneticLink.js';
import { Specimen } from '../today/Specimen.js';
import { Tilt } from '../today/Tilt.js';
import styles from './TodayPage.module.css';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const JAVA = catalog.languages.find(
  (language) => language.manifest.id === 'java',
);
const LEVELS = JAVA?.levels ?? [];
const JAVA_CONCEPTS = catalog.concepts.forLanguage('java');
const JAVA_CONCEPT_COUNT = JAVA_CONCEPTS.length;
const PUBLISHED = LEVELS.flatMap((level) =>
  level.chapters.flatMap((chapter) =>
    chapter.lessons.map((record) => ({ level, chapter, record })),
  ),
);

const WEEKDAY = new Intl.DateTimeFormat(undefined, { weekday: 'narrow' });

const TOOLBELT = [
  {
    title: 'Write a note',
    detail: 'Capture the thought before it gets away.',
    to: null,
    action: 'notes',
    Icon: NotesIcon,
  },
  {
    title: 'Open the map',
    detail: 'See how the concepts actually connect.',
    to: '/map',
    action: null,
    Icon: MapIcon,
  },
  {
    title: 'Search the field',
    detail: 'Lessons, ideas, and your own notes.',
    to: null,
    action: 'search',
    Icon: SearchIcon,
  },
  {
    title: 'Review what is fading',
    detail: 'A short pass over real recall.',
    to: '/review',
    action: null,
    Icon: ReviewIcon,
  },
  {
    title: 'Rehearse an answer',
    detail: 'Interview prompts with model answers.',
    to: '/interview',
    action: null,
    Icon: QuoteIcon,
  },
] as const;

function lessonIdsFor(level: CompiledLevel): string[] {
  return level.chapters.flatMap((chapter) =>
    chapter.lessons.map((record) => record.lesson.id),
  );
}

function milestoneTitle(
  milestone: Milestone,
  levels: readonly CompiledLevel[],
): string {
  if (milestone.kind === 'level-end' && milestone.levelId) {
    const level = levels.find(
      (candidate) => candidate.manifest.id === milestone.levelId,
    );
    return level
      ? `${level.manifest.title} level gate`
      : 'Level-end checkpoint';
  }
  const last = [...milestone.lessonIds]
    .reverse()
    .map(
      (lessonId) =>
        catalog.lessons.find((record) => record.lesson.id === lessonId)?.lesson
          .title,
    )
    .find((title) => title !== undefined);
  return last ? `Checkpoint after “${last}”` : 'Five-lesson checkpoint';
}

function dateFromKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12);
}

interface SectionProps {
  readonly children: React.ReactNode;
  readonly className: string | undefined;
  readonly labelledBy: string;
  readonly id?: string;
}

function Section({ children, className, labelledBy, id }: SectionProps) {
  const reduced = useReducedMotion();
  return (
    <motion.section
      aria-labelledby={labelledBy}
      className={className}
      id={id}
      initial={reduced ? false : { opacity: 0, y: 30 }}
      transition={{ duration: 0.75, ease: EASE }}
      viewport={{ once: true, amount: 0.08 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.section>
  );
}

interface SectionHeadProps {
  readonly index: string;
  readonly title: string;
  readonly id: string;
  readonly children?: React.ReactNode;
}

function SectionHead({ index, title, id, children }: SectionHeadProps) {
  return (
    <div className={styles.sectionHead}>
      <h2 className={styles.kicker} id={id}>
        <span aria-hidden="true">{index}</span>
        {title}
      </h2>
      {children ? <div className={styles.sectionAside}>{children}</div> : null}
    </div>
  );
}

export function TodayPage() {
  const data = useAppStore((state) => state.data);
  const reduced = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const [trailEdges, setTrailEdges] = useState({ start: true, end: false });

  const todayKey = toLocalDateKey();
  const completedToday = getDailyCompletedLessons(data, todayKey);
  const goal = data.settings.dailyGoalLessons;
  const dueCards = countDueCards(data);
  const streak = deriveCurrentStreak(data, todayKey);
  const momentum = deriveMomentum(data);

  const recommended =
    PUBLISHED.find(
      ({ record }) =>
        deriveLessonStatus(data.lessons[record.lesson.id]) !== 'mastered',
    ) ?? PUBLISHED[0];

  const recommendedLevel = recommended?.level;
  const levelNumber = recommendedLevel
    ? String(recommendedLevel.manifest.index).padStart(2, '0')
    : '00';
  const sequenceNumber = recommended
    ? String(recommended.record.lesson.sequence).padStart(2, '0')
    : '00';
  const recommendedDone = recommended
    ? deriveLessonStatus(data.lessons[recommended.record.lesson.id])
    : 'not-started';
  const lessonRoute = recommended
    ? `/java/${recommended.record.lesson.levelId}/${recommended.record.lesson.slug}`
    : '/java';
  const workTone =
    recommendedDone === 'mastered'
      ? 'mastered'
      : recommendedDone === 'done'
        ? 'done'
        : recommendedDone === 'in-progress'
          ? 'progress'
          : 'neutral';
  const workLabel =
    recommendedDone === 'mastered'
      ? 'Mastered'
      : recommendedDone === 'done'
        ? 'Done'
        : recommendedDone === 'in-progress'
          ? 'In progress'
          : 'Recommended start';
  const ctaLabel =
    recommendedDone === 'not-started'
      ? 'Open the lesson'
      : recommendedDone === 'mastered'
        ? 'Revisit the lesson'
        : 'Pick up where you stopped';

  const recommendedIndex = recommended
    ? PUBLISHED.findIndex(
        ({ record }) => record.lesson.id === recommended.record.lesson.id,
      )
    : -1;
  const upcoming =
    recommendedIndex >= 0
      ? PUBLISHED.slice(recommendedIndex + 1, recommendedIndex + 4)
      : [];

  const openSearch = () => {
    window.dispatchEvent(new Event('foundation:open-search'));
  };
  const openNotes = () => {
    window.dispatchEvent(new Event('foundation:open-notes'));
  };

  const achievements = [...momentum.achievements]
    .sort((a, b) => Number(b.earned) - Number(a.earned))
    .slice(0, 6);
  const pending = pendingMilestones(data).slice(0, 3);

  const conceptsByLevel = new Map<string, number>();
  for (const concept of JAVA_CONCEPTS) {
    conceptsByLevel.set(
      concept.owner.levelId,
      (conceptsByLevel.get(concept.owner.levelId) ?? 0) + 1,
    );
  }

  const touchedLessonIds = new Set(
    Object.keys(data.lessons).filter(
      (lessonId) =>
        deriveLessonStatus(data.lessons[lessonId]) !== 'not-started',
    ),
  );
  const conceptsMet = JAVA_CONCEPTS.filter((concept) =>
    touchedLessonIds.has(concept.owner.lessonId),
  ).length;

  const restSet = new Set(data.streak.restDays);
  const weeklyDays = recentDateKeys(7).map((key) => {
    const active = hasRecordedActivity(data.activity.days[key]);
    const rest = !active && restSet.has(key);
    return {
      key,
      weekday: WEEKDAY.format(dateFromKey(key)),
      state: active ? ('active' as const) : rest ? ('rest' as const) : ('empty' as const),
      today: key === todayKey,
    };
  });

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const auraY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const stageY = useTransform(scrollYProgress, [0, 1], [0, -54]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 34]);

  useEffect(() => {
    const node = trailRef.current;
    if (!node) {
      return;
    }
    let frame: number | null = null;
    const measure = () => {
      frame = null;
      const start = node.scrollLeft <= 6;
      const end = node.scrollLeft + node.clientWidth >= node.scrollWidth - 6;
      setTrailEdges((previous) =>
        previous.start === start && previous.end === end
          ? previous
          : { start, end },
      );
    };
    const schedule = () => {
      if (frame === null) {
        frame = requestAnimationFrame(measure);
      }
    };
    measure();
    node.addEventListener('scroll', schedule, { passive: true });
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(schedule);
    observer?.observe(node);
    return () => {
      node.removeEventListener('scroll', schedule);
      observer?.disconnect();
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
    };
  }, []);

  useEffect(() => {
    const node = heroRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }
        if (entry.isIntersecting) {
          delete node.dataset.ambient;
        } else {
          node.dataset.ambient = 'paused';
        }
      },
      { rootMargin: '160px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const scrollTrail = (direction: 1 | -1) => {
    const node = trailRef.current;
    if (!node) {
      return;
    }
    node.scrollBy({
      left: Math.min(node.clientWidth * 0.82, 460) * direction,
      behavior: reduced ? 'auto' : 'smooth',
    });
  };

  const segmentCount = Math.max(goal, completedToday);
  const segments = Array.from({ length: segmentCount }, (_, index) => index);
  const remainingToGoal = Math.max(0, goal - completedToday);
  const goalMet = completedToday >= goal;

  const benchCode = recommended?.record.lesson.sections.code.realistic;
  const recommendedConcepts = recommended?.record.lesson.concepts ?? [];

  return (
    <Page className={styles.page} wide>
      <section className={styles.hero} ref={heroRef}>
        <motion.div
          aria-hidden="true"
          className={styles.heroAura}
          style={reduced ? undefined : { y: auraY }}
        >
          <span className={styles.auraRust} />
          <span className={styles.auraTeal} />
          <span className={styles.auraIndigo} />
          <span className={styles.auraRing} />
          <span className={styles.auraRingInner} />
          <span className={styles.auraDots} />
        </motion.div>

        <div className={styles.heroGrid}>
          <motion.div
            className={styles.heroCopy}
            style={reduced ? undefined : { y: copyY }}
          >
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className={styles.dateline}
              initial={reduced ? false : { opacity: 0, y: 12 }}
              transition={{ duration: 0.6, delay: 0.05, ease: EASE }}
            >
              <span className={styles.liveDot} aria-hidden="true" />
              <span>Field station</span>
              <span className={styles.datelineRule} aria-hidden="true" />
              <time dateTime={todayKey}>{formatLongDate()}</time>
              <span className={styles.datelineTag}>Local notebook</span>
            </motion.p>

            <h1 className={styles.title} id="today-title">
              <span className={styles.lineMask}>
                <motion.span
                  animate={{ y: '0%' }}
                  className={styles.line}
                  initial={reduced ? false : { y: '112%' }}
                  transition={{ duration: 0.95, delay: 0.08, ease: EASE }}
                >
                  Take one
                </motion.span>
              </span>
              <span className={styles.lineMask}>
                <motion.span
                  animate={{ y: '0%' }}
                  className={`${styles.line} ${styles.lineAccent}`}
                  initial={reduced ? false : { y: '112%' }}
                  transition={{ duration: 0.95, delay: 0.16, ease: EASE }}
                >
                  mechanism
                </motion.span>
              </span>
              <span className={styles.lineMask}>
                <motion.span
                  animate={{ y: '0%' }}
                  className={styles.line}
                  initial={reduced ? false : { y: '112%' }}
                  transition={{ duration: 0.95, delay: 0.24, ease: EASE }}
                >
                  apart.
                </motion.span>
              </span>
            </h1>

            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className={styles.deck}
              initial={reduced ? false : { opacity: 0, y: 16 }}
              transition={{ duration: 0.7, delay: 0.4, ease: EASE }}
            >
              One staged lesson on the machinery beneath your code. See the
              mechanism, break it on purpose, then prove you can rebuild it.
              The notebook only counts what you actually finish.
            </motion.p>

            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className={styles.heroActions}
              initial={reduced ? false : { opacity: 0, y: 16 }}
              transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
            >
              <MagneticLink className={styles.primaryAction} to={lessonRoute}>
                <span className={styles.actionBadge} aria-hidden="true">
                  {levelNumber}.{sequenceNumber}
                </span>
                <span className={styles.actionLabel}>{ctaLabel}</span>
                <span className={styles.actionArrow} aria-hidden="true">
                  <ArrowRightIcon />
                </span>
              </MagneticLink>
              <button
                className={styles.searchAction}
                onClick={openSearch}
                type="button"
              >
                <SearchIcon />
                Find a thread
                <kbd>⌘K</kbd>
              </button>
            </motion.div>

            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className={styles.heroProof}
              initial={reduced ? false : { opacity: 0, y: 12 }}
              transition={{ duration: 0.7, delay: 0.6, ease: EASE }}
            >
              <span>
                <i aria-hidden="true">01</i> See it
              </span>
              <span>
                <i aria-hidden="true">02</i> Break it
              </span>
              <span>
                <i aria-hidden="true">03</i> Rebuild it
              </span>
            </motion.div>
          </motion.div>

          <motion.div
            className={styles.heroStage}
            style={reduced ? undefined : { y: stageY }}
          >
            <motion.span
              animate={{ opacity: 1, y: 0 }}
              className={`${styles.floatTag} ${styles.floatTagTop}`}
              initial={reduced ? false : { opacity: 0, y: -10 }}
              transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
            >
              <span className={styles.floatDot} aria-hidden="true" />
              Live specimen
            </motion.span>

            <motion.div
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              className={styles.observationWrap}
              initial={
                reduced ? false : { opacity: 0, scale: 0.96, rotate: -1.4 }
              }
              transition={{ duration: 1, delay: 0.22, ease: EASE }}
            >
              <Tilt max={3.6}>
                <div className={styles.observation}>
                  <div className={styles.observationBar}>
                    <span className={styles.observationTitle}>
                      <span className={styles.recordDot} aria-hidden="true" />
                      Specimen {sequenceNumber}
                    </span>
                    <span className={styles.observationMeta}>
                      L{levelNumber} · {recommendedConcepts.length} concepts
                    </span>
                  </div>

                  {recommendedConcepts.length > 0 ? (
                    <Specimen
                      concepts={recommendedConcepts}
                      lessonNumber={sequenceNumber}
                      lessonTitle={recommended?.record.lesson.title ?? 'Lesson'}
                      readout={
                        recommended?.record.lesson.deck ??
                        'A recommended lesson will appear here.'
                      }
                    />
                  ) : (
                    <p className={styles.emptyObservation}>
                      The first published lesson will grow its concept map here.
                    </p>
                  )}

                  <div className={styles.observationFoot}>
                    <Link to={lessonRoute}>
                      Read the field note
                      <ArrowRightIcon />
                    </Link>
                    <span>
                      {recommended?.record.lesson.estimatedMinutes ?? 0} min
                    </span>
                  </div>
                </div>
              </Tilt>
            </motion.div>

            <motion.span
              animate={{ opacity: 1, y: 0 }}
              className={`${styles.floatTag} ${styles.floatTagBottom}`}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              transition={{ duration: 0.6, delay: 0.7, ease: EASE }}
            >
              <SparkIcon />
              Authored links only
            </motion.span>
          </motion.div>
        </div>

        <div className={styles.heroFoot}>
          <a className={styles.scrollCue} href="#pulse">
            <span>Down to the bench</span>
            <i aria-hidden="true" />
          </a>
          <p className={styles.promise}>
            <span>Local notebook</span> Reading is not completion. A lesson
            counts when you mark it done; recall counts when you answer it.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="pulse-title"
        className={styles.pulse}
        id="pulse"
      >
        <div className={styles.pulseHead}>
          <h2 className={styles.kicker} id="pulse-title">
            <span aria-hidden="true">00</span>
            Notebook pulse
          </h2>
          <p className={styles.pulseNote}>
            <span className={styles.liveDot} aria-hidden="true" />
            Live · this browser only
          </p>
        </div>

        <div className={styles.bento}>
          <Link
            className={`${styles.tile} ${styles.tileGoal}`}
            data-tone="rust"
            to="/java"
          >
            <span className={styles.tileTop}>
              <span className={styles.tileLabel}>Today’s goal</span>
              <span className={styles.tileIcon} aria-hidden="true">
                <TargetIcon />
              </span>
            </span>
            <span className={styles.tileFigure}>
              <CountUp
                ariaLabel={`${completedToday} of ${goal} lessons completed today`}
                className={styles.tileNumber}
                value={completedToday}
              />
              <span className={styles.tileDenom}>/ {goal}</span>
            </span>
            <span className={styles.segments} aria-hidden="true">
              {segments.map((segment) => (
                <span
                  data-filled={segment < completedToday || undefined}
                  key={segment}
                />
              ))}
            </span>
            <span className={styles.tileFoot}>
              <span>
                {goalMet
                  ? 'Goal met. Keep the thread.'
                  : `${pluralize(remainingToGoal, 'lesson')} to close the day`}
              </span>
              <ArrowRightIcon aria-hidden="true" />
            </span>
          </Link>

          <Link
            className={`${styles.tile} ${styles.tileReviews}`}
            data-tone="teal"
            to="/review"
          >
            <span className={styles.tileTop}>
              <span className={styles.tileLabel}>Reviews due</span>
              <span className={styles.tileIcon} aria-hidden="true">
                <ReviewIcon />
              </span>
            </span>
            <span className={styles.tileFigure}>
              <CountUp
                ariaLabel={`${dueCards} review cards due`}
                className={styles.tileNumber}
                value={dueCards}
              />
            </span>
            <span className={styles.tileFoot}>
              <span>{dueCards === 0 ? 'The queue is clear' : 'Open the queue'}</span>
              <ArrowRightIcon aria-hidden="true" />
            </span>
          </Link>

          <article
            aria-label={`${streak} day streak`}
            className={`${styles.tile} ${styles.tileStreak}`}
            data-tone="ochre"
          >
            <span className={styles.tileTop}>
              <span className={styles.tileLabel}>Streak</span>
              <span className={styles.tileIcon} aria-hidden="true">
                <FlameIcon />
              </span>
            </span>
            <span className={styles.tileFigure}>
              <CountUp
                ariaLabel={`${streak} day streak`}
                className={styles.tileNumber}
                value={streak}
              />
              <span className={styles.tileDenom}>days</span>
            </span>
            <span className={styles.weekDots}>
              {weeklyDays.map((day) => (
                <span
                  aria-label={`${formatDateKey(day.key)} — ${day.state}`}
                  className={styles.weekDay}
                  data-state={day.state}
                  data-today={day.today || undefined}
                  key={day.key}
                  role="img"
                  title={`${formatDateKey(day.key)} — ${day.state}`}
                >
                  <i aria-hidden="true" />
                  <em aria-hidden="true">{day.weekday}</em>
                </span>
              ))}
            </span>
          </article>

          <article
            aria-label={`Rank ${momentum.rank.name}, ${momentum.xp} experience points`}
            className={`${styles.tile} ${styles.tileRank}`}
            data-tone="indigo"
          >
            <span className={styles.tileTop}>
              <span className={styles.tileLabel}>Trail rank</span>
              <span className={styles.tileIcon} aria-hidden="true">
                <TrophyIcon />
              </span>
            </span>
            <div className={styles.rankBody}>
              <ProgressRing
                className={styles.rankRing}
                label={`${Math.round(momentum.ringProgress * 100)} percent to the next rank`}
                progress={momentum.ringProgress}
                size={62}
                stroke={4}
                tone={momentum.rank.tone}
              >
                {momentum.rankIndex + 1}
              </ProgressRing>
              <div className={styles.rankCopy}>
                <p className={styles.rankName}>{momentum.rank.name}</p>
                <p className={styles.rankXp}>
                  <CountUp
                    ariaLabel={`${momentum.xp} experience points`}
                    value={momentum.xp}
                  />
                  <span> XP</span>
                  {momentum.nextRank ? (
                    <em>
                      · {momentum.nextRank.xp - momentum.xp} to{' '}
                      {momentum.nextRank.name}
                    </em>
                  ) : (
                    <em>· top of the trail</em>
                  )}
                </p>
              </div>
            </div>
            <span className={styles.xpTrack} aria-hidden="true">
              <span style={{ width: `${momentum.ringProgress * 100}%` }} />
            </span>
          </article>

          <Link
            className={`${styles.tile} ${styles.tileMastery}`}
            data-tone="moss"
            to="/java"
          >
            <span className={styles.tileTop}>
              <span className={styles.tileLabel}>Mastered lessons</span>
              <span className={styles.tileIcon} aria-hidden="true">
                <LayersIcon />
              </span>
            </span>
            <span className={styles.tileFigure}>
              <CountUp
                ariaLabel={`${momentum.lessonsMastered} of ${PUBLISHED.length} lessons mastered`}
                className={styles.tileNumber}
                value={momentum.lessonsMastered}
              />
              <span className={styles.tileDenom}>/ {PUBLISHED.length}</span>
            </span>
            <span className={styles.masteryMeter} aria-hidden="true">
              <span
                style={{
                  width: `${
                    PUBLISHED.length === 0
                      ? 0
                      : (momentum.lessonsMastered / PUBLISHED.length) * 100
                  }%`,
                }}
              />
            </span>
            <span className={styles.tileFoot}>
              <span>
                {conceptsMet} of {JAVA_CONCEPT_COUNT} concepts met
              </span>
              <ArrowRightIcon aria-hidden="true" />
            </span>
          </Link>
        </div>
      </section>

      {pending.length > 0 ? (
        <Section
          className={styles.checks}
          labelledBy="checks-title"
        >
          <div className={styles.checksHead}>
            <h2 className={styles.kicker} id="checks-title">
              <span aria-hidden="true">↳</span>
              Checks ready
            </h2>
            <span>{pluralize(pending.length, 'checkpoint')} · no timer</span>
          </div>
          <ul className={styles.checkTrack}>
            {pending.map((milestone) => (
              <li key={milestone.id}>
                <Link
                  className={styles.checkCard}
                  to={`/quiz/${milestone.id}`}
                >
                  <span className={styles.checkTag}>
                    {milestone.kind === 'level-end'
                      ? 'Level gate'
                      : 'Milestone'}
                  </span>
                  <strong>{milestoneTitle(milestone, LEVELS)}</strong>
                  <span className={styles.checkMeta}>
                    {pluralize(milestone.lessonIds.length, 'lesson')} in the
                    set
                  </span>
                  <span className={styles.checkArrow} aria-hidden="true">
                    <ArrowRightIcon />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section
        className={styles.section}
        id="bench"
        labelledBy="bench-title"
      >
        <SectionHead id="bench-title" index="01" title="On the bench">
          <Link className={styles.sectionLink} to="/java">
            All levels <ArrowRightIcon />
          </Link>
        </SectionHead>

        {recommended ? (
          <>
            <Tilt className={styles.benchTilt} max={2.4}>
              <article className={styles.benchCard}>
                <div className={styles.benchMedia}>
                  <div className={styles.codeWrap}>
                    <span className={styles.codeNote}>
                      <span aria-hidden="true" />
                      From this lesson
                    </span>
                    {benchCode ? (
                      <CodePeek
                        code={benchCode.code}
                        filename={benchCode.filename}
                        language={benchCode.language}
                        maxLines={12}
                      />
                    ) : null}
                  </div>
                  <div className={styles.benchSpecs}>
                    <span>
                      <ClockIcon aria-hidden="true" />
                      {recommended.record.lesson.estimatedMinutes} min
                    </span>
                    <span>
                      <BookOpenIcon aria-hidden="true" />
                      {recommendedConcepts.length} concepts
                    </span>
                    <span>
                      <SparkIcon aria-hidden="true" />
                      {recommended.record.lesson.kind === 'incident-story'
                        ? 'Incident story'
                        : 'Guided build'}
                    </span>
                  </div>
                </div>

                <div className={styles.benchBody}>
                  <div className={styles.benchTagRow}>
                    <span className={styles.lessonTag}>
                      L{levelNumber} · Lesson {sequenceNumber}
                    </span>
                    <span className={styles.statusChip} data-tone={workTone}>
                      <i aria-hidden="true" />
                      {workLabel}
                    </span>
                  </div>
                  <p className={styles.benchKicker}>
                    {recommended.chapter.title}
                  </p>
                  <h3 className={styles.benchTitle}>
                    <Link to={lessonRoute}>
                      {recommended.record.lesson.title}
                    </Link>
                  </h3>
                  <p className={styles.benchDeck}>
                    {recommended.record.lesson.deck}
                  </p>
                  <div className={styles.benchActions}>
                    <MagneticLink
                      className={styles.primaryActionSmall}
                      to={lessonRoute}
                    >
                      {ctaLabel}
                      <ArrowRightIcon aria-hidden="true" />
                    </MagneticLink>
                    <Link
                      className={styles.textLink}
                      to={`/java/${recommended.record.lesson.levelId}`}
                    >
                      Level brief
                    </Link>
                    <button
                      className={styles.textLink}
                      onClick={openNotes}
                      type="button"
                    >
                      Add a note
                    </button>
                  </div>
                  <p className={styles.benchHint}>
                    <ZapIcon aria-hidden="true" />
                    Mastery needs three signals: marked done, recall passed,
                    and the build rubric passed.
                  </p>
                </div>
              </article>
            </Tilt>

            {upcoming.length > 0 ? (
              <div className={styles.queue}>
                <div className={styles.queueHead}>
                  <p className={styles.queueLabel}>Next at the bench</p>
                  <span>Swipe / scroll →</span>
                </div>
                <ol className={styles.queueTrack}>
                  {upcoming.map(({ level, chapter, record }) => {
                    const done = deriveLessonStatus(
                      data.lessons[record.lesson.id],
                    );
                    const state =
                      done === 'mastered'
                        ? 'mastered'
                        : done === 'done'
                          ? 'done'
                          : done === 'in-progress'
                            ? 'progress'
                            : 'neutral';
                    return (
                      <li key={record.lesson.id}>
                        <Link
                          className={styles.queueCard}
                          data-state={state}
                          to={`/java/${record.lesson.levelId}/${record.lesson.slug}`}
                        >
                          <span className={styles.queueIndex} aria-hidden="true">
                            {String(level.manifest.index).padStart(2, '0')}.
                            {String(record.lesson.sequence).padStart(2, '0')}
                          </span>
                          <span className={styles.queueState}>
                            {done === 'mastered'
                              ? 'Mastered'
                              : done === 'done'
                                ? 'Done'
                                : done === 'in-progress'
                                  ? 'In progress'
                                  : 'Not started'}
                          </span>
                          <strong>{record.lesson.title}</strong>
                          <span className={styles.queueChapter}>
                            {chapter.title}
                          </span>
                          <span className={styles.queueFoot}>
                            <span>{record.lesson.estimatedMinutes} min</span>
                            <ArrowRightIcon aria-hidden="true" />
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ) : null}
          </>
        ) : (
          <p className={styles.empty}>
            No lesson is published yet. The level briefs are open —{' '}
            <Link to="/java">walk the trail</Link>.
          </p>
        )}
      </Section>

      <Section
        className={styles.section}
        id="atlas"
        labelledBy="atlas-title"
      >
        <SectionHead id="atlas-title" index="02" title="The concept atlas">
          <span className={styles.sectionNote}>
            Authored links only · tap a node
          </span>
        </SectionHead>
        <p className={styles.sectionIntro}>
          A level drawn the way it is actually connected. Move through the
          nodes to read a concept, trace what it depends on, and jump into the
          lesson that introduces it.
        </p>
        <FieldAtlas initialLevelId={recommendedLevel?.manifest.id} />
      </Section>

      <Section
        className={styles.section}
        id="trail"
        labelledBy="trail-title"
      >
        <SectionHead id="trail-title" index="03" title="The trail">
          <div className={styles.railButtons}>
            <button
              aria-label="Scroll levels left"
              disabled={trailEdges.start}
              onClick={() => scrollTrail(-1)}
              type="button"
            >
              <ChevronLeftIcon />
            </button>
            <button
              aria-label="Scroll levels right"
              data-dir="next"
              disabled={trailEdges.end}
              onClick={() => scrollTrail(1)}
              type="button"
            >
              <ChevronLeftIcon />
            </button>
          </div>
        </SectionHead>

        <div
          aria-label="Java levels, horizontally scrollable"
          className={styles.trailScroller}
          ref={trailRef}
          tabIndex={0}
        >
          <ol className={styles.trailTrack}>
            {LEVELS.map((level) => {
              const ids = lessonIdsFor(level);
              const lessonCount = ids.length;
              const status = deriveLevelStatus(data, ids);
              const mastered = ids.filter(
                (id) => deriveLessonStatus(data.lessons[id]) === 'mastered',
              ).length;
              const touched = ids.filter(
                (id) => deriveLessonStatus(data.lessons[id]) !== 'not-started',
              ).length;
              const isRecommended =
                recommendedLevel?.manifest.id === level.manifest.id;
              const masteredProgress =
                lessonCount === 0 ? 0 : (mastered / lessonCount) * 100;
              const touchedProgress =
                lessonCount === 0 ? 0 : (touched / lessonCount) * 100;
              const stateLabel =
                lessonCount === 0
                  ? 'Brief only'
                  : status === 'mastered'
                    ? 'Mastered'
                    : status === 'in-progress'
                      ? 'In progress'
                      : 'Not started';

              return (
                <li key={level.manifest.id}>
                  <Link
                    className={styles.levelCard}
                    data-recommended={isRecommended || undefined}
                    data-tone={toneForLevel(level.manifest.index)}
                    to={`/java/${level.manifest.id}`}
                  >
                    <span className={styles.levelTop}>
                      <span className={styles.levelNumber} aria-hidden="true">
                        L{String(level.manifest.index).padStart(2, '0')}
                      </span>
                      <span className={styles.levelState}>
                        <i aria-hidden="true" />
                        {stateLabel}
                      </span>
                    </span>
                    <h3>{level.manifest.title}</h3>
                    <p>{level.manifest.deck}</p>
                    <span className={styles.levelMeta}>
                      <span>
                        {lessonCount === 0
                          ? 'Curriculum brief'
                          : pluralize(lessonCount, 'lesson')}
                      </span>
                      <span>
                        {pluralize(
                          conceptsByLevel.get(level.manifest.id) ?? 0,
                          'concept',
                        )}
                      </span>
                    </span>
                    <span className={styles.levelMeter} aria-hidden="true">
                      <span
                        className={styles.levelTouched}
                        style={{ width: `${touchedProgress}%` }}
                      />
                      <span
                        className={styles.levelMastered}
                        style={{ width: `${masteredProgress}%` }}
                      />
                    </span>
                    <span className={styles.levelFoot}>
                      {isRecommended ? 'Recommended next' : 'Open level'}
                      <ArrowRightIcon aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </Section>

      <Section
        className={styles.section}
        id="kit"
        labelledBy="kit-title"
      >
        <SectionHead id="kit-title" index="04" title="Field kit">
          <span className={styles.sectionNote}>Shortcuts, not a syllabus</span>
        </SectionHead>

        <div className={styles.toolkitGrid}>
          <div className={styles.kitPanel}>
            <div className={styles.kitIntro}>
              <h3>Five ways into the work.</h3>
              <p>
                Every tool writes to the same local notebook. Nothing here
                depends on an account or a server.
              </p>
            </div>
            <ul className={styles.kitGrid}>
              {TOOLBELT.map((tool, index) => {
                const Icon = tool.Icon;
                const tone = ['rust', 'indigo', 'ochre', 'teal', 'rose'][
                  index
                ];
                const inner = (
                  <>
                    <span className={styles.kitIcon} data-tone={tone}>
                      <Icon aria-hidden="true" />
                    </span>
                    <span className={styles.kitCopy}>
                      <strong>{tool.title}</strong>
                      <span>{tool.detail}</span>
                    </span>
                    <span className={styles.kitArrow} aria-hidden="true">
                      <ArrowRightIcon />
                    </span>
                  </>
                );
                return (
                  <li key={tool.title}>
                    {tool.to ? (
                      <Link className={styles.kitLink} to={tool.to}>
                        {inner}
                      </Link>
                    ) : (
                      <button
                        className={styles.kitLink}
                        onClick={
                          tool.action === 'notes' ? openNotes : openSearch
                        }
                        type="button"
                      >
                        {inner}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            <Link className={styles.kitTrail} to="/play">
              <span className={styles.kitTrailCopy}>
                <span className={styles.kitTrailKicker}>Optional side trail</span>
                <strong>Run the Java trail as a chibi field game</strong>
                <span>
                  Reads this notebook for its map state. Writes nothing, and
                  never replaces the lesson route.
                </span>
              </span>
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          </div>

          <aside
            aria-labelledby="evidence-title"
            className={styles.evidencePanel}
          >
            <div className={styles.evidenceHead}>
              <div>
                <p className={styles.tileLabel} id="evidence-title">
                  Evidence
                </p>
                <h3>Earned in the notebook</h3>
              </div>
              <span className={styles.evidenceCount}>
                <CountUp
                  ariaLabel={`${momentum.earnedAchievements} of ${momentum.achievements.length} achievements earned`}
                  value={momentum.earnedAchievements}
                />
                <span> / {momentum.achievements.length}</span>
              </span>
            </div>
            <ul className={styles.stampGrid}>
              {achievements.map((achievement) => (
                <li
                  data-earned={achievement.earned || undefined}
                  key={achievement.id}
                  title={achievement.detail}
                >
                  <span className={styles.stampMark} aria-hidden="true">
                    <SparkIcon />
                  </span>
                  <span className={styles.stampCopy}>
                    <strong>{achievement.title}</strong>
                    <span>{achievement.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link className={styles.evidenceLink} to="/settings">
              Notebook settings <ArrowRightIcon aria-hidden="true" />
            </Link>
          </aside>
        </div>
      </Section>

      <Section
        className={styles.section}
        id="record"
        labelledBy="record-title"
      >
        <SectionHead id="record-title" index="05" title="Field record">
          <span className={styles.sectionNote}>
            Activity = lesson, review, or quiz
          </span>
        </SectionHead>

        <div className={styles.recordGrid}>
          <div className={styles.heatPanel}>
            <div className={styles.heatHead}>
              <h3>Twelve weeks of real work</h3>
              <span>84 local days</span>
            </div>
            <div className={styles.heatStage}>
              <ActivityHeatmap
                activity={data.activity.days}
                restDays={data.streak.restDays}
              />
              <div className={styles.heatStat}>
                <span className={styles.heatNumber}>
                  <CountUp
                    ariaLabel={`${streak} day streak`}
                    value={streak}
                  />
                </span>
                <span className={styles.heatLabel}>
                  day{streak === 1 ? '' : 's'} in the current run
                </span>
                <p>
                  Rest days keep the run alive without pretending work
                  happened.
                </p>
              </div>
            </div>
          </div>

          <aside className={styles.recordAside}>
            <span className={styles.localMark}>
              <SparkIcon aria-hidden="true" />
              Local-first
            </span>
            <p className={styles.recordQuote}>
              The notebook only counts what you actually finish.
            </p>
            <p>
              Opening the app is not activity. A square is filled by a lesson
              marked done, a review answered, or a quiz completed. The record
              stays in this browser.
            </p>
            <Link className={styles.recordLink} to="/settings">
              Notebook &amp; backups
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          </aside>
        </div>
      </Section>
    </Page>
  );
}
