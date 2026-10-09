import { useMemo } from 'react';
import { repositories } from '@/data/repositories';
import { countEligible } from '@/domain/study/eligibility';
import type { PresentationMode, StudyMode } from '@/domain/schemas/study';
import { useAsyncData } from '@/hooks/useAsyncData';

export interface SetSignals {
  /** Modes a set can actually run, derived from its own questions. */
  modes: Record<string, PresentationMode[]>;
  /** The mode of the most recent session per set, for the chip highlight. */
  lastMode: Record<string, StudyMode | undefined>;
}

const EMPTY_SIGNALS: SetSignals = { modes: {}, lastMode: {} };

/**
 * Read-only display data for the library grid. Nothing is written and no
 * eligibility is guessed: a mode chip appears only when at least one of the
 * set's own questions can be studied that way (the set detail page shows the
 * exact per-mode counts).
 */
export function useSetSignals(enabled: boolean): SetSignals {
  const state = useAsyncData<SetSignals>(async () => {
    const [questions, sessions] = await Promise.all([
      repositories.questions.listAll(),
      repositories.sessions.listAll(),
    ]);

    const bySet = new Map<string, typeof questions.items>();
    for (const question of questions.items) {
      const bucket = bySet.get(question.setId);
      if (bucket) bucket.push(question);
      else bySet.set(question.setId, [question]);
    }

    const modes: SetSignals['modes'] = {};
    for (const [setId, setQuestions] of bySet) {
      const counts = countEligible(setQuestions, setQuestions);
      const available: PresentationMode[] = [];
      if (counts.flashcard > 0) available.push('flashcard');
      if (counts['multiple-choice'] > 0) available.push('multiple-choice');
      if (counts.identification > 0) available.push('identification');
      modes[setId] = available;
    }

    const lastMode: SetSignals['lastMode'] = {};
    const latest = new Map<string, string>();
    for (const session of sessions.items) {
      const previous = latest.get(session.setId);
      if (previous && previous >= session.startedAt) continue;
      latest.set(session.setId, session.startedAt);
      lastMode[session.setId] = session.mode;
    }

    return { modes, lastMode };
  }, [enabled]);

  return useMemo(
    () => (enabled ? (state.data ?? EMPTY_SIGNALS) : EMPTY_SIGNALS),
    [enabled, state.data],
  );
}
