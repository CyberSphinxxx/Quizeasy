import {
  MAX_CHOICE_ANSWER_LENGTH,
  MIN_MCQ_DISTRACTORS,
  TARGET_MCQ_CHOICES,
} from '@/domain/constants';
import { answerKey, collapseWhitespace } from '@/domain/quiz/normalize';
import type { Question } from '@/domain/schemas/question';
import type { Rng } from '@/lib/rng';

export interface ChoiceBuildResult {
  status: 'ok' | 'insufficient';
  /** Choices in presentation order. Empty when the question is ineligible. */
  choices: string[];
  /** Index of the correct answer inside `choices`, or -1 when ineligible. */
  correctIndex: number;
  explicitDistractors: number;
  poolDistractors: number;
  /** True when fewer than the target number of choices were available. */
  reduced: boolean;
  /** Plain-language reason when the question cannot be asked as multiple choice. */
  reason?: string;
}

export interface ChoiceAvailability {
  ok: boolean;
  distractors: number;
  reason?: string;
}

/** Every string that must never appear as a distractor for this question. */
export function correctAnswerKeys(question: Question): Set<string> {
  const keys = new Set<string>();
  for (const value of [question.answer, ...question.acceptedAnswers]) {
    const key = answerKey(value);
    if (key) keys.add(key);
  }
  return keys;
}

function isUsablePoolAnswer(value: string): boolean {
  const collapsed = collapseWhitespace(value);
  if (!collapsed) return false;
  if (collapsed.length > MAX_CHOICE_ANSWER_LENGTH) return false;
  if (collapsed.includes('\n')) return false;
  return true;
}

function tagOverlap(a: readonly string[], b: readonly string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a.map((tag) => tag.toLowerCase()));
  let overlap = 0;
  for (const tag of b) {
    if (setA.has(tag.toLowerCase())) overlap += 1;
  }
  return overlap;
}

/**
 * Candidates for wrong answers taken from other questions in the same set.
 *
 * Answers from questions that share tags come first because they are more
 * plausible looking, then shorter answers (a long definition is an obvious
 * giveaway), preserving set order for ties so results stay deterministic.
 */
export function buildDistractorCandidates(
  question: Question,
  pool: readonly Question[],
  takenKeys: ReadonlySet<string>,
): string[] {
  const scored: {
    text: string;
    overlap: number;
    length: number;
    order: number;
  }[] = [];
  let order = 0;

  for (const other of pool) {
    if (other.id === question.id) continue;
    for (const value of [other.answer, ...other.acceptedAnswers]) {
      order += 1;
      const collapsed = collapseWhitespace(value);
      const key = answerKey(collapsed);
      if (!key) continue;
      if (takenKeys.has(key)) continue;
      if (!isUsablePoolAnswer(collapsed)) continue;
      scored.push({
        text: collapsed,
        overlap: tagOverlap(question.tags, other.tags),
        length: collapsed.length,
        order,
      });
    }
  }

  scored.sort((a, b) => {
    if (b.overlap !== a.overlap) return b.overlap - a.overlap;
    if (a.length !== b.length) return a.length - b.length;
    return a.order - b.order;
  });

  // The same answer text can come from several questions: keep it once.
  const seen = new Set<string>();
  const candidates: string[] = [];
  for (const candidate of scored) {
    const key = answerKey(candidate.text);
    if (seen.has(key) || takenKeys.has(key)) continue;
    seen.add(key);
    candidates.push(candidate.text);
  }
  return candidates;
}

function explicitDistractors(
  question: Question,
  takenKeys: Set<string>,
): string[] {
  const chosen: string[] = [];
  for (const value of question.wrongChoices) {
    const collapsed = collapseWhitespace(value);
    const key = answerKey(collapsed);
    if (!key || takenKeys.has(key)) continue;
    takenKeys.add(key);
    chosen.push(collapsed);
  }
  return chosen;
}

export interface ChoiceBuildOptions {
  rng: Rng;
  shuffle: boolean;
  target?: number;
  minDistractors?: number;
}

/**
 * Builds a multiple-choice question from canonical data only.
 *
 * Priority: explicit wrong choices, then answers from other questions.
 * Quizeasy never invents nonsense distractors; when not enough material
 * exists the question is reported as ineligible instead.
 */
export function buildChoices(
  question: Question,
  pool: readonly Question[],
  options: ChoiceBuildOptions,
): ChoiceBuildResult {
  const target = options.target ?? TARGET_MCQ_CHOICES;
  const minDistractors = options.minDistractors ?? MIN_MCQ_DISTRACTORS;
  const takenKeys = correctAnswerKeys(question);

  const explicit = explicitDistractors(question, takenKeys);
  const wanted = Math.max(0, target - 1 - explicit.length);
  const fromPool =
    wanted > 0
      ? buildDistractorCandidates(question, pool, takenKeys).slice(0, wanted)
      : [];

  const distractors = [...explicit, ...fromPool];

  if (distractors.length < minDistractors) {
    return {
      status: 'insufficient',
      choices: [],
      correctIndex: -1,
      explicitDistractors: explicit.length,
      poolDistractors: fromPool.length,
      reduced: false,
      reason:
        distractors.length === 0
          ? 'No wrong choices and no other answers in this set to use as distractors.'
          : `Only ${distractors.length} wrong ${
              distractors.length === 1 ? 'choice' : 'choices'
            } available (at least ${minDistractors} needed).`,
    };
  }

  const answer = collapseWhitespace(question.answer);
  const all = [answer, ...distractors];
  const ordered = options.shuffle ? options.rng.shuffle(all) : all;
  const correctIndex = ordered.indexOf(answer);

  return {
    status: 'ok',
    choices: ordered,
    correctIndex,
    explicitDistractors: explicit.length,
    poolDistractors: fromPool.length,
    reduced: ordered.length < target,
  };
}

/** Cheap eligibility check used before a session is built. */
export function checkChoiceAvailability(
  question: Question,
  pool: readonly Question[],
  minDistractors: number = MIN_MCQ_DISTRACTORS,
): ChoiceAvailability {
  const takenKeys = correctAnswerKeys(question);
  const explicitCount = explicitDistractors(question, takenKeys).length;
  if (explicitCount >= minDistractors) {
    return { ok: true, distractors: explicitCount };
  }
  const needed = minDistractors - explicitCount;
  const fromPool = buildDistractorCandidates(question, pool, takenKeys).slice(
    0,
    needed,
  ).length;
  const total = explicitCount + fromPool;
  if (total >= minDistractors) return { ok: true, distractors: total };
  return {
    ok: false,
    distractors: total,
    reason:
      explicitCount === 0 && fromPool === 0
        ? 'No wrong choices and no other answers in this set to use as distractors.'
        : `Only ${total} usable wrong ${
            total === 1 ? 'choice' : 'choices'
          } available (at least ${minDistractors} needed). Add "W:" lines to this question or import more questions.`,
  };
}
