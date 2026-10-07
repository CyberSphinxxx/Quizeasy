import type { QuizeasyDatabase } from '@/data/db/database';
import { withStorage } from '@/data/db/database';
import { validateForWrite } from '@/data/db/validation';
import { collectValidRows } from './rows';
import type {
  DatabaseCounts,
  ListResult,
  SetRepository,
  SetWithStats,
} from './types';
import { createQuizSet, quizSetSchema } from '@/domain/schemas/set';
import type { QuizSet, QuizSetDraft } from '@/domain/schemas/set';
import { questionSchema } from '@/domain/schemas/question';
import { createId, nowIso } from '@/lib/utils';

export class NotFoundError extends Error {
  constructor(what: string) {
    super(
      `That ${what} no longer exists. It may have been deleted in another tab.`,
    );
    this.name = 'NotFoundError';
  }
}

function normalizeTags(tags: string[] | undefined): string[] | undefined {
  if (!tags) return undefined;
  const cleaned = tags.map((tag) => tag.trim()).filter(Boolean);
  return cleaned.length > 0 ? Array.from(new Set(cleaned)) : undefined;
}

/** Builds the updated set without leaving `undefined` keys behind. */
function applyDraft(set: QuizSet, draft: QuizSetDraft, now: string): QuizSet {
  const description = draft.description?.trim();
  const tags = normalizeTags(draft.tags ?? set.tags);
  const next: QuizSet = {
    id: set.id,
    schemaVersion: set.schemaVersion,
    title: draft.title.trim() || set.title,
    createdAt: set.createdAt,
    updatedAt: now,
  };
  if (description) next.description = description;
  if (tags && tags.length > 0) next.tags = tags;
  if (set.lastStudiedAt) next.lastStudiedAt = set.lastStudiedAt;
  return next;
}

export function createSetRepository(db: QuizeasyDatabase): SetRepository {
  const readAll = async (): Promise<ListResult<QuizSet>> => {
    const rows = await withStorage(() => db.sets.toArray());
    const result = collectValidRows(rows, quizSetSchema, 'set');
    result.items.sort(
      (a, b) =>
        b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id),
    );
    return result;
  };

  return {
    list: readAll,

    async listWithStats(): Promise<ListResult<SetWithStats>> {
      const sets = await readAll();
      const [questionCounts, sessionCounts] = await Promise.all([
        withStorage(() => db.questions.toArray()),
        withStorage(() => db.sessions.toArray()),
      ]);
      const validQuestions = collectValidRows(
        questionCounts,
        questionSchema,
        'question',
      );
      const questionsBySet = new Map<string, number>();
      for (const question of validQuestions.items) {
        questionsBySet.set(
          question.setId,
          (questionsBySet.get(question.setId) ?? 0) + 1,
        );
      }
      const sessionsBySet = new Map<string, number>();
      for (const session of sessionCounts) {
        const setId = (session as { setId?: unknown }).setId;
        if (typeof setId === 'string') {
          sessionsBySet.set(setId, (sessionsBySet.get(setId) ?? 0) + 1);
        }
      }
      return {
        skipped: sets.skipped,
        items: sets.items.map((set) => ({
          set,
          questionCount: questionsBySet.get(set.id) ?? 0,
          sessionCount: sessionsBySet.get(set.id) ?? 0,
        })),
      };
    },

    async get(id: string): Promise<QuizSet | undefined> {
      const row = await withStorage(() => db.sets.get(id));
      const result = collectValidRows(row ? [row] : [], quizSetSchema, 'set');
      return result.items[0];
    },

    async create(draft: QuizSetDraft): Promise<QuizSet> {
      const set = createQuizSet({
        id: createId(),
        title: draft.title,
        description: draft.description,
        tags: draft.tags,
        now: nowIso(),
      });
      return this.createWithId(set);
    },

    async createWithId(set: QuizSet): Promise<QuizSet> {
      const valid = validateForWrite(quizSetSchema, set, 'set');
      await withStorage(() => db.sets.put(valid));
      return valid;
    },

    async update(id: string, patch: QuizSetDraft): Promise<QuizSet> {
      const existing = await this.get(id);
      if (!existing) throw new NotFoundError('set');
      const updated = validateForWrite(
        quizSetSchema,
        applyDraft(existing, patch, nowIso()),
        'set',
      );
      await withStorage(() => db.sets.put(updated));
      return updated;
    },

    async rename(id: string, title: string): Promise<QuizSet> {
      return this.update(id, { title });
    },

    async duplicate(id: string): Promise<QuizSet> {
      const source = await this.get(id);
      if (!source) throw new NotFoundError('set');
      const now = nowIso();
      const questions = await withStorage(() =>
        db.questions.where('setId').equals(id).toArray(),
      );
      const validQuestions = collectValidRows(
        questions,
        questionSchema,
        'question',
      ).items.sort(
        (a, b) =>
          a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
      );

      const copy = createQuizSet({
        id: createId(),
        title: `${source.title} (copy)`,
        description: source.description,
        tags: source.tags,
        now,
      });

      const base = Date.now();
      const copiedQuestions = validQuestions.map((question, index) => ({
        ...question,
        id: createId(),
        setId: copy.id,
        // Step the timestamp so the copy keeps the original question order.
        createdAt: new Date(base + index).toISOString(),
        updatedAt: now,
        source: { type: 'manual' as const },
      }));

      await withStorage(() =>
        db.transaction('rw', [db.sets, db.questions], async () => {
          await db.sets.add(validateForWrite(quizSetSchema, copy, 'set'));
          await db.questions.bulkAdd(
            copiedQuestions.map((question) =>
              validateForWrite(questionSchema, question, 'question'),
            ),
          );
        }),
      );
      return copy;
    },

    /** Deletes the set and every question, session, and attempt that belongs to it. */
    async remove(id: string): Promise<void> {
      await withStorage(() =>
        db.transaction(
          'rw',
          [db.sets, db.questions, db.sessions, db.attempts],
          async () => {
            const sessionIds = await db.sessions
              .where('setId')
              .equals(id)
              .primaryKeys();
            if (sessionIds.length > 0) {
              await db.attempts.where('sessionId').anyOf(sessionIds).delete();
            }
            await db.sessions.where('setId').equals(id).delete();
            await db.questions.where('setId').equals(id).delete();
            await db.sets.delete(id);
          },
        ),
      );
    },

    async touchStudied(id: string, at: string): Promise<void> {
      await withStorage(() => db.sets.update(id, { lastStudiedAt: at }));
    },

    async counts(): Promise<DatabaseCounts> {
      const [sets, questions, sessions, attempts] = await Promise.all([
        withStorage(() => db.sets.count()),
        withStorage(() => db.questions.count()),
        withStorage(() => db.sessions.count()),
        withStorage(() => db.attempts.count()),
      ]);
      return { sets, questions, sessions, attempts };
    },

    async clearAll(): Promise<void> {
      await withStorage(() =>
        db.transaction(
          'rw',
          [db.sets, db.questions, db.sessions, db.attempts],
          async () => {
            await db.attempts.clear();
            await db.sessions.clear();
            await db.questions.clear();
            await db.sets.clear();
          },
        ),
      );
    },
  };
}
