import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { catalog } from '@/lib/content/catalog.js';
import type { Question } from '@/lib/schema/question.js';
import {
  latestMilestoneAttempt,
  milestoneAttempt,
} from '@/lib/review/milestones.js';
import type { QuestionAnswer } from '@/lib/review/answer.js';
import type {
  QuizAttempt,
  QuizQuestionOutcome,
} from '@/lib/state/schema.js';
import { useAppStore } from '../store.js';
import { pluralize } from '../format.js';
import { QuestionPractice } from '../review/QuestionPractice.js';
import { ArrowLink } from '../ui/ArrowLink.js';
import { Button } from '../ui/Button.js';
import { Page } from '../ui/Page.js';
import { PageHeader } from '../ui/PageHeader.js';
import { PageSection } from '../ui/PageSection.js';
import { Reveal } from '../ui/Reveal.js';
import { SparkIcon, TrophyIcon } from '../ui/icons.js';
import styles from './QuizPage.module.css';

function serializeAnswer(answer: QuestionAnswer): string {
  try {
    return JSON.stringify(answer).slice(0, 8_000);
  } catch {
    return '';
  }
}

function questionFor(outcome: QuizQuestionOutcome): Question | null {
  const reference = catalog.questionsById.get(outcome.questionId);
  return reference?.purpose === 'recall' ? reference.question : null;
}

function lessonRouteFor(questionId: string): string {
  const reference = catalog.questionsById.get(questionId);
  if (!reference) {
    return '/java';
  }
  const lesson = catalog.lessons.find(
    (entry) => entry.lesson.id === reference.lessonId,
  );
  if (!lesson) {
    return '/java';
  }
  return `/java/${lesson.lesson.levelId}/${lesson.lesson.slug}?stop=recall`;
}

export function QuizPage() {
  const { milestoneId } = useParams<{ milestoneId: string }>();
  const data = useAppStore((state) => state.data);
  const startMilestone = useAppStore((state) => state.startMilestone);
  const saveQuizAttempt = useAppStore((state) => state.saveQuizAttempt);
  const completeQuiz = useAppStore((state) => state.completeQuiz);

  const milestone = milestoneId ? data.milestones[milestoneId] : undefined;
  const attempt = milestone ? milestoneAttempt(data, milestone) : null;
  const completedAttempt = milestone
    ? milestone.quizAttemptId
      ? data.quizzes.find((entry) => entry.id === milestone.quizAttemptId) ??
        latestMilestoneAttempt(data, milestone)
      : latestMilestoneAttempt(data, milestone)
    : null;

  const firstUnanswered = attempt
    ? attempt.questions.findIndex((outcome) => outcome.correct === null)
    : -1;
  const [activeIndex, setActiveIndex] = useState(
    firstUnanswered >= 0
      ? firstUnanswered
      : Math.max(0, (attempt?.questions.length ?? 1) - 1),
  );
  const [resolved, setResolved] = useState(
    firstUnanswered < 0 && attempt !== null,
  );
  const [resumeComplete] = useState(
    firstUnanswered < 0 && attempt !== null,
  );

  const activeOutcome = attempt?.questions[activeIndex];
  const activeQuestion = activeOutcome ? questionFor(activeOutcome) : null;
  const isLast = attempt
    ? activeIndex >= attempt.questions.length - 1
    : false;

  const breakdown = useMemo(() => {
    if (!completedAttempt) {
      return { solid: [], decayed: [], fixIt: [] };
    }
    const solid: QuizQuestionOutcome[] = [];
    const decayed: QuizQuestionOutcome[] = [];
    const fixIt: QuizQuestionOutcome[] = [];

    for (const outcome of completedAttempt.questions) {
      if (outcome.correct) {
        solid.push(outcome);
        continue;
      }
      const card = data.review.cards[outcome.questionId];
      const weak =
        card !== undefined &&
        (card.phase === 'relearning' ||
          (card.lastRating !== null && card.lastRating <= 2));
      (weak ? decayed : fixIt).push(outcome);
    }
    return { solid, decayed, fixIt };
  }, [completedAttempt, data.review.cards]);

  if (!milestone) {
    return (
      <Page>
        <PageHeader
          kicker="Assessment"
          title="That milestone is not on the record."
          deck="Milestones are created when a real boundary is reached. This URL does not point at one."
        />
        <ArrowLink to="/java">Back to the Java trail</ArrowLink>
      </Page>
    );
  }

  const level = milestone.levelId
    ? catalog.languages
        .flatMap((language) => language.levels)
        .find((entry) => entry.manifest.id === milestone.levelId)
    : undefined;

  if (completedAttempt) {
    const total = completedAttempt.questions.length;
    const correct = breakdown.solid.length;
    const wrong = breakdown.decayed.length + breakdown.fixIt.length;

    return (
      <Page>
        <PageHeader
          aside={
            <div className={styles.headerStat}>
              <span>{correct} / {total}</span>
              <small>correct</small>
            </div>
          }
          deck={`${milestone.kind === 'level-end' ? 'Level gate' : 'Five-lesson milestone'} · ${pluralize(milestone.lessonIds.length, 'lesson')} in scope`}
          kicker="Assessment / Result"
          title={correct === total ? 'The floor held.' : 'Here is what needs another pass.'}
        />

        <PageSection index="01" label="Breakdown" tone={wrong === 0 ? 'moss' : 'ochre'}>
          <div className={styles.resultSummary}>
            <p className={styles.resultLead}>
              {correct} solid, {breakdown.decayed.length} decaying,{' '}
              {breakdown.fixIt.length} fix-it.
            </p>
            <p className={styles.resultText}>
              {wrong === 0
                ? 'No gaps this time. The next review will still bring these questions back when they are due.'
                : 'A wrong answer is information, not a verdict. Each link opens the recall stop for the lesson that owns it.'}
            </p>
          </div>

          <div className={styles.groups}>
            {[
              { key: 'solid', label: 'Solid', rows: breakdown.solid, tone: 'moss' },
              {
                key: 'decayed',
                label: 'Decayed',
                rows: breakdown.decayed,
                tone: 'ochre',
              },
              {
                key: 'fix-it',
                label: 'Fix it',
                rows: breakdown.fixIt,
                tone: 'oxide',
              },
            ].map((group) =>
              group.rows.length > 0 ? (
                <section
                  className={styles.group}
                  data-tone={group.tone}
                  key={group.key}
                >
                  <h3 className={styles.groupTitle}>
                    {group.label}
                    <span>{group.rows.length}</span>
                  </h3>
                  <ol className={styles.groupList}>
                    {group.rows.map((outcome) => {
                      const question = questionFor(outcome);
                      return (
                        <li key={outcome.questionId}>
                          <Link
                            className={styles.groupLink}
                            to={lessonRouteFor(outcome.questionId)}
                          >
                            <strong>
                              {question?.prompt ?? outcome.questionId}
                            </strong>
                            <span>Open the recall stop</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              ) : null,
            )}
          </div>

          <div className={styles.resultActions}>
            <Link className={styles.primaryLink} to="/">
              Return to Today
            </Link>
            <ArrowLink to="/review">Go to review</ArrowLink>
            <ArrowLink to="/interview">Interview practice</ArrowLink>
          </div>
        </PageSection>
      </Page>
    );
  }

  if (milestone.status === 'pending' || !attempt) {
    return (
      <Page>
        <PageHeader
          aside={
            <span className={styles.headerChip}>
              <TrophyIcon /> {milestone.kind === 'level-end' ? 'Level gate' : 'Milestone'}
            </span>
          }
          deck={
            milestone.kind === 'level-end'
              ? `You finished every published lesson in ${level?.manifest.title ?? milestone.levelId}. This quiz samples the ideas that should still be warm.`
              : 'Five lessons are behind you. This quiz mixes their recall questions, weighted toward what is weak, overdue, or needed next.'
          }
          kicker="Assessment / Milestone"
          title="A short check, not a final exam."
        />

        <PageSection index="01" label="Before you start" tone="teal">
          <div className={styles.overview}>
            <div>
              <p className={styles.overviewLead}>
                {milestone.kind === 'level-end' ? 12 : 8} questions, capped by
                the pool.
              </p>
              <p className={styles.overviewText}>
                No timer pressure and no fake proctor. Answers are checked
                locally, wrong answers link back to the exact recall stop, and
                an in-progress attempt survives a refresh.
              </p>
            </div>
            <dl className={styles.overviewFacts}>
              <div>
                <dt>Scope</dt>
                <dd>{pluralize(milestone.lessonIds.length, 'lesson')}</dd>
              </div>
              <div>
                <dt>Weighting</dt>
                <dd>Overdue, wrong, prerequisite</dd>
              </div>
              <div>
                <dt>Gate</dt>
                <dd>None. Learning stays open.</dd>
              </div>
            </dl>
          </div>
          <div className={styles.resultActions}>
            <Button
              variant="primary"
              onClick={() => startMilestone(milestone.id)}
            >
              Start the quiz
            </Button>
            <ArrowLink to="/java">Not yet</ArrowLink>
          </div>
        </PageSection>
      </Page>
    );
  }

  if (!activeOutcome || !activeQuestion) {
    return (
      <Page>
        <PageHeader
          kicker="Assessment"
          title="This question is no longer in the catalog."
          deck="The attempt is kept, but the content it points at has changed. Start from the roadmap instead."
        />
        <ArrowLink to="/java">Back to the trail</ArrowLink>
      </Page>
    );
  }

  const answeredCount = attempt.questions.filter(
    (outcome) => outcome.correct !== null,
  ).length;

  function resolveQuestion(answer: QuestionAnswer, correct: boolean): void {
    if (!attempt || !activeOutcome) {
      return;
    }
    const nextAttempt: QuizAttempt = {
      ...attempt,
      questions: attempt.questions.map((outcome) =>
        outcome.questionId === activeOutcome.questionId
          ? {
              ...outcome,
              correct,
              response: serializeAnswer(answer),
            }
          : outcome,
      ),
    };
    saveQuizAttempt(nextAttempt);
    setResolved(true);
  }

  function nextQuestion(): void {
    setResolved(false);
    setActiveIndex((value) => value + 1);
  }

  function finish(): void {
    if (!attempt) {
      return;
    }
    completeQuiz(attempt.id, attempt.questions);
  }

  return (
    <Page>
      <PageHeader
        aside={
          <div className={styles.headerStat}>
            <span>
              {answeredCount} / {attempt.questions.length}
            </span>
            <small>answered</small>
          </div>
        }
        deck="One question at a time. The result screen separates solid recall from material that needs another pass."
        kicker={milestone.kind === 'level-end' ? 'Level gate' : 'Milestone quiz'}
        title={level?.manifest.title ?? 'Checkpoint'}
      />

      <PageSection index="01" label={`Question ${activeIndex + 1} of ${attempt.questions.length}`} tone="teal">
        <div className={styles.progressTrack} aria-hidden="true">
          <span
            style={{
              width: `${((activeIndex + 1) / attempt.questions.length) * 100}%`,
            }}
          />
        </div>

        {resumeComplete ? (
          <div className={styles.allAnswered}>
            <p className={styles.nextKicker}>Every question is answered</p>
            <p className={styles.nextText}>
              This attempt was saved before it was closed. Finish it to see the
              breakdown and keep the milestone on the record.
            </p>
          </div>
        ) : (
          <QuestionPractice
            key={`${attempt.id}-${activeIndex}`}
            question={activeQuestion}
            onResolved={resolveQuestion}
          />
        )}

        {resolved ? (
          <Reveal className={styles.nextPanel}>
            <div>
              <p className={styles.nextKicker}>
                {isLast ? 'Last question answered' : 'Answer recorded'}
              </p>
              <p className={styles.nextText}>
                {isLast
                  ? 'Finish to see the breakdown and the exact places to revisit.'
                  : 'Take the next question when you are ready. The attempt is saved.'}
              </p>
            </div>
            <Button
              variant="primary"
              onClick={isLast ? finish : nextQuestion}
            >
              {isLast ? 'See the result' : 'Next question'}
            </Button>
          </Reveal>
        ) : null}

        <div className={styles.sessionFooter}>
          <p className={styles.sessionNote}>
            <SparkIcon /> The attempt persists locally. Leaving and returning
            resumes at the first unanswered question.
          </p>
          <Link className={styles.quietLink} to="/">
            Exit to Today
          </Link>
        </div>
      </PageSection>
    </Page>
  );
}
