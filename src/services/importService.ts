import type { ParsedQuestion } from '@/parser';
import type { Question, QuestionDraft } from '@/domain/schemas/question';
import type { QuizSet } from '@/domain/schemas/set';
import type { RepositoryBundle } from '@/data/repositories';
import { dedupeText } from '@/domain/schemas/question';

/** Turns preview items into canonical question drafts. */
export function toQuestionDrafts(
  items: readonly ParsedQuestion[],
): QuestionDraft[] {
  return items.map((item) => ({
    prompt: item.prompt.trim(),
    answer: item.answer.trim(),
    acceptedAnswers: dedupeText(item.acceptedAnswers ?? []),
    wrongChoices: dedupeText(item.wrongChoices),
    explanation: item.explanation,
    tags: dedupeText(item.tags),
  }));
}

export interface SaveImportInput {
  title: string;
  description?: string;
  items: readonly ParsedQuestion[];
  /** Append to an existing set instead of creating a new one. */
  targetSetId?: string;
}

export interface SaveImportResult {
  set: QuizSet;
  questions: Question[];
}

/**
 * Saves reviewed import items.
 *
 * Only items the user kept are passed in; errors are validated again here so a
 * malformed item can never reach storage.
 */
export async function saveImport(
  repositories: RepositoryBundle,
  input: SaveImportInput,
): Promise<SaveImportResult> {
  const drafts = toQuestionDrafts(input.items);
  if (drafts.length === 0) {
    throw new Error('There are no questions to save yet.');
  }
  const invalid = drafts.findIndex(
    (draft) => draft.prompt.length === 0 || draft.answer.length === 0,
  );
  if (invalid >= 0) {
    throw new Error(
      `Question ${invalid + 1} still needs both a question and an answer, or it can be excluded.`,
    );
  }

  if (input.targetSetId) {
    const existing = await repositories.sets.get(input.targetSetId);
    if (!existing) {
      throw new Error(
        'That set no longer exists. Refresh the library and try again.',
      );
    }
    const questions = await repositories.questions.createMany(
      existing.id,
      drafts,
      { type: 'paste-import', importedAt: new Date().toISOString() },
    );
    const updated = await repositories.sets.update(existing.id, {
      title: existing.title,
      description: existing.description,
      tags: existing.tags,
    });
    return { set: updated, questions };
  }

  const set = await repositories.sets.create({
    title: input.title.trim() || 'Imported set',
    description: input.description,
  });

  try {
    const questions = await repositories.questions.createMany(set.id, drafts, {
      type: 'paste-import',
      importedAt: new Date().toISOString(),
    });
    return { set, questions };
  } catch (error) {
    // Do not leave an empty set behind if the questions failed to save.
    await repositories.sets.remove(set.id);
    throw error;
  }
}

/** Suggests a set title from the pasted text (first question, trimmed). */
export function suggestSetTitle(items: readonly ParsedQuestion[]): string {
  const first = items[0]?.prompt;
  if (!first) return '';
  const singleLine = first.split('\n')[0]?.trim() ?? '';
  const short =
    singleLine.length > 48 ? `${singleLine.slice(0, 47)}…` : singleLine;
  return short.replace(/\?+$/, '');
}
