import type { Question } from '@/domain/schemas/question';
import type { SetWithStats } from '@/data/repositories';

/**
 * Stable empty collections.
 *
 * Using these instead of inline `[]` literals keeps `useMemo`/`useCallback`
 * dependencies from changing on every render while data is still loading.
 */
export const EMPTY_QUESTIONS: readonly Question[] = [];
export const EMPTY_SET_STATS: readonly SetWithStats[] = [];
