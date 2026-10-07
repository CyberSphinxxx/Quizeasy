import { z } from 'zod';

/** Shared primitive schemas used across the canonical data model. */

export const nonEmptyString = z
  .string()
  .trim()
  .min(1, { error: 'This field cannot be empty.' });

export const optionalTrimmedString = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional();

/** ISO 8601 timestamps are persisted at every external/schema boundary. */
export const isoDateString = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    error: 'Expected an ISO 8601 date string.',
  });

export const stringArray = z.array(z.string());

export const tagArray = z.array(nonEmptyString);

export function formatZodError(error: z.ZodError): string {
  return error.issues
    .slice(0, 8)
    .map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join(' ');
}

export type { z };
