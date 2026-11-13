import type { ConceptRegistry } from '../concepts/registry.js';
import type { ContentCatalog } from '../content/types.js';
import type { Question } from '../schema/question.js';
import type { UserStateV1 } from '../state/schema.js';

export type QuizKind = 'milestone' | 'level-gate';

export interface QuizCandidate {
  readonly question: Question;
  readonly lessonId: string;
  readonly weight: number;
}

export interface SelectQuestionsOptions {
  readonly catalog: ContentCatalog;
  readonly state: UserStateV1;
  readonly scopeLessonIds: readonly string[];
  readonly kind: QuizKind;
  readonly now?: Date;
  readonly seed?: number;
  readonly size?: number;
}

export interface QuestionSelection {
  readonly candidates: readonly QuizCandidate[];
  readonly selected: readonly QuizCandidate[];
}

const DAY_MS = 86_400_000;

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function latestQuizOutcome(
  state: UserStateV1,
  questionId: string,
): { correct: boolean | null; at: string } | null {
  let latest: { correct: boolean | null; at: string } | null = null;

  for (const attempt of state.quizzes) {
    const outcome = attempt.questions.find(
      (candidate) => candidate.questionId === questionId,
    );
    if (!outcome) {
      continue;
    }
    const at = attempt.completedAt ?? attempt.startedAt;
    if (!latest || at > latest.at) {
      latest = { correct: outcome.correct, at };
    }
  }

  return latest;
}

function lastExposure(
  state: UserStateV1,
  questionId: string,
): string | null {
  const card = state.review.cards[questionId];
  const quiz = latestQuizOutcome(state, questionId);
  const times = [card?.lastReviewedAt ?? null, quiz?.at ?? null].filter(
    (value): value is string => value !== null,
  );
  return times.sort().at(-1) ?? null;
}

function exposureCount(state: UserStateV1, questionId: string): number {
  const reviewCount = state.review.logs.filter(
    (log) => log.questionId === questionId,
  ).length;
  const quizCount = state.quizzes.reduce(
    (total, attempt) =>
      total +
      attempt.questions.filter(
        (outcome) =>
          outcome.questionId === questionId && outcome.correct !== null,
      ).length,
    0,
  );
  return reviewCount + quizCount;
}

function isConceptDecaying(card: {
  phase: string;
  lastRating: number | null;
}): boolean {
  return (
    card.phase === 'relearning' ||
    (card.lastRating !== null && card.lastRating <= 2)
  );
}

function prerequisiteOfNextLesson(
  registry: ConceptRegistry,
  questionConcepts: readonly string[],
  nextLessonConceptIds: readonly string[],
): boolean {
  for (const conceptId of nextLessonConceptIds) {
    const dependencies = registry.traceDependencies(conceptId);
    if (
      dependencies.some((dependency) =>
        questionConcepts.includes(dependency.id),
      )
    ) {
      return true;
    }
  }
  return false;
}

function nextLessonConcepts(
  catalog: ContentCatalog,
  state: UserStateV1,
  language: string,
): readonly string[] {
  const published = catalog.languages
    .find((entry) => entry.manifest.id === language)
    ?.levels.flatMap((level) => level.chapters.flatMap((chapter) => chapter.lessons));

  const next = published?.find(
    (record) => !state.lessons[record.lesson.id]?.doneAt,
  );
  return next?.lesson.concepts.map((concept) => concept.id) ?? [];
}

export function weightQuestion(
  question: Question,
  registry: ConceptRegistry,
  state: UserStateV1,
  prerequisites: readonly string[],
  now: Date,
): number {
  let weight = 1;

  const card = state.review.cards[question.id];
  const due = card !== undefined && Date.parse(card.dueAt) <= now.getTime();
  const decaying = card !== undefined && isConceptDecaying(card);
  if (due || decaying) {
    weight += 1;
  }

  const quiz = latestQuizOutcome(state, question.id);
  const wrong =
    quiz?.correct === false ||
    (card?.lastRating !== null &&
      card?.lastRating !== undefined &&
      card.lastRating <= 2);
  if (wrong) {
    weight += 0.8;
  }

  if (prerequisiteOfNextLesson(registry, question.concepts, prerequisites)) {
    weight += 0.6;
  }

  const exposure = lastExposure(state, question.id);
  if (
    exposure !== null &&
    now.getTime() - Date.parse(exposure) >= 14 * DAY_MS
  ) {
    weight += 0.4;
  }

  if (question.concepts.some((conceptId) => exposureCount(state, conceptId) < 2)) {
    weight += 0.2;
  }

  return weight;
}

export function buildCandidates(
  options: SelectQuestionsOptions,
): readonly QuizCandidate[] {
  const now = options.now ?? new Date();
  const state = options.state;
  const registry = options.catalog.concepts;

  const language =
    options.catalog.languages.find((entry) =>
      entry.levels.some((level) =>
        level.chapters.some((chapter) =>
          chapter.lessons.some((record) =>
            options.scopeLessonIds.includes(record.lesson.id),
          ),
        ),
      ),
    )?.manifest.id ?? 'java';

  const prerequisites = nextLessonConcepts(
    options.catalog,
    state,
    language,
  );

  const candidates: QuizCandidate[] = [];
  for (const lessonId of options.scopeLessonIds) {
    const record = options.catalog.lessons.find(
      (entry) => entry.lesson.id === lessonId,
    );
    if (!record) {
      continue;
    }
    for (const question of record.lesson.recallCheck) {
      candidates.push({
        question,
        lessonId,
        weight: weightQuestion(
          question,
          registry,
          state,
          prerequisites,
          now,
        ),
      });
    }
  }

  return candidates;
}

function hasDifferentType(
  selected: readonly QuizCandidate[],
  candidate: QuizCandidate,
): boolean {
  return selected.some(
    (entry) => entry.question.type !== candidate.question.type,
  );
}

export function selectQuestions(
  options: SelectQuestionsOptions,
): QuestionSelection {
  const candidates = buildCandidates(options);
  const size = Math.min(
    options.size ?? (options.kind === 'level-gate' ? 12 : 8),
    candidates.length,
  );
  const random = mulberry32(options.seed ?? 1);
  const remaining = [...candidates];
  const selected: QuizCandidate[] = [];
  const conceptCounts = new Map<string, number>();

  const canTake = (candidate: QuizCandidate): boolean =>
    candidate.question.concepts.every(
      (conceptId) => (conceptCounts.get(conceptId) ?? 0) < 2,
    );

  while (selected.length < size) {
    const pool = remaining.filter(canTake);
    if (pool.length === 0) {
      break;
    }

    const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
    let target = random() * total;
    let picked = pool[0];
    for (const entry of pool) {
      target -= entry.weight;
      if (target <= 0) {
        picked = entry;
        break;
      }
    }
    if (!picked) {
      break;
    }

    selected.push(picked);
    remaining.splice(remaining.indexOf(picked), 1);
    for (const conceptId of picked.question.concepts) {
      conceptCounts.set(conceptId, (conceptCounts.get(conceptId) ?? 0) + 1);
    }
  }

  // Prefer at least two question forms when the pool allows it. Swap the last
  // pick for a different kind instead of failing the whole selection.
  if (selected.length >= 2) {
    const types = new Set(selected.map((entry) => entry.question.type));
    if (types.size < 2) {
      const replacement = remaining.find(
        (candidate) =>
          hasDifferentType(selected, candidate) &&
          candidate.question.concepts.every(
            (conceptId) => (conceptCounts.get(conceptId) ?? 0) < 2,
          ),
      );
      if (replacement) {
        const dropped = selected.at(-1);
        if (dropped) {
          selected[selected.length - 1] = replacement;
          remaining.push(dropped);
        }
      }
    }
  }

  return { candidates, selected };
}
