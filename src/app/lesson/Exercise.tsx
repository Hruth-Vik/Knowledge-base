import { useEffect, useState } from 'react';
import type { LessonContent } from '@/lib/schema/lesson.js';
import type { LessonProgress } from '@/lib/state/schema.js';
import { formatClockTime } from '../format.js';
import { Button } from '../ui/Button.js';
import { CodeBlock } from './CodeBlock.js';
import { Markdown } from './Markdown.js';
import styles from './Exercise.module.css';

type ExerciseContent = LessonContent['sections']['writeFromScratch'];

interface ExerciseProps {
  readonly exercise: ExerciseContent;
  readonly progress: LessonProgress | undefined;
  readonly onSaveDraft: (draft: string) => void;
  readonly onToggleRubric: (rubricId: string, checked: boolean) => void;
  readonly onSetPassed: (passed: boolean) => void;
}

const AUTOSAVE_DELAY = 800;

export function Exercise({
  exercise,
  progress,
  onSaveDraft,
  onToggleRubric,
  onSetPassed,
}: ExerciseProps) {
  const persistedDraft = progress?.exercise.draft ?? '';
  const [draft, setDraft] = useState(persistedDraft);
  const [savedAt, setSavedAt] = useState(progress?.exercise.lastSavedAt ?? null);

  useEffect(() => {
    if (draft === persistedDraft) {
      return;
    }

    const timer = window.setTimeout(() => {
      onSaveDraft(draft);
      setSavedAt(new Date().toISOString());
    }, AUTOSAVE_DELAY);

    return () => window.clearTimeout(timer);
  }, [draft, persistedDraft, onSaveDraft]);

  const checks = progress?.exercise.rubricChecks ?? {};
  const passed = Boolean(progress?.exercise.passedAt);
  const required = exercise.rubric.filter((item) => item.mustPass);
  const remaining = required.filter((item) => !checks[item.id]).length;

  function handleRubric(rubricId: string, mustPass: boolean, checked: boolean): void {
    onToggleRubric(rubricId, checked);
    if (passed && mustPass && !checked) {
      onSetPassed(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.briefRow}>
        <div>
          <h3 className={styles.title}>{exercise.title}</h3>
          <Markdown>{exercise.brief}</Markdown>
        </div>
        <span
          className={[styles.status, passed ? styles.statusPassed : '']
            .filter(Boolean)
            .join(' ')}
        >
          {passed ? 'Exercise complete' : 'Exercise open'}
        </span>
      </div>

      <div className={styles.constraints}>
        <p className={styles.subhead}>Constraints</p>
        <ul className={styles.constraintList}>
          {exercise.constraints.map((constraint) => (
            <li key={constraint}>{constraint}</li>
          ))}
        </ul>
      </div>

      <div className={styles.starter}>
        <p className={styles.subhead}>Starter file</p>
        <CodeBlock
          code={exercise.starterCode.code}
          filename={exercise.starterCode.filename}
          language={exercise.starterCode.language}
        />
      </div>

      <div className={styles.editor}>
        <div className={styles.editorHead}>
          <label className={styles.inputLabel} htmlFor="exercise-draft">
            Your draft
          </label>
          <span className={styles.saveState}>
            {savedAt
              ? `Saved locally at ${formatClockTime(savedAt)}`
              : 'Not saved yet'}
          </span>
        </div>
        <textarea
          className={styles.textarea}
          id="exercise-draft"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={16}
          maxLength={100_000}
          spellCheck={false}
          placeholder="Write the Java program here. This editor stores plain text; it does not compile or run code."
        />
        <p className={styles.editorNote}>
          The draft is stored in this browser only. FOUNDATION does not compile
          Java in the browser, and will not pretend to.
        </p>
      </div>

      <div className={styles.rubric}>
        <div className={styles.rubricHead}>
          <div>
            <p className={styles.subhead}>Rubric</p>
            <p className={styles.rubricLead}>
              {remaining === 0
                ? 'All required checks are marked. The exercise can be completed.'
                : `${remaining} required check${remaining === 1 ? '' : 's'} still open.`}
            </p>
          </div>
          <Button
            variant="primary"
            disabled={remaining !== 0 || passed}
            onClick={() => onSetPassed(true)}
          >
            {passed ? 'Exercise complete' : 'Mark exercise complete'}
          </Button>
        </div>

        <ul className={styles.rubricList}>
          {exercise.rubric.map((item) => {
            const checked = Boolean(checks[item.id]);
            return (
              <li className={styles.rubricItem} key={item.id}>
                <label className={styles.rubricLabel}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) =>
                      handleRubric(item.id, item.mustPass, event.target.checked)
                    }
                  />
                  <span className={styles.rubricCheck}>
                    {item.check}
                    {item.mustPass ? (
                      <span className={styles.required}>Required</span>
                    ) : null}
                  </span>
                </label>
                <Markdown className={styles.rubricDetail}>
                  {item.detail}
                </Markdown>
              </li>
            );
          })}
        </ul>
      </div>

      <details className={styles.solution}>
        <summary>Reference solution and verification</summary>
        <div className={styles.solutionBody}>
          <CodeBlock
            code={exercise.referenceSolution.code}
            filename={exercise.referenceSolution.filename}
            language={exercise.referenceSolution.language}
            annotations={exercise.referenceSolution.annotations}
          />
          <div className={styles.verify}>
            <p className={styles.subhead}>Verify it yourself</p>
            <ol className={styles.verifyList}>
              {exercise.verification.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </details>
    </div>
  );
}
