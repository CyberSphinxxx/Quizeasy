import type { z } from 'zod';
import { formatZodError } from '@/domain/schemas/common';

/** Thrown when data fails schema validation at a storage boundary. */
export class ValidationError extends Error {
  readonly issues: string;

  constructor(message: string, issues: string) {
    super(message);
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

/**
 * Validates data before it is written. Writers always validate: nothing enters
 * IndexedDB that does not match the canonical schema.
 */
export function validateForWrite<T>(
  schema: z.ZodType<T>,
  value: unknown,
  label: string,
): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ValidationError(
      `Quizeasy could not save the ${label} because the data was not valid.`,
      formatZodError(result.error),
    );
  }
  return result.data;
}

/**
 * Validates data read back from storage. Corrupted rows are skipped instead of
 * breaking the whole screen; callers can report how many were skipped.
 */
export function validateForRead<T>(
  schema: z.ZodType<T>,
  value: unknown,
): { ok: true; value: T } | { ok: false; reason: string } {
  const result = schema.safeParse(value);
  if (result.success) return { ok: true, value: result.data };
  return { ok: false, reason: formatZodError(result.error) };
}
