import { z } from 'zod';
import {
  isoDateString,
  nonEmptyString,
  optionalTrimmedString,
  tagArray,
} from './common';
import { QUESTION_SOURCES } from '@/domain/constants';

/** Where a question came from. Used for provenance only, never for behavior. */
export const questionSourceSchema = z.object({
  type: z.enum(QUESTION_SOURCES),
  importedAt: isoDateString.optional(),
});

export type QuestionSource = z.infer<typeof questionSourceSchema>;

/**
 * The canonical question representation.
 *
 * Every study mode reads this shape; no mode keeps its own question store.
 */
export const questionSchema = z.object({
  id: nonEmptyString,
  setId: nonEmptyString,
  prompt: nonEmptyString.max(4000, {
    error: 'Questions are limited to 4000 characters.',
  }),
  answer: nonEmptyString.max(4000, {
    error: 'Answers are limited to 4000 characters.',
  }),
  // Defaults keep hand-written or older exports importable.
  acceptedAnswers: z.array(nonEmptyString).default([]),
  wrongChoices: z.array(nonEmptyString).default([]),
  explanation: optionalTrimmedString,
  tags: tagArray.default([]),
  createdAt: isoDateString,
  updatedAt: isoDateString,
  source: questionSourceSchema.optional(),
});

export type Question = z.infer<typeof questionSchema>;

export type QuestionDraft = {
  prompt: string;
  answer: string;
  acceptedAnswers: string[];
  wrongChoices: string[];
  explanation?: string;
  tags: string[];
};

export const QUESTION_KEYS = [
  'id',
  'setId',
  'prompt',
  'answer',
  'acceptedAnswers',
  'wrongChoices',
  'explanation',
  'tags',
  'createdAt',
  'updatedAt',
  'source',
] as const;

export function createQuestion(input: {
  id: string;
  setId: string;
  draft: QuestionDraft;
  now: string;
  source?: QuestionSource;
}): Question {
  const explanation = input.draft.explanation?.trim();
  return {
    id: input.id,
    setId: input.setId,
    prompt: input.draft.prompt.trim(),
    answer: input.draft.answer.trim(),
    acceptedAnswers: dedupeText(input.draft.acceptedAnswers),
    wrongChoices: dedupeText(input.draft.wrongChoices),
    ...(explanation ? { explanation } : {}),
    tags: dedupeText(input.draft.tags),
    createdAt: input.now,
    updatedAt: input.now,
    ...(input.source ? { source: input.source } : {}),
  };
}

/** Removes blanks and case-insensitive duplicates, preserving order. */
export function dedupeText(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}
