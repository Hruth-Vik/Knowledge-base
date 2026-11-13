import {
  getActivityLevel,
  hasRecordedActivity,
  recentDateKeys,
} from '@/lib/state/activity.js';
import type { ActivityDay } from '@/lib/state/schema.js';
import { formatDateKey, formatMinutes, pluralize } from '../format.js';
import styles from './ActivityHeatmap.module.css';

interface ActivityHeatmapProps {
  readonly activity: Readonly<Record<string, ActivityDay>>;
  readonly restDays: readonly string[];
}

const WINDOW_DAYS = 84;

export function ActivityHeatmap({
  activity,
  restDays,
}: ActivityHeatmapProps) {
  const days = recentDateKeys(WINDOW_DAYS);
  const restSet = new Set(restDays);
  const activeDays = days.filter((key) =>
    hasRecordedActivity(activity[key]),
  ).length;
  const restDaysInWindow = days.filter(
    (key) => !hasRecordedActivity(activity[key]) && restSet.has(key),
  ).length;

  const summary =
    activeDays === 0
      ? 'No activity recorded in the last twelve weeks.'
      : `${pluralize(activeDays, 'active day')} in the last twelve weeks${
          restDaysInWindow > 0
            ? `, with ${pluralize(restDaysInWindow, 'rest day')} marked`
            : ''
        }.`;

  return (
    <figure className={styles.figure}>
      <div className={styles.grid} aria-hidden="true">
        {days.map((key) => {
          const day = activity[key];
          const level = getActivityLevel(day);
          const isRest = level === 0 && restSet.has(key);
          const label = isRest
            ? `${formatDateKey(key)} — rest day`
            : level === 0
              ? `${formatDateKey(key)} — no record`
              : `${formatDateKey(key)} — ${formatMinutes(day?.secondsOnLearning ?? 0)}, ${pluralize(day?.lessonIdsCompleted.length ?? 0, 'lesson')} done`;

          return (
            <span
              className={[
                styles.cell,
                styles[`level${level}`],
                isRest ? styles.rest : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={key}
              title={label}
            />
          );
        })}
      </div>

      <figcaption className={styles.caption}>
        <span>{summary}</span>
        <span className={styles.legend} aria-hidden="true">
          <span>Less</span>
          <span className={`${styles.key} ${styles.level0}`} />
          <span className={`${styles.key} ${styles.level1}`} />
          <span className={`${styles.key} ${styles.level2}`} />
          <span className={`${styles.key} ${styles.level3}`} />
          <span>More</span>
          <span className={`${styles.key} ${styles.restKey}`} />
          <span>Rest</span>
        </span>
      </figcaption>
    </figure>
  );
}
