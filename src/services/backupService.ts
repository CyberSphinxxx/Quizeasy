import { BACKUP_FORMAT, SCHEMA_VERSION } from '@/domain/constants';
import { formatZodError } from '@/domain/schemas/common';
import { QUESTION_KEYS } from '@/domain/schemas/question';
import { QUIZ_SET_KEYS } from '@/domain/schemas/set';
import type { Question } from '@/domain/schemas/question';
import type { QuizSet } from '@/domain/schemas/set';
import type { StudyAttempt, StudySession } from '@/domain/schemas/study';
import type { Preferences } from '@/domain/schemas/preferences';
import {
  BACKUP_KEYS,
  backupFileSchema,
  type BackupFile,
} from '@/domain/schemas/transfer';
import type { RepositoryBundle } from '@/data/repositories';
import { collectUnknownKeys } from './setTransfer';
import { createId, nowIso } from '@/lib/utils';
import { downloadTextFile } from '@/lib/files';

export interface BackupPayload {
  sets: QuizSet[];
  questions: Question[];
  sessions: StudySession[];
  attempts: StudyAttempt[];
  preferences?: Preferences;
}

export interface RestoreSummary {
  sets: number;
  questions: number;
  sessions: number;
  attempts: number;
  remappedIds: number;
  warnings: string[];
}

/** Reads every persisted record and shapes it into a backup payload. */
export async function collectBackupPayload(
  repositories: RepositoryBundle,
): Promise<BackupPayload> {
  const [sets, questions, sessions, attempts, preferences] = await Promise.all([
    repositories.sets.list(),
    repositories.questions.listAll(),
    repositories.sessions.listAll(),
    repositories.attempts.listAll(),
    repositories.preferences.get(),
  ]);

  return {
    sets: sets.items,
    questions: questions.items,
    sessions: sessions.items,
    attempts: attempts.items,
    preferences,
  };
}

export function buildBackupFile(payload: BackupPayload): BackupFile {
  return {
    format: BACKUP_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: nowIso(),
    sets: payload.sets,
    questions: payload.questions,
    sessions: payload.sessions,
    attempts: payload.attempts,
    ...(payload.preferences ? { preferences: payload.preferences } : {}),
  };
}

export const BACKUP_FILENAME = 'quizeasy-backup.json';

/** Builds and downloads a complete backup. */
export function downloadBackup(payload: BackupPayload): string {
  const file = buildBackupFile(payload);
  downloadTextFile(BACKUP_FILENAME, `${JSON.stringify(file, null, 2)}\n`);
  return BACKUP_FILENAME;
}

export type BackupValidation =
  | { ok: true; file: BackupFile; warnings: string[] }
  | { ok: false; message: string };

export function validateBackupFile(raw: unknown): BackupValidation {
  const result = backupFileSchema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      message: `That file is not a Quizeasy backup. ${formatZodError(result.error)}`,
    };
  }

  const file = result.data;
  if (file.schemaVersion > SCHEMA_VERSION) {
    return {
      ok: false,
      message: `That backup was created by a newer version of Quizeasy (schema ${file.schemaVersion}). Update Quizeasy, then restore it again.`,
    };
  }

  const warnings = collectUnknownKeys(raw, BACKUP_KEYS, 'Backup');
  const questionWarnings = new Set<string>();
  for (const question of file.questions.slice(0, 50)) {
    for (const warning of collectUnknownKeys(
      question,
      QUESTION_KEYS,
      'Question',
    )) {
      questionWarnings.add(warning);
    }
  }
  const setWarnings = new Set<string>();
  for (const set of file.sets.slice(0, 50)) {
    for (const warning of collectUnknownKeys(set, QUIZ_SET_KEYS, 'Set')) {
      setWarnings.add(warning);
    }
  }
  warnings.push(...setWarnings, ...questionWarnings);

  return { ok: true, file, warnings };
}

/**
 * Restores a backup by merging it into the current library.
 *
 * Existing data is never wiped: records whose IDs already exist locally are
 * written under fresh IDs, and references (questions, sessions, attempts) are
 * updated to match.
 */
export async function restoreBackupPayload(
  repositories: RepositoryBundle,
  file: BackupFile,
): Promise<RestoreSummary> {
  const warnings = collectUnknownKeys(file, BACKUP_KEYS, 'Backup');
  let remappedIds = 0;

  const existingSets = new Set(
    (await repositories.sets.list()).items.map((set) => set.id),
  );
  const existingQuestions = await repositories.questions.allIds();
  const existingSessions = new Set(
    (await repositories.sessions.listAll()).items.map((session) => session.id),
  );
  const existingAttempts = new Set(
    (await repositories.attempts.listAll()).items.map((attempt) => attempt.id),
  );

  const setMap = new Map<string, string>();
  const questionMap = new Map<string, string>();
  const sessionMap = new Map<string, string>();
  const now = nowIso();

  const sets: QuizSet[] = file.sets.map((set) => {
    const collision = existingSets.has(set.id) || setMap.has(set.id);
    const id = collision ? createId() : set.id;
    if (collision) remappedIds += 1;
    setMap.set(set.id, id);
    const restored: QuizSet = {
      ...set,
      id,
      schemaVersion: SCHEMA_VERSION,
      updatedAt: now,
    };
    return restored;
  });

  const questions: Question[] = file.questions.map((question) => {
    const collision =
      existingQuestions.has(question.id) || questionMap.has(question.id);
    const id = collision ? createId() : question.id;
    if (collision) remappedIds += 1;
    questionMap.set(question.id, id);
    return {
      ...question,
      id,
      setId: setMap.get(question.setId) ?? question.setId,
      updatedAt: now,
    };
  });

  const sessions: StudySession[] = file.sessions.map((session) => {
    const collision =
      existingSessions.has(session.id) || sessionMap.has(session.id);
    const id = collision ? createId() : session.id;
    if (collision) remappedIds += 1;
    sessionMap.set(session.id, id);

    const remappedPlan = session.plan?.map((item) => ({
      ...item,
      questionId: questionMap.get(item.questionId) ?? item.questionId,
    }));

    return {
      ...session,
      id,
      setId: setMap.get(session.setId) ?? session.setId,
      itemIds: session.itemIds.map(
        (questionId) => questionMap.get(questionId) ?? questionId,
      ),
      ...(remappedPlan ? { plan: remappedPlan } : {}),
    };
  });

  const attempts: StudyAttempt[] = file.attempts.map((attempt) => {
    const collision = existingAttempts.has(attempt.id);
    const id = collision ? createId() : attempt.id;
    if (collision) remappedIds += 1;
    return {
      ...attempt,
      id,
      sessionId: sessionMap.get(attempt.sessionId) ?? attempt.sessionId,
      questionId: questionMap.get(attempt.questionId) ?? attempt.questionId,
    };
  });

  for (const set of sets) {
    await repositories.sets.createWithId(set);
  }
  await repositories.questions.addExisting(questions);
  await repositories.sessions.addExisting(sessions);
  await repositories.attempts.addExisting(attempts);
  if (file.preferences) {
    await repositories.preferences.save(file.preferences);
  }

  return {
    sets: sets.length,
    questions: questions.length,
    sessions: sessions.length,
    attempts: attempts.length,
    remappedIds,
    warnings,
  };
}
