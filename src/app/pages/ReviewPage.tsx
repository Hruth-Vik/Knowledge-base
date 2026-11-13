import { useState } from 'react';
import { Link } from 'react-router-dom';
import { catalog } from '@/lib/content/catalog.js';
import type { Question } from '@/lib/schema/question.js';
import type { SrsRating } from '@/lib/srs/index.js';
import { getDueCards, reviewReason } from '@/lib/state/review.js';
import { useAppStore } from '../store.js';
import { pluralize } from '../format.js';
import { QuestionPractice } from '../review/QuestionPractice.js';
import { ArrowLink } from '../ui/ArrowLink.js';
import { Button } from '../ui/Button.js';
import { Page } from '../ui/Page.js';
import { PageHeader } from '../ui/PageHeader.js';
import { PageSection } from '../ui/PageSection.js';
import { Reveal } from '../ui/Reveal.js';
import { ReviewIcon, SparkIcon } from '../ui/icons.js';
import styles from './ReviewPage.module.css';

interface SessionItem {
  readonly questionId: string;
  readonly question: Question;
  readonly reason: string;
  readonly conceptTitles: readonly string[];
}

interface ReviewResult {
  readonly questionId: string;
  readonly correct: boolean;
  readonly rating: SrsRating;
}

const RATINGS: readonly {
  readonly rating: SrsRating;
  readonly label: string;
  readonly hint: string;
}[] = [
  { rating: 1, label: 'Again', hint: 'I could not recall it' },
  { rating: 3, label: 'Hard', hint: 'I got there, slowly' },
  { rating: 4, label: 'Good', hint: 'I recalled it cleanly' },
  { rating: 5, label: 'Easy', hint: 'It was immediate' },
];

export function ReviewPage() {
  const data = useAppStore((state) => state.data);
  const gradeReview = useAppStore((state) => state.gradeReview);

  const due = getDueCards(data);
  const [session, setSession] = useState<readonly SessionItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<readonly ReviewResult[]>([]);
  const [resolved, setResolved] = useState<boolean | null>(null);
  const [finished, setFinished] = useState(false);

  function startSession(): void {
    const items = due.flatMap(({ card }) => {
      const reference = catalog.questionsById.get(card.questionId);
      if (!reference || reference.purpose !== 'recall') {
        return [];
      }
      return [
        {
          questionId: card.questionId,
          question: reference.question,
          reason: reviewReason(card),
          conceptTitles: card.conceptIds.map(
            (conceptId) => catalog.concepts.get(conceptId)?.title ?? conceptId,
          ),
        },
      ];
    });
    if (items.length === 0) {
      return;
    }
    setSession(items);
    setIndex(0);
    setResults([]);
    setResolved(null);
    setFinished(false);
  }

  function finishSession(): void {
    setSession(null);
    setFinished(false);
    setIndex(0);
    setResolved(null);
  }

  function rate(rating: SrsRating): void {
    const item = session?.[index];
    if (!item || resolved === null) {
      return;
    }
    gradeReview(item.questionId, rating);
    const nextResults = [
      ...results,
      { questionId: item.questionId, correct: resolved, rating },
    ];
    setResults(nextResults);
    setResolved(null);
    if (index + 1 >= (session?.length ?? 0)) {
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
  }

  const current = session?.[index];
  const reviewed = results.length;
  const recalled = results.filter((entry) => entry.correct).length;

  return (
    <Page>
      <PageHeader
        aside={
          <div className={styles.headerStats}>
            <span>
              <ReviewIcon /> {due.length} due
            </span>
            <span>{Object.keys(data.review.cards).length} cards</span>
          </div>
        }
        deck="A short appointment with what is fading. One question, one honest rating, one small piece of the map warmed back up."
        kicker="Notebook / Review"
        title="Keep it sharp"
      />

      {!session ? (
        <>
          <PageSection index="01" label="The queue" tone="teal">
            <div className={styles.queuePanel}>
              <div className={styles.queueCopy}>
                <p className={styles.queueLead}>
                  {due.length === 0
                    ? 'Nothing is due right now.'
                    : `${pluralize(due.length, 'card')} ready for a visit.`}
                </p>
                <p className={styles.queueText}>
                  {Object.keys(data.review.cards).length === 0
                    ? 'Review cards appear when you record a recall attempt. A correct answer schedules the first review tomorrow; a miss brings it back sooner.'
                    : due.length === 0
                      ? 'The schedule is clear. Cards return when their interval ends; a rest day never creates fake work.'
                      : 'Rate honestly. A weak review moves the concept toward decay on the map without erasing the lesson you already mastered.'}
                </p>
                <div className={styles.queueActions}>
                  <Button
                    variant="primary"
                    onClick={startSession}
                    disabled={due.length === 0}
                  >
                    Start review
                  </Button>
                  <ArrowLink to="/interview">Practise an interview answer</ArrowLink>
                </div>
              </div>

              {due.length > 0 ? (
                <ol className={styles.preview}>
                  {due.slice(0, 5).map(({ card }) => {
                    const reference = catalog.questionsById.get(card.questionId);
                    const title =
                      reference && reference.purpose === 'recall'
                        ? reference.question.prompt
                        : card.questionId;
                    return (
                      <li className={styles.previewItem} key={card.questionId}>
                        <span className={styles.previewDot} aria-hidden="true" />
                        <span>
                          <strong>{title}</strong>
                          <small>{reviewReason(card)}</small>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              ) : null}
            </div>
          </PageSection>

          <PageSection index="02" label="How this works" tone="ochre">
            <div className={styles.facts}>
              <div>
                <p className={styles.factLabel}>Per question</p>
                <p>
                  SM-2 lives on each recall question, not the lesson. One weak
                  answer does not pretend the whole lesson was reviewed.
                </p>
              </div>
              <div>
                <p className={styles.factLabel}>Honest rating</p>
                <p>
                  The scheduler uses your rating and the elapsed interval. It
                  never rewards opening the page.
                </p>
              </div>
              <div>
                <p className={styles.factLabel}>Decay, not erasure</p>
                <p>
                  A failed review can mark a concept as decaying. The lesson’s
                  mastery evidence stays historical.
                </p>
              </div>
            </div>
          </PageSection>
        </>
      ) : finished ? (
        <PageSection index="01" label="Session complete" tone="moss">
          <Reveal className={styles.summary}>
            <span className={styles.summaryIcon} aria-hidden="true">
              <SparkIcon />
            </span>
            <p className={styles.summaryKicker}>Session complete</p>
            <h2 className={styles.summaryTitle}>
              {reviewed} card{reviewed === 1 ? '' : 's'} reviewed.
            </h2>
            <p className={styles.summaryText}>
              {recalled} recalled cleanly, {reviewed - recalled} marked for a
              shorter interval. The queue is now{' '}
              {due.length === 0 ? 'clear' : `${pluralize(due.length, 'card')} deep`}.
            </p>
            <div className={styles.summaryActions}>
              {due.length > 0 ? (
                <Button variant="primary" onClick={startSession}>
                  Review the rest
                </Button>
              ) : (
                <Link className={styles.primaryLink} to="/">
                  Return to Today
                </Link>
              )}
              <Button onClick={finishSession}>Back to the queue</Button>
              <ArrowLink to="/interview">Interview practice</ArrowLink>
            </div>
          </Reveal>
        </PageSection>
      ) : current ? (
        <PageSection index="01" label={`Review ${index + 1} of ${session.length}`} tone="teal">
          <div className={styles.sessionHead}>
            <div>
              <p className={styles.sessionReason}>{current.reason}</p>
              <p className={styles.sessionConcepts}>
                {current.conceptTitles.join(' · ')}
              </p>
            </div>
            <div className={styles.sessionProgress}>
              <span>
                {index + 1} / {session.length}
              </span>
              <div className={styles.progressTrack} aria-hidden="true">
                <span
                  style={{ width: `${((index + 1) / session.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <QuestionPractice
            key={current.questionId}
            question={current.question}
            onResolved={(_answer, correct) => setResolved(correct)}
          />

          {resolved !== null ? (
            <Reveal className={styles.ratingPanel}>
              <div>
                <p className={styles.ratingKicker}>How did that feel?</p>
                <p className={styles.ratingText}>
                  {resolved
                    ? 'You recalled it. Rate the effort honestly.'
                    : 'Not this time. Rate it as a miss so it comes back sooner.'}
                </p>
              </div>
              <div className={styles.ratingButtons}>
                {RATINGS.map((entry) => (
                  <button
                    className={styles.ratingButton}
                    key={entry.rating}
                    type="button"
                    onClick={() => rate(entry.rating)}
                    title={entry.hint}
                  >
                    <strong>{entry.label}</strong>
                    <span>{entry.hint}</span>
                  </button>
                ))}
              </div>
            </Reveal>
          ) : null}

          <div className={styles.sessionFooter}>
            <Button onClick={finishSession}>End session</Button>
          </div>
        </PageSection>
      ) : null}
    </Page>
  );
}
