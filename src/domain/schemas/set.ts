import { z } from 'zod';
import {
  isoDateString,
  nonEmptyString,
  optionalTrimmedString,
  tagArray,
} from './common';
import { SCHEMA_VERSION } from '@/domain/constants';

/**
 * A quiz set: the container for a canonical question bank.
 * One set is studied in every mode; there is no per-mode copy of the data.
 */
export const quizSetSchema = z.object({
  id: nonEmptyString,
  // Defaulted so example/older exports that omit it still import.
  schemaVersion: z.number().int().min(1).default(SCHEMA_VERSION),
  title: nonEmptyString.max(200, {
    error: 'Set titles are limited to 200 characters.',
  }),
  description: optionalTrimmedString,
  createdAt: isoDateString,
  updatedAt: isoDateString,
  lastStudiedAt: isoDateString.optional(),
  tags: tagArray.optional(),
});

export type QuizSet = z.infer<typeof quizSetSchema>;

export type QuizSetDraft = {
  title: string;
  description?: string;
  tags?: string[];
};

/** Builds a brand new set with a fresh ID and timestamps. */
export function createQuizSet(input: {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  now: string;
}): QuizSet {
  const title = input.title.trim() || 'Untitled set';
  const description = input.description?.trim();
  const tags = input.tags?.map((tag) => tag.trim()).filter(Boolean);
  return {
    id: input.id,
    schemaVersion: SCHEMA_VERSION,
    title,
    ...(description ? { description } : {}),
    createdAt: input.now,
    updatedAt: input.now,
    ...(tags && tags.length > 0 ? { tags } : {}),
  };
}

export const QUIZ_SET_KEYS = [
  'id',
  'schemaVersion',
  'title',
  'description',
  'createdAt',
  'updatedAt',
  'lastStudiedAt',
  'tags',
] as const;
