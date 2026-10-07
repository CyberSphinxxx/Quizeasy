import type { QuizeasyDatabase } from '@/data/db/database';
import { withStorage } from '@/data/db/database';
import { validateForWrite } from '@/data/db/validation';
import { collectValidRows } from './rows';
import type { ListResult, SessionRepository, StudySessionInput } from './types';
import type { StudySession } from '@/domain/schemas/study';
import { studySessionSchema } from '@/domain/schemas/study';
import { createId, nowIso } from '@/lib/utils';

export function createSessionRepository(
  db: QuizeasyDatabase,
): SessionRepository {
  const read = async (rows: unknown[]): Promise<ListResult<StudySession>> => {
    const result = collectValidRows(rows, studySessionSchema, 'study session');
    result.items.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    return result;
  };

  return {
    async get(id: string): Promise<StudySession | undefined> {
      const row = await withStorage(() => db.sessions.get(id));
      return collectValidRows(
        row ? [row] : [],
        studySessionSchema,
        'study session',
      ).items[0];
    },

    async listBySet(
      setId: string,
      limit = 25,
    ): Promise<ListResult<StudySession>> {
      const rows = await withStorage(() =>
        db.sessions.where('setId').equals(setId).toArray(),
      );
      const result = await read(rows);
      return { items: result.items.slice(0, limit), skipped: result.skipped };
    },

    async listAll(): Promise<ListResult<StudySession>> {
      const rows = await withStorage(() => db.sessions.toArray());
      return read(rows);
    },

    async listRecent(limit: number): Promise<ListResult<StudySession>> {
      const rows = await withStorage(() =>
        db.sessions.orderBy('startedAt').reverse().limit(limit).toArray(),
      );
      return read(rows);
    },

    async latestCompletedForSet(
      setId: string,
    ): Promise<StudySession | undefined> {
      const rows = await withStorage(() =>
        db.sessions.where('setId').equals(setId).toArray(),
      );
      const result = await read(rows);
      return result.items.find((session) => Boolean(session.completedAt));
    },

    async findActiveForSet(setId: string): Promise<StudySession | undefined> {
      const rows = await withStorage(() =>
        db.sessions.where('setId').equals(setId).toArray(),
      );
      const result = await read(rows);
      return result.items.find((session) => !session.completedAt);
    },

    async create(input: StudySessionInput): Promise<StudySession> {
      const session: StudySession = {
        id: createId(),
        setId: input.setId,
        mode: input.mode,
        startedAt: nowIso(),
        options: input.options,
        itemIds: input.plan.map((item) => item.questionId),
        plan: input.plan,
        ...(input.excluded && input.excluded.length > 0
          ? { excluded: input.excluded }
          : {}),
        ...(input.originSessionId
          ? { originSessionId: input.originSessionId }
          : {}),
      };
      const valid = validateForWrite(
        studySessionSchema,
        session,
        'study session',
      );
      await withStorage(() => db.sessions.put(valid));
      return valid;
    },

    async addExisting(sessions: readonly StudySession[]): Promise<void> {
      if (sessions.length === 0) return;
      const valid = sessions.map((session) =>
        validateForWrite(studySessionSchema, session, 'study session'),
      );
      await withStorage(() => db.sessions.bulkPut(valid));
    },

    async complete(id: string, completedAt: string): Promise<void> {
      await withStorage(() => db.sessions.update(id, { completedAt }));
    },

    async completeActiveForSet(
      setId: string,
      completedAt: string,
    ): Promise<number> {
      const rows = await withStorage(() =>
        db.sessions.where('setId').equals(setId).toArray(),
      );
      const open = rows.filter(
        (row) => !(row as { completedAt?: string }).completedAt,
      );
      for (const row of open) {
        await withStorage(() =>
          db.sessions.update((row as { id: string }).id, { completedAt }),
        );
      }
      return open.length;
    },

    async remove(id: string): Promise<void> {
      await withStorage(() =>
        db.transaction('rw', [db.sessions, db.attempts], async () => {
          await db.attempts.where('sessionId').equals(id).delete();
          await db.sessions.delete(id);
        }),
      );
    },
  };
}
