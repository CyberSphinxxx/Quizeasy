import { repositories } from '@/data/repositories';
import type { Question } from '@/domain/schemas/question';
import type { QuizSet } from '@/domain/schemas/set';
import type { StudySession } from '@/domain/schemas/study';
import { useAsyncData, type AsyncState } from './useAsyncData';

export interface SetBundle {
  set: QuizSet;
  questions: Question[];
  /** Questions that failed schema validation and were skipped. */
  skippedQuestions: number;
  sessions: StudySession[];
}

export type SetBundleState = AsyncState<SetBundle | null>;

/** Loads everything a set screen needs through the repository layer. */
export function useSetBundle(setId: string | undefined): SetBundleState {
  return useAsyncData<SetBundle | null>(async () => {
    if (!setId) return null;
    const set = await repositories.sets.get(setId);
    if (!set) return null;
    const [questions, sessions] = await Promise.all([
      repositories.questions.listBySet(setId),
      repositories.sessions.listBySet(setId, 10),
    ]);
    return {
      set,
      questions: questions.items,
      skippedQuestions: questions.skipped,
      sessions: sessions.items,
    };
  }, [setId]);
}
