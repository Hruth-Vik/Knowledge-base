import { useMemo, useState } from 'react';
import type { Question } from '@/lib/schema/question.js';
import {
  answerIsComplete,
  gradeAnswer,
  type QuestionAnswer,
} from '@/lib/review/answer.js';
import { shuffleForQuestion } from '@/lib/review/shuffle.js';
import { CodeBlock } from '../lesson/CodeBlock.js';
import { Markdown } from '../lesson/Markdown.js';
import { Button } from '../ui/Button.js';
import styles from './QuestionPractice.module.css';

interface QuestionPracticeProps {
  readonly question: Question;
  readonly onResolved: (answer: QuestionAnswer, correct: boolean) => void;
}

type Stage = 'answering' | 'revealing' | 'graded';

function typeLabel(question: Question): string {
  switch (question.type) {
    case 'multiple-choice':
      return 'Choose one';
    case 'predict-output':
      return 'Predict the output';
    case 'spot-the-bug':
      return 'Find the bug';
    case 'order-the-steps':
      return 'Put it in order';
    case 'explain':
      return 'Explain it';
    case 'fill-the-code':
      return 'Fill the code';
  }
}

function RenderTemplate({
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
            className={styles.blank}
            key={`${blankId}-${index}`}
            aria-label={`Blank ${blankId}`}
            value={values[blankId] ?? ''}
            onChange={(event) => onChange(blankId, event.target.value)}
            disabled={disabled}
            spellCheck={false}
          />
        );
      })}
    </pre>
  );
}

export function QuestionPractice({
  question,
  onResolved,
}: QuestionPracticeProps) {
  const [stage, setStage] = useState<Stage>('answering');
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [text, setText] = useState('');
  const [lineNumber, setLineNumber] = useState('');
  const [order, setOrder] = useState<string[]>([]);
  const [keyChecks, setKeyChecks] = useState<boolean[]>([]);
  const [blanks, setBlanks] = useState<Record<string, string>>({});

  const shuffled = useMemo(
    () =>
      question.type === 'order-the-steps'
        ? shuffleForQuestion(question.items, question.id)
        : [],
    [question],
  );

  const answer: QuestionAnswer = {
    selectedOptionId,
    text,
    lineNumber: Number.parseInt(lineNumber, 10) || undefined,
    order,
    keyChecks,
    blanks,
  };
  const complete = answerIsComplete(question, answer);

  function resolve(overrides: Partial<QuestionAnswer> = {}): void {
    const finalAnswer = { ...answer, ...overrides };
    const correct = gradeAnswer(question, finalAnswer);
    setStage('graded');
    onResolved(finalAnswer, correct);
  }

  function check(): void {
    if (question.type === 'explain') {
      setStage('revealing');
      setKeyChecks(question.keyPoints.map(() => false));
      return;
    }
    resolve();
  }

  function toggleOrder(id: string): void {
    setOrder((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }

  function toggleKeyPoint(index: number): void {
    setKeyChecks((current) =>
      current.map((value, keyIndex) => (keyIndex === index ? !value : value)),
    );
  }

  return (
    <article className={styles.card}>
      <div className={styles.head}>
        <span className={styles.type}>{typeLabel(question)}</span>
        <Markdown className={styles.prompt}>{question.prompt}</Markdown>
      </div>

      {question.type === 'multiple-choice' ? (
        <fieldset
          className={styles.options}
          aria-label="Choose one answer"
          disabled={stage !== 'answering'}
        >
          {question.options.map((option) => {
            const selected = selectedOptionId === option.id;
            const correct = option.id === question.correctOptionId;
            return (
              <label
                className={[
                  styles.option,
                  selected ? styles.selected : '',
                  stage === 'graded' && correct ? styles.optionCorrect : '',
                  stage === 'graded' && selected && !correct
                    ? styles.optionWrong
                    : '',
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
                  onChange={() => setSelectedOptionId(option.id)}
                />
                <span>{option.text}</span>
              </label>
            );
          })}
        </fieldset>
      ) : null}

      {question.type === 'predict-output' ? (
        <div className={styles.stack}>
          <CodeBlock
            code={question.code}
            filename="PredictOutput.java"
            language={question.codeLanguage}
          />
          <label className={styles.label} htmlFor={`${question.id}-output`}>
            Your predicted output
          </label>
          <textarea
            className={styles.textarea}
            id={`${question.id}-output`}
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={stage !== 'answering'}
            rows={5}
            spellCheck={false}
          />
        </div>
      ) : null}

      {question.type === 'spot-the-bug' ? (
        <div className={styles.stack}>
          <CodeBlock
            code={question.code}
            filename="Broken.java"
            language={question.codeLanguage}
          />
          <label className={styles.label} htmlFor={`${question.id}-line`}>
            Which line holds the bug?
          </label>
          <input
            className={styles.lineInput}
            id={`${question.id}-line`}
            type="number"
            min={1}
            value={lineNumber}
            onChange={(event) => setLineNumber(event.target.value)}
            disabled={stage !== 'answering'}
          />
        </div>
      ) : null}

      {question.type === 'order-the-steps' ? (
        <div className={styles.stack}>
          <p className={styles.hint}>
            Click the steps in the order the machine performs them.
          </p>
          <div className={styles.orderPool}>
            {shuffled.map((item) => {
              const position = order.indexOf(item.id);
              return (
                <button
                  className={styles.orderItem}
                  data-picked={position >= 0}
                  key={item.id}
                  type="button"
                  onClick={() => toggleOrder(item.id)}
                  disabled={stage !== 'answering'}
                >
                  <span className={styles.orderIndex}>
                    {position >= 0 ? position + 1 : '+'}
                  </span>
                  {item.text}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {question.type === 'explain' ? (
        <div className={styles.stack}>
          <label className={styles.label} htmlFor={`${question.id}-explain`}>
            Your explanation
          </label>
          <textarea
            className={styles.textarea}
            id={`${question.id}-explain`}
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={stage !== 'answering'}
            rows={7}
            placeholder="Name the mechanism, then the consequence."
          />
        </div>
      ) : null}

      {question.type === 'fill-the-code' ? (
        <div className={styles.stack}>
          <RenderTemplate
            question={question}
            values={blanks}
            onChange={(blankId, value) =>
              setBlanks((current) => ({ ...current, [blankId]: value }))
            }
            disabled={stage !== 'answering'}
          />
        </div>
      ) : null}

      {stage === 'answering' ? (
        <div className={styles.actions}>
          <Button variant="primary" onClick={check} disabled={!complete}>
            Check answer
          </Button>
          <p className={styles.actionNote}>
            {complete
              ? 'Checked locally. Nothing leaves this browser.'
              : 'Finish the answer to check it.'}
          </p>
        </div>
      ) : null}

      {stage === 'revealing' && question.type === 'explain' ? (
        <div className={styles.reveal}>
          <p className={styles.revealLabel}>Model answer</p>
          <Markdown>{question.modelAnswer}</Markdown>
          <p className={styles.selfMark}>
            Tick the points you actually made. Be strict; this is self-marked.
          </p>
          <ul className={styles.keyPoints}>
            {question.keyPoints.map((point, index) => (
              <li key={point}>
                <label className={styles.keyPoint}>
                  <input
                    type="checkbox"
                    checked={keyChecks[index] ?? false}
                    onChange={() => toggleKeyPoint(index)}
                  />
                  <span>{point}</span>
                </label>
              </li>
            ))}
          </ul>
          <Button variant="primary" onClick={() => resolve()}>
            Record self-mark
          </Button>
        </div>
      ) : null}

      {stage === 'graded' ? (
        <div className={styles.reveal}>
          <p className={styles.revealLabel}>Why this is the answer</p>
          {question.type === 'multiple-choice' ? (
            <p className={styles.answerLine}>
              {question.options.find(
                (option) => option.id === question.correctOptionId,
              )?.text ?? ''}
            </p>
          ) : null}
          {question.type === 'predict-output' ? (
            <div className={styles.expected}>
              <p className={styles.expectedLabel}>Expected output</p>
              <pre>{question.expectedOutput}</pre>
            </div>
          ) : null}
          {question.type === 'spot-the-bug' ? (
            <p className={styles.answerLine}>
              Line {question.bugLine}: {question.bugSummary}
            </p>
          ) : null}
          {question.type === 'order-the-steps' ? (
            <ol className={styles.correctOrder}>
              {question.correctOrder.map((id) => (
                <li key={id}>
                  {question.items.find((item) => item.id === id)?.text ?? id}
                </li>
              ))}
            </ol>
          ) : null}
          {question.type === 'fill-the-code' ? (
            <ul className={styles.correctOrder}>
              {question.blanks.map((blank) => (
                <li key={blank.id}>
                  <strong>{blank.id}</strong>:{' '}
                  {blank.acceptedAnswers.join(' / ')}
                </li>
              ))}
            </ul>
          ) : null}
          {question.type === 'explain' ? (
            <Markdown>{question.modelAnswer}</Markdown>
          ) : null}
          <Markdown>{question.explanation}</Markdown>
        </div>
      ) : null}
    </article>
  );
}
