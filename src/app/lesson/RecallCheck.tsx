import { useMemo, useState } from 'react';
import {
  answerIsComplete,
  gradeAnswer,
  type QuestionAnswer,
} from '@/lib/review/answer.js';
import { shuffleForQuestion } from '@/lib/review/shuffle.js';
import type { LessonContent } from '@/lib/schema/lesson.js';
import type { Question } from '@/lib/schema/question.js';
import type { LessonProgress } from '@/lib/state/schema.js';
import type { RecallAnswerInput } from '@/lib/state/lesson.js';
import { Button } from '../ui/Button.js';
import { CodeBlock } from './CodeBlock.js';
import { Markdown } from './Markdown.js';
import styles from './RecallCheck.module.css';

type RecallQuestions = LessonContent['recallCheck'];
type RecallDraft = {
  readonly selectedOption: string;
  readonly text: string;
  readonly lineNumber: string;
  readonly order: readonly string[];
  readonly blanks: Readonly<Record<string, string>>;
  readonly keyChecks: readonly boolean[];
};

interface RecallCheckProps {
  readonly questions: RecallQuestions;
  readonly progress: LessonProgress | undefined;
  readonly onRecord: (answers: readonly RecallAnswerInput[]) => void;
}

function createDraft(question: Question): RecallDraft {
  return {
    selectedOption: '',
    text: '',
    lineNumber: '',
    order: [],
    blanks: {},
    keyChecks:
      question.type === 'explain'
        ? question.keyPoints.map(() => false)
        : [],
  };
}

function createDrafts(questions: RecallQuestions): Record<string, RecallDraft> {
  return Object.fromEntries(
    questions.map((question) => [question.id, createDraft(question)]),
  );
}

function toAnswer(draft: RecallDraft): QuestionAnswer {
  const lineNumber = Number.parseInt(draft.lineNumber, 10);
  return {
    selectedOptionId: draft.selectedOption || undefined,
    text: draft.text,
    lineNumber: Number.isFinite(lineNumber) ? lineNumber : undefined,
    order: draft.order,
    keyChecks: draft.keyChecks,
    blanks: draft.blanks,
  };
}

function draftResponse(
  question: Question,
  draft: RecallDraft | undefined,
): string | null {
  if (!draft) {
    return null;
  }
  if (question.type === 'multiple-choice') {
    return draft.selectedOption || null;
  }
  if (question.type === 'order-the-steps') {
    return draft.order.length > 0 ? draft.order.join(' > ') : null;
  }
  if (question.type === 'spot-the-bug') {
    return draft.lineNumber ? `line ${draft.lineNumber}` : null;
  }
  if (question.type === 'fill-the-code') {
    const filled = Object.entries(draft.blanks).filter(
      ([, value]) => value.trim().length > 0,
    );
    return filled.length > 0
      ? filled.map(([id, value]) => `${id}=${value}`).join(', ')
      : null;
  }
  return draft.text.trim() || null;
}

function questionTypeLabel(question: Question): string {
  switch (question.type) {
    case 'multiple-choice':
      return 'Choose one';
    case 'predict-output':
      return 'Predict the output';
    case 'explain':
      return 'Explain in your own words';
    case 'spot-the-bug':
      return 'Find the bug';
    case 'order-the-steps':
      return 'Order the steps';
    case 'fill-the-code':
      return 'Fill the code';
  }
}

function CodeTemplate({
  question,
  values,
  onChange,
  disabled,
}: {
  readonly question: Extract<Question, { type: 'fill-the-code' }>;
  readonly values: Readonly<Record<string, string>>;
  readonly onChange: (blankId: string, value: string) => void;
  readonly disabled: boolean;
}) {
  const parts = question.template.split(/(\{\{\s*[a-z0-9-]+\s*\}\})/g);

  return (
    <pre className={styles.template}>
      {parts.map((part, index) => {
        const match = part.match(/\{\{\s*([a-z0-9-]+)\s*\}\}/);
        if (!match) {
          return <span key={index}>{part}</span>;
        }
        const blankId = match[1] ?? '';
        return (
          <input
            aria-label={`Blank ${blankId}`}
            className={styles.blank}
            key={`${blankId}-${index}`}
            onChange={(event) => onChange(blankId, event.target.value)}
            spellCheck={false}
            value={values[blankId] ?? ''}
            disabled={disabled}
          />
        );
      })}
    </pre>
  );
}

export function RecallCheck({ questions, progress, onRecord }: RecallCheckProps) {
  const [drafts, setDrafts] = useState<Record<string, RecallDraft>>(() =>
    createDrafts(questions),
  );
  const [checked, setChecked] = useState(false);
  const [recorded, setRecorded] = useState(false);

  const allAnswered = questions.every((question) =>
    answerIsComplete(
      question,
      toAnswer(drafts[question.id] ?? createDraft(question)),
    ),
  );
  const results = useMemo(
    () =>
      questions.map((question) =>
        gradeAnswer(
          question,
          toAnswer(drafts[question.id] ?? createDraft(question)),
        ),
      ),
    [drafts, questions],
  );
  const score = results.filter(Boolean).length;
  const passed = score === 3;
  const recallPassed = Boolean(progress?.recall.passedAt);
  const attemptCount = progress?.recall.attempts.length ?? 0;

  function updateDraft(questionId: string, update: Partial<RecallDraft>): void {
    setDrafts((current) => ({
      ...current,
      [questionId]: {
        ...(current[questionId] ?? {
          selectedOption: '',
          text: '',
          lineNumber: '',
          order: [],
          blanks: {},
          keyChecks: [],
        }),
        ...update,
      },
    }));
  }

  function toggleKeyPoint(questionId: string, index: number): void {
    const question = questions.find((candidate) => candidate.id === questionId);
    const draft = drafts[questionId];
    if (question?.type !== 'explain' || !draft) {
      return;
    }
    updateDraft(questionId, {
      keyChecks: draft.keyChecks.map((value, keyIndex) =>
        keyIndex === index ? !value : value,
      ),
    });
  }

  function toggleOrder(questionId: string, itemId: string): void {
    const draft = drafts[questionId];
    if (!draft) {
      return;
    }
    updateDraft(questionId, {
      order: draft.order.includes(itemId)
        ? draft.order.filter((value) => value !== itemId)
        : [...draft.order, itemId],
    });
  }

  function updateBlank(questionId: string, blankId: string, value: string): void {
    const draft = drafts[questionId];
    if (!draft) {
      return;
    }
    updateDraft(questionId, {
      blanks: { ...draft.blanks, [blankId]: value },
    });
  }

  function recordAttempt(): void {
    onRecord(
      questions.map((question, index) => ({
        questionId: question.id,
        conceptIds: question.concepts,
        correct: results[index] ?? false,
        response: draftResponse(question, drafts[question.id]),
      })),
    );
    setRecorded(true);
  }

  function reset(): void {
    setDrafts(createDrafts(questions));
    setChecked(false);
    setRecorded(false);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.statusRow}>
        <div>
          <p className={styles.lead}>
            Three questions. All three must be correct for the recall check to
            pass. The explain question is self-marked against the key points.
          </p>
          <p className={styles.attemptMeta}>
            {attemptCount === 0
              ? 'No attempt recorded yet.'
              : `${attemptCount} attempt${attemptCount === 1 ? '' : 's'} recorded.`}
          </p>
        </div>
        <span
          className={[styles.status, recallPassed ? styles.statusPassed : '']
            .filter(Boolean)
            .join(' ')}
        >
          {recallPassed ? 'Recall passed' : 'Recall open'}
        </span>
      </div>

      <ol className={styles.questions}>
        {questions.map((question, index) => {
          const draft = drafts[question.id] ?? createDraft(question);
          const isCorrect = results[index] ?? false;

          return (
            <li className={styles.question} key={question.id}>
              <div className={styles.questionHead}>
                <span className={styles.questionIndex}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className={styles.questionType}>
                    {questionTypeLabel(question)}
                  </p>
                  <Markdown className={styles.prompt}>{question.prompt}</Markdown>
                </div>
                {checked ? (
                  <span
                    className={[
                      styles.questionResult,
                      question.type === 'explain'
                        ? isCorrect
                          ? styles.correct
                          : styles.pending
                        : isCorrect
                          ? styles.correct
                          : styles.incorrect,
                    ].join(' ')}
                  >
                    {question.type === 'explain'
                      ? isCorrect
                        ? 'All points marked'
                        : 'Self-mark below'
                      : isCorrect
                        ? 'Correct'
                        : 'Incorrect'}
                  </span>
                ) : null}
              </div>

              {question.type === 'multiple-choice' ? (
                <fieldset
                  className={styles.options}
                  aria-label="Choose one answer"
                  disabled={checked || recorded}
                >
                  {question.options.map((option) => {
                    const selected = draft.selectedOption === option.id;
                    const correctOption = option.id === question.correctOptionId;
                    const showCorrect = checked && correctOption;
                    const showWrong = checked && selected && !correctOption;

                    return (
                      <label
                        className={[
                          styles.option,
                          selected ? styles.selected : '',
                          showCorrect ? styles.optionCorrect : '',
                          showWrong ? styles.optionWrong : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        key={option.id}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option.id}
                          checked={selected}
                          onChange={() =>
                            updateDraft(question.id, {
                              selectedOption: option.id,
                            })
                          }
                        />
                        <span className={styles.optionText}>{option.text}</span>
                        {showCorrect ? (
                          <span className={styles.optionVerdict}>Correct answer</span>
                        ) : showWrong ? (
                          <span className={styles.optionVerdict}>Your answer</span>
                        ) : null}
                      </label>
                    );
                  })}
                </fieldset>
              ) : null}

              {question.type === 'predict-output' ? (
                <div className={styles.answerField}>
                  <CodeBlock
                    code={question.code}
                    filename="PredictOutput.java"
                    language={question.codeLanguage}
                  />
                  <label className={styles.inputLabel} htmlFor={`${question.id}-output`}>
                    Your predicted output
                  </label>
                  <textarea
                    className={styles.outputInput}
                    id={`${question.id}-output`}
                    value={draft.text}
                    onChange={(event) =>
                      updateDraft(question.id, { text: event.target.value })
                    }
                    disabled={checked || recorded}
                    rows={5}
                    spellCheck={false}
                    placeholder={'before\ninitialized\n...'}
                  />
                </div>
              ) : null}

              {question.type === 'spot-the-bug' ? (
                <div className={styles.answerField}>
                  <CodeBlock
                    code={question.code}
                    filename="Broken.java"
                    language={question.codeLanguage}
                  />
                  <label
                    className={styles.inputLabel}
                    htmlFor={`${question.id}-line`}
                  >
                    Which line holds the bug?
                  </label>
                  <input
                    className={styles.lineInput}
                    disabled={checked || recorded}
                    id={`${question.id}-line`}
                    min={1}
                    onChange={(event) =>
                      updateDraft(question.id, {
                        lineNumber: event.target.value,
                      })
                    }
                    type="number"
                    value={draft.lineNumber}
                  />
                </div>
              ) : null}

              {question.type === 'order-the-steps' ? (
                <div className={styles.answerField}>
                  <p className={styles.inputLabel}>
                    Click the steps in the order the machine performs them.
                  </p>
                  <div className={styles.orderPool}>
                    {shuffleForQuestion(question.items, question.id).map(
                      (item) => {
                        const position = draft.order.indexOf(item.id);
                        return (
                          <button
                            className={styles.orderItem}
                            data-picked={position >= 0}
                            disabled={checked || recorded}
                            key={item.id}
                            onClick={() => toggleOrder(question.id, item.id)}
                            type="button"
                          >
                            <span className={styles.orderIndex}>
                              {position >= 0 ? position + 1 : '+'}
                            </span>
                            {item.text}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              ) : null}

              {question.type === 'fill-the-code' ? (
                <div className={styles.answerField}>
                  <CodeTemplate
                    disabled={checked || recorded}
                    onChange={(blankId, value) =>
                      updateBlank(question.id, blankId, value)
                    }
                    question={question}
                    values={draft.blanks}
                  />
                </div>
              ) : null}

              {question.type === 'explain' ? (
                <div className={styles.answerField}>
                  <label className={styles.inputLabel} htmlFor={`${question.id}-explain`}>
                    Your explanation
                  </label>
                  <textarea
                    className={styles.textInput}
                    id={`${question.id}-explain`}
                    value={draft.text}
                    onChange={(event) =>
                      updateDraft(question.id, { text: event.target.value })
                    }
                    disabled={checked || recorded}
                    rows={6}
                    placeholder="Name the mechanism, then the failure it produces."
                  />

                  {checked ? (
                    <div className={styles.selfMark}>
                      <p className={styles.selfMarkTitle}>
                        Tick the points you actually made. Be strict; this is the
                        only self-marked part.
                      </p>
                      <ul className={styles.keyPoints}>
                        {question.keyPoints.map((point, pointIndex) => (
                          <li key={point}>
                            <label className={styles.keyPoint}>
                              <input
                                type="checkbox"
                                checked={draft.keyChecks[pointIndex] ?? false}
                                onChange={() =>
                                  toggleKeyPoint(question.id, pointIndex)
                                }
                                disabled={recorded}
                              />
                              <span>{point}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {checked ? (
                <details className={styles.reveal}>
                  <summary>Why this is the answer</summary>
                  {question.type === 'predict-output' ? (
                    <div className={styles.expected}>
                      <p className={styles.expectedLabel}>Expected output</p>
                      <pre>{question.expectedOutput}</pre>
                    </div>
                  ) : null}
                  {question.type === 'spot-the-bug' ? (
                    <div className={styles.expected}>
                      <p className={styles.expectedLabel}>The bug</p>
                      <p className={styles.answerLine}>
                        Line {question.bugLine}: {question.bugSummary}
                      </p>
                    </div>
                  ) : null}
                  {question.type === 'order-the-steps' ? (
                    <div className={styles.expected}>
                      <p className={styles.expectedLabel}>Correct order</p>
                      <ol className={styles.correctOrder}>
                        {question.correctOrder.map((id) => (
                          <li key={id}>
                            {question.items.find((item) => item.id === id)
                              ?.text ?? id}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null}
                  {question.type === 'fill-the-code' ? (
                    <div className={styles.expected}>
                      <p className={styles.expectedLabel}>Accepted answers</p>
                      <ul className={styles.correctOrder}>
                        {question.blanks.map((blank) => (
                          <li key={blank.id}>
                            <strong>{blank.id}</strong>:{' '}
                            {blank.acceptedAnswers.join(' / ')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {question.type === 'explain' ? (
                    <div className={styles.modelAnswer}>
                      <p className={styles.modelAnswerLabel}>Model answer</p>
                      <Markdown>{question.modelAnswer}</Markdown>
                    </div>
                  ) : null}
                  <Markdown>{question.explanation}</Markdown>
                </details>
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className={styles.actions}>
        {!checked ? (
          <>
            <Button
              variant="primary"
              onClick={() => setChecked(true)}
              disabled={!allAnswered}
            >
              Check my answers
            </Button>
            <p className={styles.actionNote}>
              {allAnswered
                ? 'Answers are checked locally. Nothing leaves this browser.'
                : 'Answer all three questions to check them.'}
            </p>
          </>
        ) : !recorded ? (
          <>
            <Button variant="primary" onClick={recordAttempt}>
              Record attempt — {score} / 3
            </Button>
            <Button onClick={reset}>Start over</Button>
            <p className={styles.actionNote}>
              {passed
                ? 'This attempt passes recall.'
                : 'Recall passes only at 3 / 3. You can try again.'}
            </p>
          </>
        ) : (
          <>
            <p
              className={[styles.recorded, passed ? styles.recordedPass : ''].join(
                ' ',
              )}
              role="status"
            >
              {passed
                ? 'Attempt recorded: 3 / 3. Recall is passed.'
                : `Attempt recorded: ${score} / 3. Review the answers and try again.`}
            </p>
            <Button onClick={reset}>Try again</Button>
          </>
        )}
      </div>
    </div>
  );
}
