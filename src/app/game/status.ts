import type { LessonStatus, LevelStatus } from '@/lib/state/derive.js';

export const LESSON_STATUS_LABEL: Record<LessonStatus, string> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  done: 'Done',
  mastered: 'Mastered',
};

export const LEVEL_STATUS_LABEL: Record<LevelStatus, string> = {
  unstarted: 'Not started',
  'in-progress': 'In progress',
  mastered: 'Mastered',
};

export function lessonStatusHint(status: LessonStatus): string {
  switch (status) {
    case 'in-progress':
      return 'You have opened this lesson in the notebook.';
    case 'done':
      return 'Marked done. Recall and the build are separate signals.';
    case 'mastered':
      return 'All three notebook signals are present: done, recall, and build.';
    case 'not-started':
      return 'No notebook activity on this lesson yet.';
  }
}
