import type { QuizeasyDatabase } from '@/data/db/database';
import { withStorage } from '@/data/db/database';
import { validateForWrite } from '@/data/db/validation';
import { collectValidRows } from './rows';
import type { AttemptRepository, ListResult, StudyAttemptInput } from './types';
import type { StudyAttempt } from '@/domain/schemas/study';
import { studyAttemptSchema } from '@/domain/schemas/study';
import { createId, nowIso } from '@/lib/utils';

export function createAttemptRepository(
  db: QuizeasyDatabase,
): AttemptRepository {
  return {
    async listBySession(sessionId: string): Promise<ListResult<StudyAttempt>> {
      const rows = await withStorage(() =>
        db.attempts.where('sessionId').equals(sessionId).toArray(),
      );
      const result: ListResult<StudyAttempt> = collectValidRows(
        rows,
        studyAttemptSchema,
        'study attempt',
      );
      result.items.sort((a, b) => a.answeredAt.localeCompare(b.answeredAt));
      return result;
    },

    async listAll(): Promise<ListResult<StudyAttempt>> {
      const rows = await withStorage(() => db.attempts.toArray());
      const result: ListResult<StudyAttempt> = collectValidRows(
        rows,
        studyAttemptSchema,
        'study attempt',
      );
      result.items.sort((a, b) => a.answeredAt.localeCompare(b.answeredAt));
      return result;
    },

    async record(input: StudyAttemptInput): Promise<StudyAttempt> {
      const attempt: StudyAttempt = {
        id: createId(),
        sessionId: input.sessionId,
        questionId: input.questionId,
        presentationMode: input.presentationMode,
        result: input.result,
        answeredAt: nowIso(),
        ...(input.response !== undefined ? { response: input.response } : {}),
        ...(input.selectedChoice !== undefined
          ? { selectedChoice: input.selectedChoice }
          : {}),
      };
      const valid = validateForWrite(
        studyAttemptSchema,
        attempt,
        'study attempt',
      );
      await withStorage(() => db.attempts.put(valid));
      return valid;
    },

    async addExisting(attempts: readonly StudyAttempt[]): Promise<void> {
      if (attempts.length === 0) return;
      const valid = attempts.map((attempt) =>
        validateForWrite(studyAttemptSchema, attempt, 'study attempt'),
      );
      await withStorage(() => db.attempts.bulkPut(valid));
    },

    async removeBySession(sessionId: string): Promise<void> {
      await withStorage(() =>
        db.attempts.where('sessionId').equals(sessionId).delete(),
      );
    },
  };
}
