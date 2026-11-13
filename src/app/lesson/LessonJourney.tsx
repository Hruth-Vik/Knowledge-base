import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { LessonContent } from '@/lib/schema/lesson.js';
import type { LessonProgress } from '@/lib/state/schema.js';
import type { LessonStatus } from '@/lib/state/derive.js';
import type { RecallAnswerInput } from '@/lib/state/lesson.js';
import { ArrowLink } from '../ui/ArrowLink.js';
import { Button } from '../ui/Button.js';
import { Confetti } from '../ui/Confetti.js';
import { ProgressRing } from '../ui/ProgressRing.js';
import { StateMark } from '../ui/StateMark.js';
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  ClockIcon,
  LayersIcon,
  MapIcon,
  ReviewIcon,
  SparkIcon,
  TrophyIcon,
} from '../ui/icons.js';
import { BreakIt } from './BreakIt.js';
import { CodeBlock } from './CodeBlock.js';
import { Diagram } from './Diagram.js';
import { Exercise } from './Exercise.js';
import { FinishPanel } from './FinishPanel.js';
import { InterviewCorner } from './InterviewCorner.js';
import { Markdown } from './Markdown.js';
import { RecallCheck } from './RecallCheck.js';
import styles from './LessonJourney.module.css';

type JourneyTone =
  | 'rust'
  | 'ochre'
  | 'teal'
  | 'indigo'
  | 'oxide'
  | 'plum'
  | 'moss'
  | 'sun'
  | 'sky'
  | 'rose';

type ActId = 'frame' | 'see' | 'read' | 'stress' | 'say' | 'build' | 'prove';

type StepKind =
  | 'problem'
  | 'analogy'
  | 'mapping'
  | 'mental-model'
  | 'under-the-hood'
  | 'code'
  | 'break-it'
  | 'mistakes'
  | 'interview'
  | 'exercise'
  | 'recap'
  | 'recall'
  | 'finish';

interface JourneyStep {
  readonly id: string;
  readonly kind: StepKind;
  readonly act: ActId;
  readonly label: string;
  readonly title: string;
  readonly eyebrow: string;
  readonly tone: JourneyTone;
  readonly underTheHoodIndex?: number;
}

interface Act {
  readonly id: ActId;
  readonly label: string;
  readonly hint: string;
  readonly tone: JourneyTone;
}

interface JourneyMemory {
  readonly started: boolean;
  readonly step: number;
  readonly visited: readonly number[];
}

interface NextLesson {
  readonly title: string;
  readonly to: string;
}

interface LessonJourneyProps {
  readonly lesson: LessonContent;
  readonly levelId: string;
  readonly levelNumber: string;
  readonly levelTitle: string;
  readonly status: LessonStatus;
  readonly progress: LessonProgress | undefined;
  readonly nextLesson: NextLesson | null;
  readonly onToggleDone: (done: boolean) => void;
  readonly onRecordRecall: (answers: readonly RecallAnswerInput[]) => void;
  readonly onSaveDraft: (draft: string) => void;
  readonly onToggleRubric: (rubricId: string, checked: boolean) => void;
  readonly onSetPassed: (passed: boolean) => void;
}

const ACTS: readonly Act[] = [
  { id: 'frame', label: 'Frame it', hint: 'Why the idea exists', tone: 'ochre' },
  { id: 'see', label: 'See it', hint: 'The mechanism, step by step', tone: 'teal' },
  { id: 'read', label: 'Read it', hint: 'The code with annotations', tone: 'sky' },
  { id: 'stress', label: 'Stress it', hint: 'Break it and spot AI traps', tone: 'oxide' },
  { id: 'say', label: 'Say it', hint: 'Answer like an engineer', tone: 'moss' },
  { id: 'build', label: 'Build it', hint: 'Write your own version', tone: 'indigo' },
  { id: 'prove', label: 'Prove it', hint: 'Recall it and close the loop', tone: 'rose' },
];

const ACT_BY_ID = new Map(ACTS.map((act) => [act.id, act]));

const CHEERS = [
  'Stop cleared. One more piece in place.',
  'Nice. That idea is yours now.',
  'Good pace. Keep the thread.',
  'Locked in. The next stop is short.',
  'Progress, not perfection. Keep moving.',
  'That is one less mystery.',
];

const STATUS_TONE: Record<
  LessonStatus,
  { readonly tone: 'neutral' | 'progress' | 'done' | 'mastered'; readonly label: string }
> = {
  'not-started': { tone: 'neutral', label: 'Not started' },
  'in-progress': { tone: 'progress', label: 'In progress' },
  done: { tone: 'done', label: 'Done' },
  mastered: { tone: 'mastered', label: 'Mastered' },
};

function buildSteps(lesson: LessonContent): readonly JourneyStep[] {
  const sections = lesson.sections;
  const mechanismSteps = sections.underTheHood.steps.map(
    (step, index): JourneyStep => ({
      id: `mechanism-${index}`,
      kind: 'under-the-hood',
      act: 'see',
      label: step.title,
      title: step.title,
      eyebrow: `Mechanism ${index + 1} of ${sections.underTheHood.steps.length}`,
      tone: index % 2 === 0 ? 'indigo' : 'teal',
      underTheHoodIndex: index,
    }),
  );

  return [
    {
      id: 'problem',
      kind: 'problem',
      act: 'frame',
      label: 'The problem',
      title: 'Why this matters',
      eyebrow: 'The problem',
      tone: 'ochre',
    },
    {
      id: 'analogy',
      kind: 'analogy',
      act: 'frame',
      label: 'Analogy',
      title: sections.analogy.title,
      eyebrow: 'Everyday analogy',
      tone: 'sun',
    },
    {
      id: 'mapping',
      kind: 'mapping',
      act: 'frame',
      label: 'Map it',
      title: 'Where the analogy touches the machine',
      eyebrow: 'Analogy, translated',
      tone: 'rust',
    },
    {
      id: 'mental-model',
      kind: 'mental-model',
      act: 'see',
      label: 'Mental model',
      title: sections.mentalModel.title,
      eyebrow: 'The picture to keep',
      tone: 'teal',
    },
    ...mechanismSteps,
    {
      id: 'code',
      kind: 'code',
      act: 'read',
      label: 'Annotated code',
      title: 'Read it with a guide',
      eyebrow: 'Code, annotated',
      tone: 'sky',
    },
    {
      id: 'break-it',
      kind: 'break-it',
      act: 'stress',
      label: 'Break it',
      title: 'Break it on purpose',
      eyebrow: 'Failure lab',
      tone: 'oxide',
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      act: 'stress',
      label: 'AI traps',
      title: 'Where convincing answers go wrong',
      eyebrow: 'AI failure modes',
      tone: 'plum',
    },
    {
      id: 'interview',
      kind: 'interview',
      act: 'say',
      label: 'Interview corner',
      title: 'Say it like you mean it',
      eyebrow: 'Interview corner',
      tone: 'moss',
    },
    {
      id: 'exercise',
      kind: 'exercise',
      act: 'build',
      label: 'Build it',
      title: sections.writeFromScratch.title,
      eyebrow: 'Build from scratch',
      tone: 'indigo',
    },
    {
      id: 'recap',
      kind: 'recap',
      act: 'prove',
      label: 'Recap',
      title: 'The one-minute version',
      eyebrow: 'Recap',
      tone: 'ochre',
    },
    {
      id: 'recall',
      kind: 'recall',
      act: 'prove',
      label: 'Recall check',
      title: 'Prove it stuck',
      eyebrow: 'Recall check',
      tone: 'rust',
    },
    {
      id: 'finish',
      kind: 'finish',
      act: 'prove',
      label: 'Finish',
      title: 'Close the loop',
      eyebrow: 'Journey complete',
      tone: 'moss',
    },
  ];
}

function storageKeyFor(lessonId: string): string {
  return `foundation.journey.${lessonId}`;
}

function readMemory(key: string): JourneyMemory {
  const fallback: JourneyMemory = { started: false, step: 0, visited: [] };
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return fallback;
    }
    const candidate = parsed as {
      started?: unknown;
      step?: unknown;
      visited?: unknown;
    };
    const step =
      typeof candidate.step === 'number' && Number.isFinite(candidate.step)
        ? Math.max(0, Math.floor(candidate.step))
        : 0;
    const visited = Array.isArray(candidate.visited)
      ? candidate.visited.filter(
          (value): value is number =>
            typeof value === 'number' && Number.isFinite(value),
        )
      : [];
    return {
      started: candidate.started === true,
      step,
      visited,
    };
  } catch {
    return fallback;
  }
}

function writeMemory(key: string, memory: JourneyMemory): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(memory));
  } catch {
    // Private mode or full quota: the lesson still works for this visit.
  }
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return reduced;
}

function toneStyle(tone: JourneyTone): CSSProperties {
  return { '--journey-tone': `var(--tone-${tone})` } as CSSProperties;
}

function CodeShowcase({
  section,
}: {
  readonly section: LessonContent['sections']['code'];
}) {
  const [tab, setTab] = useState<'minimal' | 'realistic'>('minimal');
  const example = tab === 'minimal' ? section.minimal : section.realistic;

  return (
    <div className={styles.codeShowcase}>
      <Markdown>{section.intro}</Markdown>
      <div className={styles.tabRow} role="tablist" aria-label="Code examples">
        <button
          aria-selected={tab === 'minimal'}
          className={[styles.tab, tab === 'minimal' ? styles.tabActive : '']
            .filter(Boolean)
            .join(' ')}
          onClick={() => setTab('minimal')}
          role="tab"
          type="button"
        >
          <span className={styles.tabIndex}>01</span>
          Minimal example
        </button>
        <button
          aria-selected={tab === 'realistic'}
          className={[styles.tab, tab === 'realistic' ? styles.tabActive : '']
            .filter(Boolean)
            .join(' ')}
          onClick={() => setTab('realistic')}
          role="tab"
          type="button"
        >
          <span className={styles.tabIndex}>02</span>
          Realistic load path
        </button>
      </div>
      <div
        aria-label={tab === 'minimal' ? 'Minimal example' : 'Realistic load path'}
        className={styles.tabPanel}
        key={tab}
        role="tabpanel"
      >
        <CodeBlock
          annotations={example.annotations}
          code={example.code}
          filename={example.filename}
          language={example.language}
          output={example.output}
        />
      </div>
    </div>
  );
}

function MistakeDeck({
  section,
}: {
  readonly section: LessonContent['sections']['aiMistakes'];
}) {
  const [active, setActive] = useState(0);
  const mistake = section.mistakes[active] ?? section.mistakes[0];

  if (!mistake) {
    return null;
  }

  return (
    <div className={styles.mistakes}>
      <Markdown>{section.intro}</Markdown>
      <div className={styles.mistakeLayout}>
        <div className={styles.mistakeRail} role="tablist" aria-label="AI failure modes">
          {section.mistakes.map((item, index) => (
            <button
              aria-selected={index === active}
              className={[
                styles.mistakeTab,
                index === active ? styles.mistakeTabActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={item.title}
              onClick={() => setActive(index)}
              role="tab"
              type="button"
            >
              <span className={styles.mistakeNumber}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>{item.title}</span>
            </button>
          ))}
        </div>

        <article className={styles.mistakeCard} key={mistake.title}>
          <div className={styles.generated}>
            <p className={styles.miniLabel}>What an AI often writes</p>
            <Markdown>{mistake.generatedPattern}</Markdown>
          </div>
          <div className={styles.mistakeGrid}>
            <div>
              <p className={styles.miniLabel}>Why it fails</p>
              <Markdown>{mistake.whyItFails}</Markdown>
            </div>
            <div>
              <p className={styles.miniLabel}>Correction</p>
              <Markdown>{mistake.correction}</Markdown>
            </div>
          </div>
          <p className={styles.telltale}>
            <span>Telltale</span> {mistake.telltale}
          </p>
        </article>
      </div>

      <details className={styles.checklist}>
        <summary>
          <span className={styles.checklistIcon} aria-hidden="true">
            <CheckIcon />
          </span>
          The review checklist
          <span className={styles.checklistHint}>
            {section.reviewChecklist.length} checks
          </span>
        </summary>
        <ul>
          {section.reviewChecklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

export function LessonJourney({
  lesson,
  levelId,
  levelNumber,
  levelTitle,
  status,
  progress,
  nextLesson,
  onToggleDone,
  onRecordRecall,
  onSaveDraft,
  onToggleRubric,
  onSetPassed,
}: LessonJourneyProps) {
  const steps = useMemo(() => buildSteps(lesson), [lesson]);
  const storageKey = storageKeyFor(lesson.id);
  const [searchParams, setSearchParams] = useSearchParams();
  const [memory, setMemory] = useState<JourneyMemory>(() => readMemory(storageKey));
  const [phase, setPhase] = useState<'cover' | 'journey'>('cover');
  const [cheer, setCheer] = useState<{ id: number; text: string } | null>(null);
  const [burst, setBurst] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const cheerTimer = useRef<number | undefined>(undefined);
  const deepLinkHandled = useRef(false);

  const lastIndex = Math.max(0, steps.length - 1);
  const current = Math.min(Math.max(memory.step, 0), lastIndex);
  const step = steps[current] ?? steps[0];
  const activeAct = step ? ACT_BY_ID.get(step.act) : undefined;
  const progressValue = phase === 'journey' ? (current + 1) / steps.length : 0;
  const percent = Math.round(progressValue * 100);
  const visited = new Set(memory.visited);
  const completedCount = current + 1;
  const statusView = STATUS_TONE[status];

  useEffect(() => {
    return () => window.clearTimeout(cheerTimer.current);
  }, []);

  useEffect(() => {
    if (phase !== 'journey') {
      return;
    }
    const node = stageRef.current;
    if (!node) {
      return;
    }
    const top = window.scrollY + node.getBoundingClientRect().top - 104;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [current, phase, reducedMotion]);

  // A quiz result can point back at the exact recall stop. The query is
  // consumed once so a later reload does not yank the reader out of context.
  useEffect(() => {
    if (deepLinkHandled.current || searchParams.get('stop') !== 'recall') {
      return;
    }
    deepLinkHandled.current = true;
    setSearchParams({}, { replace: true });

    const recallIndex = steps.findIndex((item) => item.kind === 'recall');
    if (recallIndex < 0) {
      return;
    }

    const next: JourneyMemory = {
      started: true,
      step: recallIndex,
      visited: memory.visited.includes(recallIndex)
        ? memory.visited
        : [...memory.visited, recallIndex],
    };
    setMemory(next);
    writeMemory(storageKey, next);
    setPhase('journey');
  }, [memory.visited, searchParams, setSearchParams, steps, storageKey]);

  function persist(next: JourneyMemory): void {
    setMemory(next);
    writeMemory(storageKey, next);
  }

  function showCheer(index: number): void {
    window.clearTimeout(cheerTimer.current);
    const reached = Math.round(((index + 1) / steps.length) * 100);
    const milestone =
      index === lastIndex
        ? 'You reached the final stop. Close the loop below.'
        : reached >= 75
          ? 'Three quarters down. The hard part is behind you.'
          : reached >= 50
            ? 'Halfway there. The shape is forming.'
            : reached >= 25
              ? 'A quarter in. Keep the thread.'
              : CHEERS[index % CHEERS.length] ?? CHEERS[0] ?? '';
    setCheer({ id: Date.now(), text: milestone });
    cheerTimer.current = window.setTimeout(() => setCheer(null), 2800);
  }

  function goTo(index: number): void {
    const next = Math.min(Math.max(index, 0), lastIndex);
    if (phase !== 'journey') {
      setPhase('journey');
    }
    const nextVisited = visited.has(next)
      ? memory.visited
      : [...memory.visited, next];
    persist({ started: true, step: next, visited: nextVisited });
    const halfway = Math.ceil(steps.length / 2);
    if (next === lastIndex || (next >= halfway && current < halfway)) {
      setBurst((value) => value + 1);
    }
    if (next > current) {
      showCheer(next);
    }
  }

  function begin(resume: boolean): void {
    if (resume) {
      setPhase('journey');
      persist({
        started: true,
        step: current,
        visited: visited.has(current)
          ? memory.visited
          : [...memory.visited, current],
      });
      return;
    }
    setPhase('journey');
    persist({ started: true, step: 0, visited: [0] });
  }

  function backToCover(): void {
    setPhase('cover');
    window.scrollTo({
      top: 0,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }

  function handleDone(done: boolean): void {
    onToggleDone(done);
    if (done) {
      setBurst((value) => value + 1);
      setCheer({
        id: Date.now(),
        text: 'Done recorded. The loop is closed.',
      });
    }
  }

  const conceptLine = lesson.concepts.map((concept) => concept.title).join(' · ');

  function renderRailNav(): ReactNode {
    return (
      <nav className={styles.railNav} aria-label="Lesson route">
        {ACTS.map((act) => {
          const actSteps = steps
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => item.act === act.id);
          if (actSteps.length === 0) {
            return null;
          }
          return (
            <div className={styles.railGroup} key={act.id}>
              <p className={styles.railGroupLabel} style={toneStyle(act.tone)}>
                <span className={styles.railDot} aria-hidden="true" />
                {act.label}
                <span className={styles.railGroupCount}>{actSteps.length}</span>
              </p>
              <ol className={styles.railSteps}>
                {actSteps.map(({ item, index }) => {
                  const isCurrent = phase === 'journey' && index === current;
                  const isDone = index < current && visited.has(index);
                  return (
                    <li key={item.id}>
                      <button
                        aria-current={isCurrent ? 'step' : undefined}
                        className={[
                          styles.railStep,
                          isCurrent ? styles.railStepCurrent : '',
                          isDone ? styles.railStepDone : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => goTo(index)}
                        type="button"
                      >
                        <span className={styles.railMark} aria-hidden="true">
                          {isDone ? <CheckIcon /> : String(index + 1).padStart(2, '0')}
                        </span>
                        <span className={styles.railLabel}>{item.label}</span>
                        {item.kind === 'finish' ? (
                          <TrophyIcon className={styles.railTrophy} />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </nav>
    );
  }

  function renderUnderTheHood(
    underTheHoodIndex: number,
  ): ReactNode {
    const section = lesson.sections.underTheHood;
    const item = section.steps[underTheHoodIndex];
    if (!item) {
      return null;
    }
    return (
      <div className={styles.mechanism}>
        {underTheHoodIndex === 0 ? (
          <div className={styles.sectionIntro}>
            <Markdown>{section.intro}</Markdown>
          </div>
        ) : null}
        <div className={styles.mechanismBody}>
          <Markdown>{item.body}</Markdown>
          {item.code ? (
            <div className={styles.mechanismCode}>
              <CodeBlock
                annotations={item.code.annotations}
                code={item.code.code}
                filename={item.code.filename}
                language={item.code.language}
                output={item.code.output}
              />
            </div>
          ) : null}
        </div>
        {underTheHoodIndex === section.steps.length - 1 && section.outro ? (
          <div className={styles.outro}>
            <Markdown>{section.outro}</Markdown>
          </div>
        ) : null}
      </div>
    );
  }

  function renderStepBody(item: JourneyStep): ReactNode {
    const sections = lesson.sections;
    switch (item.kind) {
      case 'problem':
        return (
          <div className={styles.proseLead}>
            <Markdown>{sections.problem}</Markdown>
          </div>
        );
      case 'analogy':
        return (
          <div className={styles.proseLead}>
            <Markdown>{sections.analogy.body}</Markdown>
            <p className={styles.sideNote}>
              Keep this picture in your pocket. The next stop maps each piece to
              the real machine.
            </p>
          </div>
        );
      case 'mapping':
        return (
          <div>
            <dl className={styles.mapping}>
              {sections.analogy.mapping.map((pair, index) => (
                <div
                  className={styles.mappingRow}
                  key={pair.technical}
                  style={{ '--row-index': index } as CSSProperties}
                >
                  <span className={styles.mappingIndex} aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <dt>{pair.technical}</dt>
                  <dd>{pair.everyday}</dd>
                </div>
              ))}
            </dl>
            <div className={styles.breaks}>
              <p className={styles.miniLabel}>Where the analogy breaks</p>
              <Markdown>{sections.analogy.whereItBreaks}</Markdown>
            </div>
          </div>
        );
      case 'mental-model':
        return (
          <Diagram
            figure={sections.mentalModel.figure}
            label={sections.mentalModel.title}
          />
        );
      case 'under-the-hood':
        return renderUnderTheHood(item.underTheHoodIndex ?? 0);
      case 'code':
        return <CodeShowcase section={sections.code} />;
      case 'break-it':
        return <BreakIt section={sections.breakIt} />;
      case 'mistakes':
        return <MistakeDeck section={sections.aiMistakes} />;
      case 'interview':
        return <InterviewCorner corner={sections.interviewCorner} />;
      case 'exercise':
        return (
          <Exercise
            exercise={sections.writeFromScratch}
            onSaveDraft={onSaveDraft}
            onSetPassed={onSetPassed}
            onToggleRubric={onToggleRubric}
            progress={progress}
          />
        );
      case 'recap':
        return (
          <div>
            <ul className={styles.recap}>
              {sections.recap.map((line, index) => (
                <li key={line} style={{ '--row-index': index } as CSSProperties}>
                  {line}
                </li>
              ))}
            </ul>
            {lesson.versionCaveats ? (
              <div className={styles.caveat}>
                <p className={styles.miniLabel}>Version note</p>
                {lesson.versionCaveats.map((caveat) => (
                  <p key={caveat}>{caveat}</p>
                ))}
              </div>
            ) : null}
            {lesson.references ? (
              <details className={styles.references}>
                <summary>Sources and further reading</summary>
                <ul>
                  {lesson.references.map((reference) => (
                    <li key={reference.url}>
                      <a
                        href={reference.url}
                        rel="noreferrer noopener"
                        target="_blank"
                      >
                        {reference.title}
                      </a>
                      {reference.note ? <span>{reference.note}</span> : null}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        );
      case 'recall':
        return (
          <RecallCheck
            onRecord={onRecordRecall}
            progress={progress}
            questions={lesson.recallCheck}
          />
        );
      case 'finish':
        return (
          <div className={styles.finish}>
            <div className={styles.finishBanner}>
              <span className={styles.finishIcon} aria-hidden="true">
                <TrophyIcon />
              </span>
              <div>
                <p className={styles.finishKicker}>Journey complete</p>
                <h3 className={styles.finishTitle}>
                  You walked all {steps.length} stops.
                </h3>
                <p className={styles.finishDeck}>
                  Mark the lesson done, or keep the loop open until recall and
                  the build feel solid.
                </p>
              </div>
            </div>
            <FinishPanel onToggleDone={handleDone} progress={progress} />
            {nextLesson ? (
              <Link className={styles.nextCard} to={nextLesson.to}>
                <span className={styles.nextKicker}>Next stop in this level</span>
                <strong>{nextLesson.title}</strong>
                <span className={styles.nextArrow} aria-hidden="true">
                  <ArrowRightIcon />
                </span>
              </Link>
            ) : (
              <Link className={styles.nextCard} to={`/java/${levelId}`}>
                <span className={styles.nextKicker}>Level complete</span>
                <strong>Return to Level {levelNumber}</strong>
                <span className={styles.nextArrow} aria-hidden="true">
                  <ArrowRightIcon />
                </span>
              </Link>
            )}
            <Link className={styles.playLink} to="/play">
              <span>
                <span className={styles.playKicker}>Optional side trail</span>
                Run this curriculum as a chibi field game. It reads the notebook
                and writes nothing.
              </span>
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          </div>
        );
      default:
        return null;
    }
  }

  if (!step) {
    return null;
  }

  if (phase === 'cover') {
    return (
      <div className={styles.cover}>
        <div className={styles.coverTop}>
          <ArrowLink to={`/java/${levelId}`}>
            Level {levelNumber} · {levelTitle}
          </ArrowLink>
          <StateMark tone={statusView.tone}>{statusView.label}</StateMark>
        </div>

        <div className={styles.coverGrid}>
          <div className={styles.coverCopy}>
            <p className={styles.coverKicker}>
              Java / Level {levelNumber} / Lesson {String(lesson.sequence).padStart(2, '0')}
            </p>
            <h1 className={styles.coverTitle}>{lesson.title}</h1>
            <p className={styles.coverDeck}>{lesson.deck}</p>

            <div className={styles.conceptRow}>
              {lesson.concepts.map((concept) => (
                <span className={styles.conceptChip} key={concept.id}>
                  {concept.title}
                </span>
              ))}
            </div>

            <div className={styles.coverStats}>
              <span>
                <ClockIcon /> {lesson.estimatedMinutes} min
              </span>
              <span>
                <LayersIcon /> {steps.length} stops
              </span>
              <span>
                <ReviewIcon /> Build + recall
              </span>
            </div>

            <div className={styles.coverActions}>
              <button
                className={styles.startButton}
                onClick={() => begin(memory.started)}
                type="button"
              >
                {memory.started
                  ? `Resume at stop ${current + 1} of ${steps.length}`
                  : 'Start the journey'}
                <ArrowRightIcon />
              </button>
              {memory.started ? (
                <button
                  className={styles.restartButton}
                  onClick={() => begin(false)}
                  type="button"
                >
                  Start over
                </button>
              ) : null}
            </div>

            <p className={styles.coverNote}>
              One idea at a time. Your place in this journey is saved on this
              device.
            </p>
          </div>

          <div className={styles.orbit} aria-hidden="true">
            <span className={styles.orbitRing} />
            <span className={styles.orbitRingInner} />
            <span className={styles.orbitDot} />
            <span className={styles.orbitDotTwo} />
            <span className={styles.orbitCore}>
              <span className={styles.orbitLesson}>L{levelNumber}</span>
              <span className={styles.orbitLabel}>Journey</span>
            </span>
            <span className={styles.orbitSpark}>
              <SparkIcon />
            </span>
          </div>
        </div>

        <div className={styles.actTrail} aria-label="Journey overview">
          {ACTS.map((act, index) => {
            const count = steps.filter((item) => item.act === act.id).length;
            return (
              <div
                className={styles.actCard}
                key={act.id}
                style={{ ...toneStyle(act.tone), '--act-index': index } as CSSProperties}
              >
                <span className={styles.actIndex}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <strong>{act.label}</strong>
                <span className={styles.actHint}>{act.hint}</span>
                <span className={styles.actCount}>
                  {count} {count === 1 ? 'stop' : 'stops'}
                </span>
              </div>
            );
          })}
        </div>

        <p className={styles.coverConcepts}>Covers {conceptLine}</p>
      </div>
    );
  }

  const isLast = current === lastIndex;

  return (
    <div className={styles.journey} ref={stageRef}>
      <aside className={styles.rail}>
        <div className={styles.railHead}>
          <ProgressRing
            label={`${percent}% of the lesson journey complete`}
            progress={progressValue}
            size={78}
            tone="rust"
          >
            <span className={styles.ringValue}>{percent}%</span>
          </ProgressRing>
          <div>
            <p className={styles.railKicker}>Your route</p>
            <p className={styles.railTitle}>{lesson.title}</p>
            <p className={styles.railMeta}>
              {completedCount} of {steps.length} stops reached
            </p>
          </div>
        </div>

        {renderRailNav()}

        <button className={styles.coverLink} onClick={backToCover} type="button">
          <ChevronLeftIcon /> Lesson cover
        </button>
        <Link className={styles.railExit} to={`/java/${levelId}`}>
          Save and exit to Level {levelNumber}
        </Link>
      </aside>

      <div className={styles.stage}>
        <Confetti fire={burst} />

        <div className={styles.stageBar}>
          <button
            aria-label={current === 0 ? 'Back to the lesson cover' : 'Previous stop'}
            className={styles.stageBack}
            onClick={() => (current === 0 ? backToCover() : goTo(current - 1))}
            type="button"
          >
            <ChevronLeftIcon />
          </button>
          <div className={styles.stageBarMain}>
            <p className={styles.stageCrumb}>
              {activeAct?.label ?? 'Journey'}
              <span aria-hidden="true">·</span>
              Stop {current + 1} of {steps.length}
            </p>
            <div
              aria-label={`${percent}% complete`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={percent}
              className={styles.stageTrack}
              role="progressbar"
            >
              <span
                className={styles.stageFill}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
          <span className={styles.stagePercent}>{percent}%</span>
          <span className={styles.stageSpark} aria-hidden="true">
            <SparkIcon />
          </span>
        </div>

        <details className={styles.mobileRoute}>
          <summary>
            <MapIcon /> Jump to a stop
            <span>{steps.length} stops</span>
          </summary>
          {renderRailNav()}
        </details>

        <article
          className={styles.stageCard}
          key={step.id}
          style={toneStyle(step.tone)}
          tabIndex={-1}
        >
          <div className={styles.cardRibbon} aria-hidden="true" />
          <header className={styles.cardHead}>
            <div>
              <p className={styles.cardEyebrow}>
                {step.eyebrow}
                <span aria-hidden="true">·</span>
                {activeAct?.hint}
              </p>
              <h2 aria-live="polite" className={styles.cardTitle}>
                {step.title}
              </h2>
            </div>
            <div className={styles.cardStamp} aria-hidden="true">
              <span>{String(current + 1).padStart(2, '0')}</span>
              <small>of {steps.length}</small>
            </div>
          </header>
          <div className={styles.cardBody}>{renderStepBody(step)}</div>
        </article>

        <div className={styles.controls}>
          <Button
            className={styles.controlButton}
            onClick={() => (current === 0 ? backToCover() : goTo(current - 1))}
          >
            <ChevronLeftIcon />
            {current === 0 ? 'Cover' : 'Back'}
          </Button>

          <p aria-live="polite" className={styles.cheer}>
            {cheer ? (
              <span key={cheer.id}>
                <SparkIcon />
                {cheer.text}
              </span>
            ) : (
              <span className={styles.cheerIdle}>
                {isLast ? 'Finish the loop below.' : 'One stop at a time.'}
              </span>
            )}
          </p>

          {isLast ? (
            <span className={styles.finishChip}>
              <TrophyIcon /> Final stop
            </span>
          ) : (
            <Button
              className={styles.nextButton}
              onClick={() => goTo(current + 1)}
              variant="primary"
            >
              Next: {steps[current + 1]?.label ?? 'Continue'}
              <ArrowRightIcon />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
