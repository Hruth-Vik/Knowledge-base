import type { Concept, RelationshipType } from '../schema/concept.js';

export interface ConceptOwner {
  readonly language: string;
  readonly levelId: string;
  readonly levelIndex: number;
  readonly lessonId: string;
  readonly lessonSequence: number;
  readonly chapterId: string;
}

export interface RegisteredConcept extends Concept {
  readonly owner: ConceptOwner;
}

export interface ConceptRegistryError {
  readonly code:
    | 'duplicate-concept'
    | 'unknown-relation-target'
    | 'cross-language-relation'
    | 'dependency-cycle';
  readonly message: string;
  readonly conceptId: string;
}

export interface ConceptRegistryBuildResult {
  readonly registry: ConceptRegistry;
  readonly errors: readonly ConceptRegistryError[];
}

export class ConceptRegistry {
  readonly #byId: ReadonlyMap<string, RegisteredConcept>;
  readonly #byLesson: ReadonlyMap<string, readonly RegisteredConcept[]>;
  readonly #byLanguage: ReadonlyMap<string, readonly RegisteredConcept[]>;

  private constructor(concepts: readonly RegisteredConcept[]) {
    const byId = new Map<string, RegisteredConcept>();
    const byLesson = new Map<string, RegisteredConcept[]>();
    const byLanguage = new Map<string, RegisteredConcept[]>();

    for (const concept of concepts) {
      byId.set(concept.id, concept);

      const lessonConcepts = byLesson.get(concept.owner.lessonId) ?? [];
      lessonConcepts.push(concept);
      byLesson.set(concept.owner.lessonId, lessonConcepts);

      const languageConcepts = byLanguage.get(concept.owner.language) ?? [];
      languageConcepts.push(concept);
      byLanguage.set(concept.owner.language, languageConcepts);
    }

    this.#byId = byId;
    this.#byLesson = byLesson;
    this.#byLanguage = byLanguage;
  }

  static build(concepts: readonly RegisteredConcept[]): ConceptRegistryBuildResult {
    const errors: ConceptRegistryError[] = [];
    const sorted = [...concepts].sort(compareConcepts);
    const byId = new Map<string, RegisteredConcept>();

    for (const concept of sorted) {
      if (byId.has(concept.id)) {
        errors.push({
          code: 'duplicate-concept',
          conceptId: concept.id,
          message: `Concept "${concept.id}" is declared more than once.`,
        });
      } else {
        byId.set(concept.id, concept);
      }
    }

    for (const concept of sorted) {
      for (const relation of concept.relations) {
        const target = byId.get(relation.target);
        if (!target) {
          errors.push({
            code: 'unknown-relation-target',
            conceptId: concept.id,
            message: `"${concept.id}" has a ${relation.type} relationship to unknown concept "${relation.target}".`,
          });
        } else if (target.owner.language !== concept.owner.language) {
          errors.push({
            code: 'cross-language-relation',
            conceptId: concept.id,
            message: `"${concept.id}" cannot relate across languages to "${relation.target}".`,
          });
        }
      }
    }

    const cyclePath = findDependencyCycle(sorted, byId);
    if (cyclePath) {
      errors.push({
        code: 'dependency-cycle',
        conceptId: cyclePath[0] ?? 'unknown',
        message: `depends-on relationships must be acyclic. Found: ${cyclePath.join(' -> ')}.`,
      });
    }

    return {
      registry: new ConceptRegistry(sorted),
      errors,
    };
  }

  get(id: string): RegisteredConcept | undefined {
    return this.#byId.get(id);
  }

  require(id: string): RegisteredConcept {
    const concept = this.#byId.get(id);
    if (!concept) {
      throw new Error(`Concept "${id}" is not present in the registry.`);
    }
    return concept;
  }

  all(): readonly RegisteredConcept[] {
    return [...this.#byId.values()];
  }

  forLesson(lessonId: string): readonly RegisteredConcept[] {
    return this.#byLesson.get(lessonId) ?? [];
  }

  forLanguage(language: string): readonly RegisteredConcept[] {
    return this.#byLanguage.get(language) ?? [];
  }

  related(id: string, type?: RelationshipType): readonly RegisteredConcept[] {
    const concept = this.#byId.get(id);
    if (!concept) {
      return [];
    }

    return concept.relations
      .filter((relation) => type === undefined || relation.type === type)
      .map((relation) => this.#byId.get(relation.target))
      .filter((target): target is RegisteredConcept => target !== undefined);
  }

  /**
   * Transitive depends-on closure, ordered from the selected concept outward.
   * This powers "trace a concept" without including contrast or implementation
   * edges, which do not explain first principles.
   */
  traceDependencies(id: string): readonly RegisteredConcept[] {
    const visited = new Set<string>([id]);
    const ordered: RegisteredConcept[] = [];

    const visit = (conceptId: string): void => {
      const concept = this.#byId.get(conceptId);
      if (!concept) {
        return;
      }
      for (const relation of concept.relations) {
        if (relation.type !== 'depends-on' || visited.has(relation.target)) {
          continue;
        }
        const dependency = this.#byId.get(relation.target);
        if (!dependency) {
          continue;
        }
        visited.add(dependency.id);
        ordered.push(dependency);
        visit(dependency.id);
      }
    };

    visit(id);
    return ordered;
  }
}

function compareConcepts(a: RegisteredConcept, b: RegisteredConcept): number {
  const language = a.owner.language.localeCompare(b.owner.language);
  if (language !== 0) {
    return language;
  }
  if (a.owner.levelIndex !== b.owner.levelIndex) {
    return a.owner.levelIndex - b.owner.levelIndex;
  }
  if (a.owner.lessonSequence !== b.owner.lessonSequence) {
    return a.owner.lessonSequence - b.owner.lessonSequence;
  }
  return a.id.localeCompare(b.id);
}

function findDependencyCycle(
  concepts: readonly RegisteredConcept[],
  byId: ReadonlyMap<string, RegisteredConcept>,
): readonly string[] | null {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const path: string[] = [];

  const visit = (id: string): readonly string[] | null => {
    if (visiting.has(id)) {
      const cycleStart = path.indexOf(id);
      return [...path.slice(cycleStart), id];
    }
    if (visited.has(id)) {
      return null;
    }

    visiting.add(id);
    path.push(id);

    const concept = byId.get(id);
    if (concept) {
      for (const relation of concept.relations) {
        if (relation.type !== 'depends-on') {
          continue;
        }
        const cycle = visit(relation.target);
        if (cycle) {
          return cycle;
        }
      }
    }

    path.pop();
    visiting.delete(id);
    visited.add(id);
    return null;
  };

  for (const concept of concepts) {
    const cycle = visit(concept.id);
    if (cycle) {
      return cycle;
    }
  }

  return null;
}
