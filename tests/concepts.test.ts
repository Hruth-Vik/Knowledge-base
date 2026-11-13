import { describe, expect, it } from 'vitest';
import {
  ConceptRegistry,
  type RegisteredConcept,
} from '../src/lib/concepts/registry.js';
import type { Concept } from '../src/lib/schema/concept.js';

function concept(
  id: string,
  relations: Concept['relations'] = [],
  language = 'java',
): RegisteredConcept {
  return {
    id,
    title: id,
    kind: 'mechanism',
    summary: ['One.', 'Two.', 'Three.'],
    aliases: [],
    tags: ['test'],
    relations,
    owner: {
      language,
      levelId: `${language}.l0`,
      levelIndex: 0,
      lessonId: `${language}.l0.sample`,
      lessonSequence: 1,
      chapterId: 'sample',
    },
  };
}

describe('concept registry', () => {
  it('rejects a depends-on cycle', () => {
    const result = ConceptRegistry.build([
      concept('java.test.a', [{ type: 'depends-on', target: 'java.test.b' }]),
      concept('java.test.b', [{ type: 'depends-on', target: 'java.test.a' }]),
    ]);

    expect(
      result.errors.some((error) => error.code === 'dependency-cycle'),
    ).toBe(true);
  });

  it('traces dependencies from a node back through first principles', () => {
    const result = ConceptRegistry.build([
      concept('java.test.a', [{ type: 'depends-on', target: 'java.test.b' }]),
      concept('java.test.b', [{ type: 'depends-on', target: 'java.test.c' }]),
      concept('java.test.c'),
    ]);

    expect(result.errors).toHaveLength(0);
    expect(
      result.registry
        .traceDependencies('java.test.a')
        .map((entry) => entry.id),
    ).toEqual(['java.test.b', 'java.test.c']);
  });

  it('reports relations that cross language boundaries', () => {
    const result = ConceptRegistry.build([
      concept('java.test.a', [
        { type: 'contrasts-with', target: 'python.test.b' },
      ]),
      concept('python.test.b', [], 'python'),
    ]);

    expect(
      result.errors.some(
        (error) => error.code === 'cross-language-relation',
      ),
    ).toBe(true);
  });
});
