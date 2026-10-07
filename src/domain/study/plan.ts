import { buildChoices } from '@/domain/quiz/choices';
import { eligibleModes, getEligibility } from '@/domain/study/eligibility';
import type { Question } from '@/domain/schemas/question';
import type {
  ExcludedQuestion,
  PresentationMode,
  SessionPlanItem,
  StudyOptions,
} from '@/domain/schemas/study';
import { createRng, type Rng } from '@/lib/rng';

export interface SessionPlan {
  items: SessionPlanItem[];
  excluded: ExcludedQuestion[];
}

export interface GenerateSessionPlanInput {
  /** Candidate questions (usually every question in the set). */
  questions: readonly Question[];
  /** Set-wide pool used to find multiple-choice distractors. */
  pool?: readonly Question[];
  options: StudyOptions;
  seed: string;
}

function limitCount(
  limit: StudyOptions['questionLimit'],
  available: number,
): number {
  if (limit === 'all') return available;
  return Math.min(limit, available);
}

function filterByTags(
  questions: readonly Question[],
  tags: readonly string[] | undefined,
): Question[] {
  if (!tags || tags.length === 0) return [...questions];
  const wanted = new Set(tags.map((tag) => tag.toLowerCase()));
  return questions.filter((question) =>
    question.tags.some((tag) => wanted.has(tag.toLowerCase())),
  );
}

/** Picks a mode, preferring modes that have been used least so far. */
function createModeChooser(rng: Rng) {
  const counts: Record<PresentationMode, number> = {
    flashcard: 0,
    'multiple-choice': 0,
    identification: 0,
  };
  return (modes: PresentationMode[]): PresentationMode => {
    const minimum = Math.min(...modes.map((mode) => counts[mode]));
    const candidates = modes.filter((mode) => counts[mode] === minimum);
    const index = rng.int(0, candidates.length - 1);
    const chosen = candidates[index] ?? modes[0] ?? 'flashcard';
    counts[chosen] += 1;
    return chosen;
  };
}

function buildItem(
  question: Question,
  mode: PresentationMode,
  pool: readonly Question[],
  options: StudyOptions,
  rng: Rng,
): SessionPlanItem | null {
  if (mode !== 'multiple-choice') {
    return { questionId: question.id, presentationMode: mode };
  }

  const result = buildChoices(question, pool, {
    rng,
    shuffle: options.shuffleChoices,
  });
  if (result.status !== 'ok') return null;

  const notes: string[] = [];
  if (result.poolDistractors > 0) {
    notes.push(
      `${result.poolDistractors} wrong ${
        result.poolDistractors === 1 ? 'choice' : 'choices'
      } came from other questions in this set.`,
    );
  }
  if (result.reduced) {
    notes.push(`Only ${result.choices.length} choices were available.`);
  }

  return {
    questionId: question.id,
    presentationMode: mode,
    choices: result.choices,
    correctChoiceIndex: result.correctIndex,
    ...(result.reduced ? { reducedChoices: true } : {}),
    ...(notes.length > 0 ? { notes } : {}),
  };
}

/**
 * Builds a study session plan from canonical questions.
 *
 * Deterministic for a given set of questions, options, and seed, which makes
 * sessions testable and resumable after a reload.
 */
export function generateSessionPlan(
  input: GenerateSessionPlanInput,
): SessionPlan {
  const { options, seed } = input;
  const pool = input.pool ?? input.questions;
  const rng = createRng(seed);
  const candidates = filterByTags(input.questions, options.tags);

  const eligible: Question[] = [];
  const excluded: ExcludedQuestion[] = [];

  for (const question of candidates) {
    if (options.mode === 'mixed') {
      const eligibility = getEligibility(question, pool);
      if (eligibility.flashcard.eligible) {
        eligible.push(question);
      } else {
        excluded.push({
          questionId: question.id,
          reason:
            eligibility.flashcard.reason ??
            'This question cannot be studied in any mode.',
        });
      }
      continue;
    }

    const eligibility = getEligibility(question, pool)[options.mode];
    if (eligibility.eligible) {
      eligible.push(question);
    } else {
      excluded.push({
        questionId: question.id,
        reason: eligibility.reason ?? 'This question is not ready to study.',
      });
    }
  }

  const ordered = options.shuffleQuestions ? rng.shuffle(eligible) : eligible;
  const selected = ordered.slice(
    0,
    limitCount(options.questionLimit, ordered.length),
  );

  if (options.mode !== 'mixed') {
    const items: SessionPlanItem[] = [];
    for (const question of selected) {
      const item = buildItem(question, options.mode, pool, options, rng);
      if (item) {
        items.push(item);
      } else {
        excluded.push({
          questionId: question.id,
          reason: 'Quizeasy could not build choices for this question.',
        });
      }
    }
    return { items, excluded };
  }

  // Mixed mode: choose a mode per question, balancing the mix, then build.
  const chooseMode = createModeChooser(rng);
  const modes = new Map<string, PresentationMode>();
  for (const index of rng.shuffle(selected.map((_question, i) => i))) {
    const question = selected[index];
    if (!question) continue;
    modes.set(question.id, chooseMode(eligibleModes(question, pool)));
  }

  const items: SessionPlanItem[] = [];
  for (const question of selected) {
    const mode = modes.get(question.id) ?? 'flashcard';
    const item = buildItem(question, mode, pool, options, rng);
    if (item) {
      items.push(item);
    } else {
      const fallback = buildItem(question, 'flashcard', pool, options, rng);
      if (fallback) items.push(fallback);
    }
  }
  return { items, excluded };
}

export interface RetryPlanInput {
  /** The plan of the session being retried. */
  originItems: readonly SessionPlanItem[];
  missedQuestionIds: readonly string[];
  /** Questions that still exist locally. */
  availableQuestionIds: readonly string[];
  options: StudyOptions;
  seed: string;
}

/**
 * Retries the questions that were missed, reusing the original presentation
 * (same mode and same choices) so the retry feels like the first attempt.
 */
export function buildRetryPlan(input: RetryPlanInput): SessionPlan {
  const rng = createRng(input.seed);
  const missed = new Set(input.missedQuestionIds);
  const available = new Set(input.availableQuestionIds);

  const matching = input.originItems.filter(
    (item) => missed.has(item.questionId) && available.has(item.questionId),
  );
  const ordered = input.options.shuffleQuestions
    ? rng.shuffle(matching)
    : matching;
  const selected = ordered.slice(
    0,
    limitCount(input.options.questionLimit, ordered.length),
  );

  return { items: [...selected], excluded: [] };
}
