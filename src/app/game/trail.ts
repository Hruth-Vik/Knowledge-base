import { catalog } from '@/lib/content/catalog.js';
import { toneForLevel } from '../progress.js';

/**
 * The trail is a pure projection of the compiled Java curriculum. Positions are
 * presentation data; every title, deck, count, and route below comes from the
 * catalog. Nothing in this file invents curriculum or progress.
 */

export type TrailTone = ReturnType<typeof toneForLevel>;

export type BiomeDecorKind =
  | 'reed'
  | 'rock'
  | 'flower'
  | 'crate'
  | 'probe'
  | 'post';

export interface BiomeDecor {
  readonly id: string;
  readonly kind: BiomeDecorKind;
  readonly x: number;
  readonly scale: number;
  readonly tone: TrailTone;
}

export interface TrailConcept {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly stageId: string;
  readonly stageIndex: number;
  readonly stageSequence: number;
  readonly levelId: string;
  readonly levelIndex: number;
  readonly x: number;
  readonly height: number;
  readonly indexInStage: number;
}

export interface TrailStage {
  readonly id: string;
  readonly lessonId: string;
  readonly slug: string;
  readonly title: string;
  readonly deck: string;
  readonly kind: string;
  readonly estimatedMinutes: number;
  readonly levelId: string;
  readonly levelIndex: number;
  readonly levelTitle: string;
  readonly chapterTitle: string;
  readonly sequence: number;
  readonly globalIndex: number;
  readonly tone: TrailTone;
  readonly x: number;
  readonly route: string;
  readonly concepts: readonly TrailConcept[];
}

export interface TrailBiome {
  readonly levelId: string;
  readonly index: number;
  readonly title: string;
  readonly deck: string;
  readonly tone: TrailTone;
  readonly start: number;
  readonly end: number;
  readonly width: number;
  readonly hasLessons: boolean;
  readonly lessonCount: number;
  readonly conceptCount: number;
  readonly lessonIds: readonly string[];
  readonly stages: readonly TrailStage[];
  readonly decor: readonly BiomeDecor[];
}

export interface TrailWorld {
  readonly width: number;
  readonly startX: number;
  readonly biomes: readonly TrailBiome[];
  readonly stages: readonly TrailStage[];
  readonly concepts: readonly TrailConcept[];
  readonly stageCount: number;
  readonly conceptCount: number;
}

const BIOME_HEAD = 400;
const BIOME_TAIL = 280;
const STAGE_GAP = 208;
const EMPTY_BIOME_WIDTH = 820;
const MIN_STAGE_BIOME_WIDTH = 980;
const PLAYER_START_X = 260;
const CONCEPT_SPREAD = 74;
const CONCEPT_HEIGHTS = [142, 208, 170, 224, 154, 190] as const;
const DECOR_KINDS: readonly BiomeDecorKind[] = [
  'reed',
  'rock',
  'flower',
  'crate',
  'probe',
  'post',
];

const JAVA = catalog.languages.find((language) => language.manifest.id === 'java');

function buildDecor(
  width: number,
  levelIndex: number,
  tone: TrailTone,
): BiomeDecor[] {
  const count = Math.max(4, Math.round(width / 118));
  const usable = Math.max(1, width - 64);

  return Array.from({ length: count }, (_, itemIndex) => {
    const kind =
      DECOR_KINDS[(itemIndex * 2 + levelIndex) % DECOR_KINDS.length] ?? 'reed';
    return {
      id: `decor-${levelIndex}-${itemIndex}`,
      kind,
      x: 32 + ((itemIndex * 137 + levelIndex * 53) % usable),
      scale: 0.72 + ((itemIndex + levelIndex) % 4) * 0.1,
      tone,
    };
  });
}

export function buildTrailWorld(): TrailWorld {
  const levels = [...(JAVA?.levels ?? [])].sort(
    (left, right) => left.manifest.index - right.manifest.index,
  );

  const biomes: TrailBiome[] = [];
  const stages: TrailStage[] = [];
  const concepts: TrailConcept[] = [];
  let cursor = 0;
  let globalStageIndex = 0;

  for (const level of levels) {
    const lessonRecords = level.chapters
      .flatMap((chapter) =>
        chapter.lessons.map((record) => ({ chapter, record })),
      )
      .sort(
        (left, right) =>
          left.record.lesson.sequence - right.record.lesson.sequence,
      );

    const width =
      lessonRecords.length === 0
        ? EMPTY_BIOME_WIDTH
        : Math.max(
            MIN_STAGE_BIOME_WIDTH,
            BIOME_HEAD +
              (lessonRecords.length - 1) * STAGE_GAP +
              BIOME_TAIL,
          );
    const start = cursor;
    const end = start + width;
    const tone = toneForLevel(level.manifest.index);
    const levelStages: TrailStage[] = [];
    let levelConceptCount = 0;

    lessonRecords.forEach(({ chapter, record }, lessonIndex) => {
      const stageIndex = globalStageIndex;
      const stageX = start + BIOME_HEAD + lessonIndex * STAGE_GAP;
      const authored = record.lesson.concepts;
      const spread =
        authored.length <= 1
          ? 0
          : Math.min(CONCEPT_SPREAD, 24 + authored.length * 16);
      const step =
        authored.length <= 1 ? 0 : (spread * 2) / (authored.length - 1);

      const stageConcepts = authored.map((concept, conceptIndex) => {
        const conceptX = stageX - spread + step * conceptIndex;
        const height =
          CONCEPT_HEIGHTS[
            (stageIndex * 2 + conceptIndex) % CONCEPT_HEIGHTS.length
          ] ?? 160;
        const trailConcept: TrailConcept = {
          id: concept.id,
          title: concept.title,
          summary: concept.summary[0] ?? '',
          stageId: record.lesson.id,
          stageIndex,
          stageSequence: record.lesson.sequence,
          levelId: level.manifest.id,
          levelIndex: level.manifest.index,
          x: conceptX,
          height,
          indexInStage: conceptIndex,
        };
        concepts.push(trailConcept);
        return trailConcept;
      });

      const stage: TrailStage = {
        id: record.lesson.id,
        lessonId: record.lesson.id,
        slug: record.lesson.slug,
        title: record.lesson.title,
        deck: record.lesson.deck,
        kind: record.lesson.kind,
        estimatedMinutes: record.lesson.estimatedMinutes,
        levelId: level.manifest.id,
        levelIndex: level.manifest.index,
        levelTitle: level.manifest.title,
        chapterTitle: chapter.title,
        sequence: record.lesson.sequence,
        globalIndex: stageIndex,
        tone,
        x: stageX,
        route: `/java/${level.manifest.id}/${record.lesson.slug}`,
        concepts: stageConcepts,
      };

      levelConceptCount += stageConcepts.length;
      levelStages.push(stage);
      stages.push(stage);
      globalStageIndex += 1;
    });

    biomes.push({
      levelId: level.manifest.id,
      index: level.manifest.index,
      title: level.manifest.title,
      deck: level.manifest.deck,
      tone,
      start,
      end,
      width,
      hasLessons: lessonRecords.length > 0,
      lessonCount: lessonRecords.length,
      conceptCount: levelConceptCount,
      lessonIds: lessonRecords.map(({ record }) => record.lesson.id),
      stages: levelStages,
      decor: buildDecor(width, level.manifest.index, tone),
    });

    cursor = end;
  }

  return {
    width: cursor,
    startX: Math.min(PLAYER_START_X, Math.max(48, cursor - 120)),
    biomes,
    stages,
    concepts,
    stageCount: stages.length,
    conceptCount: concepts.length,
  };
}

export const trailWorld = buildTrailWorld();
