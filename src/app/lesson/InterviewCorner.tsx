import { useState } from 'react';
import type { LessonContent } from '@/lib/schema/lesson.js';
import { Markdown } from './Markdown.js';
import styles from './InterviewCorner.module.css';

type InterviewContent = LessonContent['sections']['interviewCorner'];
type InterviewQuestion = InterviewContent['questions'][number];

interface InterviewCornerProps {
  readonly corner: InterviewContent;
}

const DIFFICULTY_TONE: Record<InterviewQuestion['difficulty'], string | undefined> = {
  junior: styles.junior,
  mid: styles.mid,
  senior: styles.senior,
};

const SELF_SCORE_LABEL = {
  '': 'Not scored',
  shaky: 'Shaky',
  nearly: 'Nearly there',
  ready: 'Interview-ready',
} as const;

export function InterviewCorner({ corner }: InterviewCornerProps) {
  const [scores, setScores] = useState<Record<string, string>>({});

  return (
    <div className={styles.wrap}>
      <Markdown className={styles.intro}>{corner.intro}</Markdown>
      <p className={styles.practiceNote}>
        Practice scores stay in this session. They are not part of lesson
        progress.
      </p>

      <ol className={styles.list}>
        {corner.questions.map((question) => (
          <li key={question.id}>
            <details className={styles.question}>
              <summary className={styles.summary}>
                <span
                  className={[
                    styles.difficulty,
                    DIFFICULTY_TONE[question.difficulty],
                  ].join(' ')}
                >
                  {question.difficulty}
                </span>
                <span className={styles.questionText}>{question.question}</span>
                <span className={styles.openLabel} aria-hidden="true">
                  Open answer
                </span>
              </summary>

              <div className={styles.answerBody}>
                <div className={styles.answerGrid}>
                  <div className={styles.answerWeak}>
                    <p className={styles.answerLabel}>Weak answer</p>
                    <Markdown className={styles.answerMarkdown}>
                      {question.weakAnswer}
                    </Markdown>
                  </div>
                  <div className={styles.answerStrong}>
                    <p className={styles.answerLabel}>Strong answer</p>
                    <Markdown className={styles.answerMarkdown}>
                      {question.strongAnswer}
                    </Markdown>
                  </div>
                </div>

                <div className={styles.modelAnswer}>
                  <p className={styles.answerLabel}>Model answer</p>
                  <Markdown className={styles.answerMarkdown}>
                    {question.modelAnswer}
                  </Markdown>
                </div>

                <p className={styles.followUp}>
                  <span>Follow-up</span>
                  {question.followUp}
                </p>

                <div className={styles.selfScore}>
                  <label htmlFor={`${question.id}-score`}>
                    Score your spoken answer
                  </label>
                  <select
                    id={`${question.id}-score`}
                    value={scores[question.id] ?? ''}
                    onChange={(event) =>
                      setScores((current) => ({
                        ...current,
                        [question.id]: event.target.value,
                      }))
                    }
                  >
                    {Object.entries(SELF_SCORE_LABEL).map(([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </details>
          </li>
        ))}
      </ol>
    </div>
  );
}
