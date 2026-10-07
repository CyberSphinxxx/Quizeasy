import type { QuizeasyDatabase } from '@/data/db/database';
import { withStorage } from '@/data/db/database';
import { validateForWrite } from '@/data/db/validation';
import { collectValidRows } from './rows';
import type { ListResult, QuestionRepository } from './types';
import type {
  Question,
  QuestionDraft,
  QuestionSource,
} from '@/domain/schemas/question';
import { createQuestion, questionSchema } from '@/domain/schemas/question';
import { createId, nowIso } from '@/lib/utils';

export function createQuestionRepository(
  db: QuizeasyDatabase,
): QuestionRepository {
  const readBySet = async (setId: string): Promise<ListResult<Question>> => {
    const rows = await withStorage(() =>
      db.questions.where('setId').equals(setId).toArray(),
    );
    const result = collectValidRows(rows, questionSchema, 'question');
    // Ordered by creation time, with the ID as a stable tiebreaker so the
    // editor never reshuffles rows between reads.
    result.items.sort(
      (a, b) =>
        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
    );
    return result;
  };

  const requireQuestion = async (id: string): Promise<Question> => {
    const row = await withStorage(() => db.questions.get(id));
    const result = collectValidRows(
      row ? [row] : [],
      questionSchema,
      'question',
    );
    const question = result.items[0];
    if (!question) {
      throw new Error(
        'That question no longer exists. It may have been deleted.',
      );
    }
    return question;
  };

  return {
    listBySet: readBySet,

    async listAll(): Promise<ListResult<Question>> {
      const rows = await withStorage(() => db.questions.toArray());
      const result = collectValidRows(rows, questionSchema, 'question');
      result.items.sort(
        (a, b) =>
          a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
      );
      return result;
    },

    async get(id: string): Promise<Question | undefined> {
      const row = await withStorage(() => db.questions.get(id));
      return collectValidRows(row ? [row] : [], questionSchema, 'question')
        .items[0];
    },

    async create(
      setId: string,
      draft: QuestionDraft,
      source: QuestionSource = { type: 'manual', importedAt: nowIso() },
    ): Promise<Question> {
      const question = createQuestion({
        id: createId(),
        setId,
        draft,
        now: nowIso(),
        source,
      });
      await this.addExisting([question]);
      return question;
    },

    async createMany(
      setId: string,
      drafts: readonly QuestionDraft[],
      source: QuestionSource = { type: 'paste-import', importedAt: nowIso() },
    ): Promise<Question[]> {
      // Bulk inserts share a timestamp; step it by a millisecond per row so
      // the import order is preserved when the questions are read back.
      const base = Date.now();
      const questions = drafts.map((draft, index) =>
        createQuestion({
          id: createId(),
          setId,
          draft,
          now: new Date(base + index).toISOString(),
          source,
        }),
      );
      await this.addExisting(questions);
      return questions;
    },

    async addExisting(questions: readonly Question[]): Promise<void> {
      if (questions.length === 0) return;
      const valid = questions.map((question) =>
        validateForWrite(questionSchema, question, 'question'),
      );
      await withStorage(() => db.questions.bulkPut(valid));
    },

    async update(id: string, draft: QuestionDraft): Promise<Question> {
      const existing = await requireQuestion(id);
      const explanation = draft.explanation?.trim();
      const updated: Question = {
        id: existing.id,
        setId: existing.setId,
        prompt: draft.prompt.trim(),
        answer: draft.answer.trim(),
        acceptedAnswers: draft.acceptedAnswers
          .map((value) => value.trim())
          .filter(Boolean),
        wrongChoices: draft.wrongChoices
          .map((value) => value.trim())
          .filter(Boolean),
        tags: draft.tags.map((value) => value.trim()).filter(Boolean),
        createdAt: existing.createdAt,
        updatedAt: nowIso(),
        ...(existing.source ? { source: existing.source } : {}),
      };
      if (explanation) updated.explanation = explanation;
      const valid = validateForWrite(questionSchema, updated, 'question');
      await withStorage(() => db.questions.put(valid));
      return valid;
    },

    async remove(id: string): Promise<void> {
      await withStorage(() => db.questions.delete(id));
    },

    async removeMany(ids: readonly string[]): Promise<void> {
      if (ids.length === 0) return;
      await withStorage(() => db.questions.bulkDelete(ids.slice()));
    },

    async countBySet(setId: string): Promise<number> {
      return withStorage(() =>
        db.questions.where('setId').equals(setId).count(),
      );
    },

    /** Moves a question one position up or down inside its set. */
    async move(
      setId: string,
      questionId: string,
      direction: -1 | 1,
    ): Promise<boolean> {
      const { items } = await readBySet(setId);
      const index = items.findIndex((question) => question.id === questionId);
      const target = index + direction;
      const current = items[index];
      const neighbour = items[target];
      if (!current || !neighbour) return false;

      // Ordering is by creation time, so swap the two timestamps. If they are
      // identical (bulk import), nudge them apart instead.
      const currentTime = current.createdAt;
      const neighbourTime = neighbour.createdAt;
      if (currentTime === neighbourTime) {
        const base = Date.now();
        current.createdAt = new Date(base).toISOString();
        neighbour.createdAt = new Date(
          base + (direction === 1 ? -1 : 1),
        ).toISOString();
      } else {
        current.createdAt = neighbourTime;
        neighbour.createdAt = currentTime;
      }

      await this.addExisting([current, neighbour]);
      return true;
    },

    /** Every stored question ID, used to detect collisions during imports. */
    async allIds(): Promise<Set<string>> {
      const keys = await withStorage(() =>
        db.questions.toCollection().primaryKeys(),
      );
      return new Set(keys);
    },
  };
}
