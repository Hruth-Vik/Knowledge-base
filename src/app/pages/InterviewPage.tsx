import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { catalog } from '@/lib/content/catalog.js';
import type { InterviewQuestion } from '@/lib/schema/lesson.js';
import type { QuizAttempt } from '@/lib/state/schema.js';
import { useAppStore } from '../store.js';
import { formatShortDate, pluralize } from '../format.js';
import { CodeBlock } from '../lesson/CodeBlock.js';
import { Markdown } from '../lesson/Markdown.js';
import { ArrowLink } from '../ui/ArrowLink.js';
import { Button } from '../ui/Button.js';
import { Page } from '../ui/Page.js';
import { PageHeader } from '../ui/PageHeader.js';
import { PageSection } from '../ui/PageSection.js';
import { Reveal } from '../ui/Reveal.js';
import { QuoteIcon, SparkIcon } from '../ui/icons.js';
import styles from './InterviewPage.module.css';

interface InterviewEntry {
  readonly question: InterviewQuestion;
  readonly conceptIds: readonly string[];
  readonly lessonId: string;
  readonly lessonTitle: string;
  readonly lessonSlug: string;
  readonly levelId: string;
  readonly levelTitle: string;
  readonly sequence: number;
}

interface InterviewHistory {
  readonly attempts: number;
  readonly lastScore: number;
  readonly bestScore: number;
  readonly lastAt: string;
}

interface ScoredEntry {
  readonly questionId: string;
  readonly score: number;
}

const SCORE_OPTIONS = [
  { value: 0, label: 'No answer', hint: 'Could not start' },
  { value: 1, label: 'Shaky', hint: 'A fragment' },
  { value: 2, label: 'Fragmented', hint: 'Some pieces' },
  { value: 3, label: 'Nearly', hint: 'The shape is there' },
  { value: 4, label: 'Ready', hint: 'Clear and correct' },
  { value: 5, label: 'Sharp', hint: 'Precise, with trade-offs' },
] as const;

function collectEntries(): readonly InterviewEntry[] {
  return catalog.lessons.flatMap((record) => {
    const level = catalog.languages
      .flatMap((language) => language.levels)
      .find((candidate) => candidate.manifest.id === record.lesson.levelId);
    const conceptIds = [
      ...new Set([
        ...record.lesson.concepts.map((concept) => concept.id),
        ...record.lesson.revisits,
      ]),
    ].slice(0, 6);

    return record.lesson.sections.interviewCorner.questions.map((question) => ({
      question,
      conceptIds,
      lessonId: record.lesson.id,
      lessonTitle: record.lesson.title,
      lessonSlug: record.lesson.slug,
      levelId: record.lesson.levelId,
      levelTitle: level?.manifest.title ?? record.lesson.levelId,
      sequence: record.lesson.sequence,
    }));
  });
}

function buildHistories(
  quizzes: readonly QuizAttempt[],
): ReadonlyMap<string, InterviewHistory> {
  const histories = new Map<string, InterviewHistory>();

  for (const attempt of quizzes) {
    if (attempt.kind !== 'interview') {
      continue;
    }
    const at = attempt.completedAt ?? attempt.startedAt;
    for (const outcome of attempt.questions) {
      if (outcome.selfScore === null) {
        continue;
      }
      const previous = histories.get(outcome.questionId);
      histories.set(outcome.questionId, {
        attempts: (previous?.attempts ?? 0) + 1,
        lastScore: outcome.selfScore,
        bestScore: Math.max(previous?.bestScore ?? 0, outcome.selfScore),
        lastAt: !previous || at > previous.lastAt ? at : previous.lastAt,
      });
    }
  }

  return histories;
}

function historyLine(history: InterviewHistory | undefined): string {
  if (!history) {
    return 'Not practised yet';
  }
  const when = formatShortDate(new Date(history.lastAt));
  return `${pluralize(history.attempts, 'attempt')} · last ${history.lastScore}/5 on ${when}`;
}

export function InterviewPage() {
  const data = useAppStore((state) => state.data);
  const recordInterviewAttempt = useAppStore(
    (state) => state.recordInterviewAttempt,
  );

  const entries = useMemo(collectEntries, []);
  const histories = useMemo(
    () => buildHistories(data.quizzes),
    [data.quizzes],
  );

  const [session, setSession] = useState<readonly InterviewEntry[] | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [scores, setScores] = useState<readonly ScoredEntry[]>([]);
  const [finished, setFinished] = useState(false);

  const queue = useMemo(() => {
    const ranked = [...entries].sort((a, b) => {
      const aHistory = histories.get(a.question.id);
      const bHistory = histories.get(b.question.id);
      const aScore = aHistory?.lastScore ?? -1;
      const bScore = bHistory?.lastScore ?? -1;
      if (aScore !== bScore) {
        return aScore - bScore;
      }
      return (aHistory?.lastAt ?? '').localeCompare(bHistory?.lastAt ?? '');
    });
    return ranked;
  }, [entries, histories]);

  const practised = entries.filter((entry) =>
    histories.has(entry.question.id),
  ).length;
  const current = session?.[index];
  const average =
    scores.length === 0
      ? 0
      : Math.round(
          (scores.reduce((total, entry) => total + entry.score, 0) /
            scores.length) *
            10,
        ) / 10;

  function startSession(start?: InterviewEntry): void {
    const ordered = start
      ? [
          start,
          ...queue.filter(
            (entry) => entry.question.id !== start.question.id,
          ),
        ]
      : queue;
    if (ordered.length === 0) {
      return;
    }
    setSession(ordered);
    setIndex(0);
    setRevealed(false);
    setScores([]);
    setFinished(false);
  }

  function leaveSession(): void {
    setSession(null);
    setIndex(0);
    setRevealed(false);
    setScores([]);
    setFinished(false);
  }

  function score(value: number): void {
    if (!current) {
      return;
    }
    const now = new Date();
    const attempt: QuizAttempt = {
      id: crypto.randomUUID(),
      kind: 'interview',
      scope: {
        levelId: current.levelId,
        lessonIds: [current.lessonId],
      },
      startedAt: now.toISOString(),
      completedAt: null,
      durationSeconds: 0,
      status: 'in-progress',
      questions: [
        {
          questionId: current.question.id,
          conceptIds: [...current.conceptIds],
          correct: value >= 4,
          selfScore: value,
          response: null,
        },
      ],
    };

    recordInterviewAttempt(attempt);
    const nextScores = [
      ...scores,
      { questionId: current.question.id, score: value },
    ];
    setScores(nextScores);
    setRevealed(false);

    if (session && index + 1 >= session.length) {
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
  }

  return (
    <Page>
      <PageHeader
        aside={
          <div className={styles.headerStats}>
            <span>
              <QuoteIcon /> {entries.length} prompts
            </span>
            <span>
              {practised} / {entries.length} practised
            </span>
          </div>
        }
        deck="Answer aloud before you unfold anything. Then score the answer honestly against the weak, strong, and model versions. The record stays on this device."
        kicker="Notebook / Interview"
        title="Say it like you mean it"
      />

      {!session ? (
        <>
          <PageSection index="01" label="The practice queue" tone="moss">
            <div className={styles.queuePanel}>
              <div className={styles.queueCopy}>
                <p className={styles.queueLead}>
                  {entries.length === 0
                    ? 'No interview prompts are published yet.'
                    : practised === 0
                      ? 'Start with a junior prompt.'
                      : `${practised} of ${entries.length} prompts have a recorded attempt.`}
                </p>
                <p className={styles.queueText}>
                  The queue puts your weakest last score first, then the oldest
                  attempt. A high score does not remove a prompt: interviews are
                  a rehearsal, not a checklist. Attempts are saved only when you
                  choose a score.
                </p>
                <div className={styles.queueActions}>
                  <Button
                    disabled={entries.length === 0}
                    onClick={() => startSession()}
                    variant="primary"
                  >
                    Start practice
                  </Button>
                  <ArrowLink to="/review">Back to recall review</ArrowLink>
                </div>
              </div>
              <div className={styles.queueStat}>
                <span className={styles.queueStatValue}>{practised}</span>
                <span className={styles.queueStatLabel}>prompts practised</span>
                <div className={styles.queueTrack} aria-hidden="true">
                  <span
                    style={{
                      width: `${entries.length === 0 ? 0 : (practised / entries.length) * 100}%`,
                    }}
                  />
                </div>
                <p className={styles.queueStatNote}>
                  {Object.keys(data.review.cards).length > 0
                    ? 'Interview attempts do not change the recall schedule.'
                    : 'Recall cards are created by lesson recall checks, not by this page.'}
                </p>
              </div>
            </div>

            <ol className={styles.promptList}>
              {queue.map((entry) => {
                const history = histories.get(entry.question.id);
                return (
                  <li key={entry.question.id}>
                    <button
                      className={styles.promptRow}
                      data-difficulty={entry.question.difficulty}
                      onClick={() => startSession(entry)}
                      type="button"
                    >
                      <span className={styles.difficulty}>
                        {entry.question.difficulty}
                      </span>
                      <span className={styles.promptBody}>
                        <strong>{entry.question.question}</strong>
                        <span>
                          {entry.levelTitle} · {entry.lessonTitle}
                        </span>
                        <small>{historyLine(history)}</small>
                      </span>
                      {history ? (
                        <span className={styles.promptScore}>
                          {history.lastScore}
                          <small>/5</small>
                        </span>
                      ) : (
                        <span className={styles.promptNew} aria-hidden="true">
                          <SparkIcon />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </PageSection>

          <PageSection index="02" label="How this works" tone="ochre">
            <div className={styles.facts}>
              <div>
                <p className={styles.factLabel}>Speak first</p>
                <p>
                  Read the prompt, answer it out loud, then reveal the answer.
                  Reading the model first turns practice into recognition.
                </p>
              </div>
              <div>
                <p className={styles.factLabel}>Three lenses</p>
                <p>
                  The weak answer names the common shortcut. The strong answer
                  adds mechanism and trade-offs. The model answer is the full
                  version.
                </p>
              </div>
              <div>
                <p className={styles.factLabel}>Self-scored</p>
                <p>
                  A 0–5 score is your judgement, not an automated grade. It is
                  stored with the exact prompt so the next queue can find it.
                </p>
              </div>
            </div>
          </PageSection>
        </>
      ) : finished ? (
        <PageSection index="01" label="Practice complete" tone="moss">
          <Reveal className={styles.summary}>
            <span className={styles.summaryIcon} aria-hidden="true">
              <SparkIcon />
            </span>
            <p className={styles.summaryKicker}>Practice complete</p>
            <h2 className={styles.summaryTitle}>
              {pluralize(scores.length, 'answer')} scored.
            </h2>
            <p className={styles.summaryText}>
              Average {average}/5. Lowest this round:{' '}
              {Math.min(...scores.map((entry) => entry.score))}/5. The scores are
              in the notebook; the next queue will put the weakest prompt first.
            </p>
            <div className={styles.summaryActions}>
              <Button onClick={() => startSession()} variant="primary">
                Practise again
              </Button>
              <Button onClick={leaveSession}>Back to the queue</Button>
              <ArrowLink to="/review">Go to recall review</ArrowLink>
            </div>
          </Reveal>
        </PageSection>
      ) : current ? (
        <PageSection
          index="01"
          label={`Prompt ${index + 1} of ${session.length}`}
          tone="moss"
        >
          <div className={styles.progressTrack} aria-hidden="true">
            <span
              style={{
                width: `${((index + 1) / session.length) * 100}%`,
              }}
            />
          </div>

          <article className={styles.practiceCard}>
            <div className={styles.practiceHead}>
              <span
                className={styles.difficulty}
                data-difficulty={current.question.difficulty}
              >
                {current.question.difficulty}
              </span>
              <span className={styles.practiceContext}>
                {current.levelTitle} · {current.lessonTitle}
              </span>
            </div>

            <Markdown className={styles.prompt}>
              {current.question.question}
            </Markdown>

            {current.question.code ? (
              <CodeBlock
                code={current.question.code.code}
                filename={current.question.code.filename}
                language={current.question.code.language}
              />
            ) : null}

            {!revealed ? (
              <div className={styles.answerPrompt}>
                <p>
                  Answer aloud before you open the answer. Name the mechanism,
                  then the consequence, then the trade-off.
                </p>
                <div className={styles.promptActions}>
                  <Button onClick={() => setRevealed(true)} variant="primary">
                    Reveal the answer
                  </Button>
                  <Link
                    className={styles.lessonLink}
                    to={`/java/${current.levelId}/${current.lessonSlug}`}
                  >
                    Open the lesson
                  </Link>
                </div>
              </div>
            ) : (
              <div className={styles.revealGrid}>
                <div className={styles.weakPanel}>
                  <p className={styles.answerLabel}>Weak answer</p>
                  <Markdown>{current.question.weakAnswer}</Markdown>
                </div>
                <div className={styles.strongPanel}>
                  <p className={styles.answerLabel}>Strong answer</p>
                  <Markdown>{current.question.strongAnswer}</Markdown>
                </div>
                <div className={styles.modelPanel}>
                  <p className={styles.answerLabel}>Model answer</p>
                  <Markdown>{current.question.modelAnswer}</Markdown>
                </div>
                <div className={styles.followUp}>
                  <span>Follow-up</span>
                  <Markdown>{current.question.followUp}</Markdown>
                </div>
              </div>
            )}

            {revealed ? (
              <Reveal className={styles.scorePanel}>
                <div>
                  <p className={styles.scoreKicker}>Score your spoken answer</p>
                  <p className={styles.scoreText}>
                    A 4 or 5 means the mechanism and the trade-off were both
                    present. Be strict; the score is a scheduling signal, not a
                    compliment.
                  </p>
                </div>
                <div className={styles.scoreButtons}>
                  {SCORE_OPTIONS.map((option) => (
                    <button
                      className={styles.scoreButton}
                      key={option.value}
                      onClick={() => score(option.value)}
                      title={option.hint}
                      type="button"
                    >
                      <strong>{option.value}</strong>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </Reveal>
            ) : null}
          </article>

          <div className={styles.sessionFooter}>
            <p className={styles.sessionNote}>
              <SparkIcon /> Each score creates one local interview attempt.
            </p>
            <Button onClick={leaveSession}>End session</Button>
          </div>
        </PageSection>
      ) : null}
    </Page>
  );
}
