import { describe, expect, it } from 'vitest';
import { createEmptyUserState } from '../src/lib/state/initial.js';
import {
  createBackup,
  parseBackupText,
  serializeBackup,
} from '../src/lib/storage/backup.js';

const FIXED_DATE = new Date('2026-01-02T10:00:00.000Z');

describe('backup format', () => {
  it('round-trips a complete user state through JSON', () => {
    const state = createEmptyUserState({ now: FIXED_DATE });
    const text = serializeBackup(createBackup(state, FIXED_DATE));
    const parsed = parseBackupText(text);

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.state).toEqual(state);
      expect(parsed.exportedAt).toBe(FIXED_DATE.toISOString());
    }
  });

  it('rejects a file that is not JSON', () => {
    const parsed = parseBackupText('this is not json');
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.message).toContain('not valid JSON');
    }
  });

  it('rejects a state with an unknown field', () => {
    const state = createEmptyUserState({ now: FIXED_DATE });
    const text = JSON.stringify({
      format: 'foundation.backup',
      formatVersion: 1,
      exportedAt: FIXED_DATE.toISOString(),
      state: {
        ...state,
        injected: true,
      },
    });
    const parsed = parseBackupText(text);

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.issues.some((issue) => issue.includes('injected'))).toBe(
        true,
      );
    }
  });

  it('rejects an envelope with the wrong format marker', () => {
    const state = createEmptyUserState({ now: FIXED_DATE });
    const text = JSON.stringify({
      format: 'something.else',
      formatVersion: 1,
      exportedAt: FIXED_DATE.toISOString(),
      state,
    });
    const parsed = parseBackupText(text);

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.message).toContain('not a FOUNDATION backup');
    }
  });
});
