const longDate = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const shortDate = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const monthAndYear = new Intl.DateTimeFormat(undefined, {
  month: 'long',
  year: 'numeric',
});

export function formatLongDate(date: Date = new Date()): string {
  return longDate.format(date);
}

export function formatShortDate(date: Date): string {
  return shortDate.format(date);
}

export function formatMonthYear(date: Date): string {
  return monthAndYear.format(date);
}

export function formatDateKey(key: string): string {
  const [year, month, day] = key.split('-').map(Number);
  if (!year || !month || !day) {
    return key;
  }
  return shortDate.format(new Date(year, month - 1, day, 12));
}

export function formatMinutes(seconds: number): string {
  if (seconds < 60) {
    return 'Less than a minute';
  }
  const minutes = Math.round(seconds / 60);
  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
}

const clockTime = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
});

export function formatClockTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : clockTime.format(date);
}

export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
