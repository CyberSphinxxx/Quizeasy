import type { QuizeasyDatabase } from '@/data/db/database';
import { withStorage } from '@/data/db/database';
import { validateForWrite } from '@/data/db/validation';
import type { PreferencesRepository } from './types';
import type { Preferences } from '@/domain/schemas/preferences';
import {
  DEFAULT_PREFERENCES,
  PREFERENCES_ID,
  preferencesSchema,
} from '@/domain/schemas/preferences';

export function createPreferencesRepository(
  db: QuizeasyDatabase,
): PreferencesRepository {
  return {
    /** Always returns usable preferences, falling back to the defaults. */
    async get(): Promise<Preferences> {
      const row = await withStorage(() => db.preferences.get(PREFERENCES_ID));
      if (!row) return { ...DEFAULT_PREFERENCES };
      const result = preferencesSchema.safeParse(row);
      if (!result.success) return { ...DEFAULT_PREFERENCES };
      return result.data;
    },

    async save(preferences: Preferences): Promise<Preferences> {
      const valid = validateForWrite(
        preferencesSchema,
        { ...preferences, id: PREFERENCES_ID },
        'preferences',
      );
      await withStorage(() => db.preferences.put(valid));
      return valid;
    },

    async update(
      patch: Partial<Omit<Preferences, 'id'>>,
    ): Promise<Preferences> {
      const current = await this.get();
      return this.save({ ...current, ...patch, id: PREFERENCES_ID });
    },
  };
}
