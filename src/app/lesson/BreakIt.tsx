import { useState } from 'react';
import type { LessonContent } from '@/lib/schema/lesson.js';
import { Button } from '../ui/Button.js';
import { CodeBlock } from './CodeBlock.js';
import { Markdown } from './Markdown.js';
import styles from './BreakIt.module.css';

interface BreakItProps {
  readonly section: LessonContent['sections']['breakIt'];
}

export function BreakIt({ section }: BreakItProps) {
  const [prediction, setPrediction] = useState('');
  const [revealed, setRevealed] = useState(false);

  return (
    <div className={styles.wrap}>
      <h3 className={styles.title}>{section.title}</h3>
      <Markdown>{section.scenario}</Markdown>
      <CodeBlock
        code={section.brokenCode.code}
        filename={section.brokenCode.filename}
        language={section.brokenCode.language}
      />

      <div className={styles.prediction}>
        <Markdown className={styles.predictionPrompt}>
          {section.predictionPrompt}
        </Markdown>
        {!revealed ? (
          <>
            <label className={styles.inputLabel} htmlFor="break-it-prediction">
              Your prediction <span>(not graded, not saved)</span>
            </label>
            <textarea
              className={styles.textarea}
              id="break-it-prediction"
              rows={3}
              value={prediction}
              onChange={(event) => setPrediction(event.target.value)}
              placeholder="Name the first error and the later error."
            />
            <Button variant="primary" onClick={() => setRevealed(true)}>
              Reveal the failure
            </Button>
          </>
        ) : (
          <div className={styles.reveal} role="status">
            <p className={styles.revealLabel}>What happens</p>
            <Markdown>{section.reveal.observed}</Markdown>
            <Markdown>{section.reveal.explanation}</Markdown>
            <div className={styles.repair}>
              <p className={styles.repairLabel}>Repair</p>
              <Markdown>{section.reveal.repair}</Markdown>
            </div>
            {section.reveal.correctedCode ? (
              <CodeBlock
                code={section.reveal.correctedCode.code}
                filename={section.reveal.correctedCode.filename}
                language={section.reveal.correctedCode.language}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
