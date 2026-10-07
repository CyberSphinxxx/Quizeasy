import type {
  AttemptResult,
  PresentationMode,
  SessionPlanItem,
  StudyAttempt,
} from '@/domain/schemas/study';
import { isPositiveResult } from '@/domain/schemas/study';

export type ItemOutcome = 'correct' | 'incorrect' | 'skipped';

export interface ModeScore {
  total: number;
  correct: number;
}

export interface SessionSummary {
  totalItems: number;
  /** Items the user actually answered (including deliberate skips). */
  answered: number;
  correct: number;
  incorrect: number;
  skipped: number;
  /** Correct answers as a percentage of all planned items. */
  percentage: number;
  /** Incorrect and skipped questions: what "retry mistakes" replays. */
  missedQuestionIds: string[];
  missedItems: SessionPlanItem[];
  byMode: Record<PresentationMode, ModeScore>;
}

const EMPTY_MODE_SCORES: Record<PresentationMode, ModeScore> = {
  flashcard: { total: 0, correct: 0 },
  'multiple-choice': { total: 0, correct: 0 },
  identification: { total: 0, correct: 0 },
};

function isNegativeResult(result: AttemptResult): boolean {
  return result === 'incorrect' || result === 'missed';
}

export function classifyResult(result: AttemptResult | undefined): ItemOutcome {
  if (!result) return 'skipped';
  if (isPositiveResult(result)) return 'correct';
  if (isNegativeResult(result)) return 'incorrect';
  return 'skipped';
}

/** Summarizes a session from its plan plus recorded attempts. */
export function summarizeSession(
  plan: readonly SessionPlanItem[],
  attempts: readonly StudyAttempt[],
): SessionSummary {
  const byQuestion = new Map<string, StudyAttempt>();
  for (const attempt of attempts) {
    byQuestion.set(attempt.questionId, attempt);
  }

  const byMode: Record<PresentationMode, ModeScore> = {
    flashcard: { ...EMPTY_MODE_SCORES.flashcard },
    'multiple-choice': { ...EMPTY_MODE_SCORES['multiple-choice'] },
    identification: { ...EMPTY_MODE_SCORES.identification },
  };

  let correct = 0;
  let incorrect = 0;
  let skipped = 0;
  let answered = 0;
  const missedItems: SessionPlanItem[] = [];

  for (const item of plan) {
    const attempt = byQuestion.get(item.questionId);
    const outcome = classifyResult(attempt?.result);
    const modeScore = byMode[item.presentationMode];
    modeScore.total += 1;

    if (attempt) answered += 1;

    switch (outcome) {
      case 'correct':
        correct += 1;
        modeScore.correct += 1;
        break;
      case 'incorrect':
        incorrect += 1;
        missedItems.push(item);
        break;
      default:
        skipped += 1;
        missedItems.push(item);
        break;
    }
  }

  const totalItems = plan.length;
  return {
    totalItems,
    answered,
    correct,
    incorrect,
    skipped,
    percentage: totalItems === 0 ? 0 : Math.round((correct / totalItems) * 100),
    missedQuestionIds: missedItems.map((item) => item.questionId),
    missedItems,
    byMode,
  };
}
