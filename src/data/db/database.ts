import Dexie, { type Table } from 'dexie';
import type { Question } from '@/domain/schemas/question';
import type { QuizSet } from '@/domain/schemas/set';
import type { StudyAttempt, StudySession } from '@/domain/schemas/study';
import type { Preferences } from '@/domain/schemas/preferences';

export const DATABASE_NAME = 'quizeasy';

/**
 * Local-first storage.
 *
 * Every table is versioned so future releases can migrate existing data
 * instead of discarding it. IndexedDB (via Dexie) is the single source of
 * truth for persisted domain data.
 */
export class QuizeasyDatabase extends Dexie {
  declare sets: Table<QuizSet, string>;
  declare questions: Table<Question, string>;
  declare sessions: Table<StudySession, string>;
  declare attempts: Table<StudyAttempt, string>;
  declare preferences: Table<Preferences, string>;

  constructor(name: string = DATABASE_NAME) {
    super(name);

    this.version(1).stores({
      sets: 'id, updatedAt, lastStudiedAt, title',
      questions: 'id, setId, updatedAt, [setId+updatedAt]',
      sessions: 'id, setId, startedAt, completedAt',
      attempts: 'id, sessionId, questionId, answeredAt',
      preferences: 'id',
    });
  }
}

/** Shared application database instance. */
export const database = new QuizeasyDatabase();

/** True when IndexedDB is usable (it is not in some private-browsing modes). */
export function isIndexedDbAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

export class StorageUnavailableError extends Error {
  constructor(
    message = 'Quizeasy could not open its local database. Browsing in private mode or clearing site data can cause this.',
  ) {
    super(message);
    this.name = 'StorageUnavailableError';
  }
}

/** Wraps storage failures in a user-safe error. */
export async function withStorage<T>(operation: () => Promise<T>): Promise<T> {
  if (!isIndexedDbAvailable()) throw new StorageUnavailableError();
  try {
    return await operation();
  } catch (error) {
    if (error instanceof StorageUnavailableError) throw error;
    if (error instanceof Error && /quota/i.test(error.message)) {
      throw new StorageUnavailableError(
        'Your browser storage is full, so Quizeasy could not save this. Export a backup and remove some sets to free space.',
      );
    }
    if (error instanceof Error) throw error;
    throw new StorageUnavailableError();
  }
}
