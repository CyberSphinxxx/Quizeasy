import type { z } from 'zod';
import { validateForRead } from '@/data/db/validation';
import type { ListResult } from './types';

/**
 * Validates rows read from storage, skipping corrupted entries so one bad row
 * cannot break a whole screen. The number of skipped rows is reported so the
 * UI can tell the user something is wrong.
 */
export function collectValidRows<T>(
  rows: readonly unknown[],
  schema: z.ZodType<T>,
  label: string,
): ListResult<T> {
  const items: T[] = [];
  let skipped = 0;
  for (const row of rows) {
    const result = validateForRead(schema, row);
    if (result.ok) {
      items.push(result.value);
    } else {
      skipped += 1;
    }
  }
  if (skipped > 0) {
    console.warn(
      `Quizeasy skipped ${skipped} stored ${label} record(s) that did not match the current schema.`,
    );
  }
  return { items, skipped };
}
