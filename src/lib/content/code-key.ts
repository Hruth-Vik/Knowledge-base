/**
 * Stable, synchronous key for a highlighted code block. The build script and
 * the browser must compute the same key without sharing a runtime hash library.
 */
export function codeBlockKey(language: string, code: string): string {
  let hash = 0x811c9dc5;
  const input = `${language}\n${code}`;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `${language}:${(hash >>> 0).toString(16).padStart(8, '0')}:${code.length}`;
}
