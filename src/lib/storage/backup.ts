import { z } from 'zod';
import {
  BackupEnvelopeSchema,
  UserStateV1Schema,
  type BackupEnvelope,
  type UserStateV1,
} from '../state/schema.js';

export type BackupParseResult =
  | {
      readonly ok: true;
      readonly state: UserStateV1;
      readonly exportedAt: string;
    }
  | {
      readonly ok: false;
      readonly message: string;
      readonly issues: readonly string[];
    };

export function createBackup(
  state: UserStateV1,
  exportedAt: Date = new Date(),
): BackupEnvelope {
  return BackupEnvelopeSchema.parse({
    format: 'foundation.backup',
    formatVersion: 1,
    exportedAt: exportedAt.toISOString(),
    state,
  });
}

export function serializeBackup(backup: BackupEnvelope): string {
  return `${JSON.stringify(backup, null, 2)}\n`;
}

export function parseBackupText(text: string): BackupParseResult {
  let value: unknown;

  try {
    value = JSON.parse(text);
  } catch {
    return {
      ok: false,
      message: 'The selected file is not valid JSON.',
      issues: [],
    };
  }

  const parsed = BackupEnvelopeSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      message:
        'The file is not a FOUNDATION backup, or its state does not match this version.',
      issues: parsed.error.issues.slice(0, 8).map(formatIssue),
    };
  }

  const state = UserStateV1Schema.parse(parsed.data.state);
  return {
    ok: true,
    state,
    exportedAt: parsed.data.exportedAt,
  };
}

function formatIssue(issue: z.ZodIssue): string {
  const path = issue.path.length > 0 ? issue.path.join('.') : 'state';
  return `${path}: ${issue.message}`;
}

export function createBackupFilename(date: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const stamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join('');
  return `foundation-backup-${stamp}.json`;
}
