/**
 * Deterministic shuffle for answer options and ordered steps. The seed is the
 * question ID, so the same question presents the same arrangement on every
 * visit without leaking the authored order in the source.
 */
export function shuffleForQuestion<T extends { readonly id: string }>(
  items: readonly T[],
  seedText: string,
): readonly T[] {
  let seed = 0;
  for (let index = 0; index < seedText.length; index += 1) {
    seed = (seed * 31 + seedText.charCodeAt(index)) >>> 0;
  }

  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
    const swap = seed % (index + 1);
    const value = next[index];
    const other = next[swap];
    if (value && other) {
      next[index] = other;
      next[swap] = value;
    }
  }
  return next;
}
