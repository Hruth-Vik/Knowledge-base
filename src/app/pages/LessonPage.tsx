import { useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { catalog } from '@/lib/content/catalog.js';
import { deriveLessonStatus } from '@/lib/state/derive.js';
import type { RecallAnswerInput } from '@/lib/state/lesson.js';
import { useAppStore } from '../store.js';
import { ArrowLink } from '../ui/ArrowLink.js';
import { Page } from '../ui/Page.js';
import { PageHeader } from '../ui/PageHeader.js';
import { LessonJourney } from '../lesson/LessonJourney.js';
import styles from './LessonPage.module.css';

export function LessonPage() {
  const { levelId, lessonSlug } = useParams<{
    levelId: string;
    lessonSlug: string;
  }>();
  const data = useAppStore((state) => state.data);
  const visitLesson = useAppStore((state) => state.visitLesson);
  const setLessonDone = useAppStore((state) => state.setLessonDone);
  const recordRecallAttempt = useAppStore((state) => state.recordRecallAttempt);
  const saveExerciseDraft = useAppStore((state) => state.saveExerciseDraft);
  const setExerciseRubricCheck = useAppStore(
    (state) => state.setExerciseRubricCheck,
  );
  const setExercisePassed = useAppStore((state) => state.setExercisePassed);

  const java = catalog.languages.find(
    (language) => language.manifest.id === 'java',
  );
  const level = java?.levels.find(
    (candidate) => candidate.manifest.id === levelId,
  );
  const lessonRecords =
    level?.chapters.flatMap((chapter) => chapter.lessons) ?? [];
  const recordIndex = lessonRecords.findIndex(
    (candidate) => candidate.lesson.slug === lessonSlug,
  );
  const record = recordIndex >= 0 ? lessonRecords[recordIndex] : undefined;

  const lessonId = record?.lesson.id;
  const progress = lessonId ? data.lessons[lessonId] : undefined;

  useEffect(() => {
    if (lessonId) {
      visitLesson(lessonId);
    }
  }, [lessonId, visitLesson]);

  const handleDone = useCallback(
    (done: boolean) => {
      if (lessonId) {
        setLessonDone(lessonId, done);
      }
    },
    [lessonId, setLessonDone],
  );
  const handleRecall = useCallback(
    (answers: readonly RecallAnswerInput[]) => {
      if (lessonId) {
        recordRecallAttempt(lessonId, answers);
      }
    },
    [lessonId, recordRecallAttempt],
  );
  const handleSaveDraft = useCallback(
    (draft: string) => {
      if (lessonId) {
        saveExerciseDraft(lessonId, draft);
      }
    },
    [lessonId, saveExerciseDraft],
  );
  const handleRubric = useCallback(
    (rubricId: string, checked: boolean) => {
      if (lessonId) {
        setExerciseRubricCheck(lessonId, rubricId, checked);
      }
    },
    [lessonId, setExerciseRubricCheck],
  );
  const handleExercisePassed = useCallback(
    (passed: boolean) => {
      if (lessonId) {
        setExercisePassed(lessonId, passed);
      }
    },
    [lessonId, setExercisePassed],
  );

  if (!level || !record) {
    return (
      <Page>
        <PageHeader
          kicker="Curriculum / Java"
          title="Lesson not found"
          deck="This lesson is not part of the compiled Java curriculum."
        />
        <div className={styles.missing}>
          <ArrowLink to={levelId ? `/java/${levelId}` : '/java'}>
            {levelId ? 'Return to the level brief' : 'Return to the roadmap'}
          </ArrowLink>
        </div>
      </Page>
    );
  }

  const lesson = record.lesson;
  const nextRecord = lessonRecords[recordIndex + 1];
  const nextLesson = nextRecord
    ? {
        title: nextRecord.lesson.title,
        to: `/java/${level.manifest.id}/${nextRecord.lesson.slug}`,
      }
    : null;

  return (
    <Page>
      <LessonJourney
        lesson={lesson}
        levelId={level.manifest.id}
        levelNumber={String(level.manifest.index).padStart(2, '0')}
        levelTitle={level.manifest.title}
        nextLesson={nextLesson}
        onRecordRecall={handleRecall}
        onSaveDraft={handleSaveDraft}
        onSetPassed={handleExercisePassed}
        onToggleDone={handleDone}
        onToggleRubric={handleRubric}
        progress={progress}
        status={deriveLessonStatus(progress)}
      />
    </Page>
  );
}
