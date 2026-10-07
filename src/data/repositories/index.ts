import { database, type QuizeasyDatabase } from '@/data/db/database';
import { createSetRepository } from './setRepository';
import { createQuestionRepository } from './questionRepository';
import { createSessionRepository } from './sessionRepository';
import { createAttemptRepository } from './attemptRepository';
import { createPreferencesRepository } from './preferencesRepository';
import type { RepositoryBundle } from './types';

export { NotFoundError } from './setRepository';

/**
 * Builds the repository bundle for a database. Tests create their own isolated
 * database; the app uses the shared one.
 */
export function createRepositories(db: QuizeasyDatabase): RepositoryBundle {
  return {
    sets: createSetRepository(db),
    questions: createQuestionRepository(db),
    sessions: createSessionRepository(db),
    attempts: createAttemptRepository(db),
    preferences: createPreferencesRepository(db),
  };
}

/** Repositories bound to the application database. */
export const repositories: RepositoryBundle = createRepositories(database);

export type {
  AttemptRepository,
  DatabaseCounts,
  ListResult,
  PreferencesRepository,
  QuestionRepository,
  RepositoryBundle,
  SessionRepository,
  SetRepository,
  SetWithStats,
  StudyAttemptInput,
  StudySessionInput,
} from './types';
