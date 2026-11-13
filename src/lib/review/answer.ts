import type { Question } from '../schema/question.js';

export interface QuestionAnswer {
  readonly selectedOptionId?: string;
  readonly text?: string;
  readonly lineNumber?: number;
  readonly order?: readonly string[];
  readonly keyChecks?: readonly boolean[];
  readonly blanks?: Readonly<Record<string, string>>;
}

function normalize(value: string): string {
  return value
    .replaceAll('\\n', '\n')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

function normalizedLoose(value: string): string {
  return normalize(value).replace(/\s+/g, ' ').toLowerCase();
}

function outputMatches(question: Extract<Question, { type: 'predict-output' }>, value: string): boolean {
  const expected = normalize(value);
  const candidates = [question.expectedOutput, ...(question.acceptedOutputs ?? [])];
  return candidates.some((candidate) => {
    const normalized = normalize(candidate);
    return (
      normalized === expected ||
      normalized.replace(/\s+/g, ' ').toLowerCase() ===
        expected.replace(/\s+/g, ' ').toLowerCase()
    );
  });
}

export function answerIsComplete(
  question: Question,
  answer: QuestionAnswer,
): boolean {
  if (question.type === 'multiple-choice') {
    return Boolean(answer.selectedOptionId);
  }
  if (question.type === 'order-the-steps') {
    return (answer.order?.length ?? 0) === question.items.length;
  }
  if (question.type === 'spot-the-bug') {
    return Boolean(answer.lineNumber);
  }
  if (question.type === 'fill-the-code') {
    return question.blanks.every((blank) => {
      const value = answer.blanks?.[blank.id] ?? '';
      return value.trim().length > 0;
    });
  }
  if (question.type === 'explain') {
    return (answer.text?.trim().length ?? 0) >= 20;
  }
  return (answer.text?.trim().length ?? 0) > 0;
}

export function gradeAnswer(
  question: Question,
  answer: QuestionAnswer,
): boolean {
  switch (question.type) {
    case 'multiple-choice':
      return answer.selectedOptionId === question.correctOptionId;
    case 'predict-output':
      return outputMatches(question, answer.text ?? '');
    case 'spot-the-bug':
      return answer.lineNumber === question.bugLine;
    case 'order-the-steps':
      return (
        answer.order?.length === question.correctOrder.length &&
        answer.order.every(
          (value, index) => value === question.correctOrder[index],
        )
      );
    case 'fill-the-code':
      return question.blanks.every((blank) =>
        blank.acceptedAnswers.some(
          (accepted) =>
            normalizedLoose(accepted) ===
            normalizedLoose(answer.blanks?.[blank.id] ?? ''),
        ),
      );
    case 'explain':
      return (
        answer.keyChecks?.length === question.keyPoints.length &&
        answer.keyChecks.every(Boolean)
      );
  }
}

export function emptyAnswer(): QuestionAnswer {
  return {};
}
