import {
  MAX_FREE_RESPONSE_ANSWER_LENGTH,
  MAX_FREE_RESPONSE_WORDS,
} from '@/domain/constants';
import { checkChoiceAvailability } from '@/domain/quiz/choices';
import { isFreeResponseFriendly } from '@/domain/quiz/normalize';
import type { Question } from '@/domain/schemas/question';
import type { PresentationMode } from '@/domain/schemas/study';

export interface ModeEligibility {
  mode: PresentationMode;
  eligible: boolean;
  /** Explains why a question cannot be studied in this mode. */
  reason?: string;
}

const TOO_LONG_FOR_IDENTIFICATION = `Answers longer than ${MAX_FREE_RESPONSE_ANSWER_LENGTH} characters are hard to type. Study this one as a flashcard or multiple choice instead.`;

/** Flashcards only need a question and an answer. */
export function getFlashcardEligibility(question: Question): ModeEligibility {
  if (!question.prompt.trim() || !question.answer.trim()) {
    return {
      mode: 'flashcard',
      eligible: false,
      reason: 'This question is missing a question or an answer.',
    };
  }
  return { mode: 'flashcard', eligible: true };
}

/**
 * Identification needs a short, free-response-friendly answer: long
 * definitions would be painful (and unfair) to type from memory.
 */
export function getIdentificationEligibility(
  question: Question,
): ModeEligibility {
  if (!question.answer.trim() || !question.prompt.trim()) {
    return {
      mode: 'identification',
      eligible: false,
      reason: 'This question is missing a question or an answer.',
    };
  }
  const friendly = isFreeResponseFriendly(question.answer, {
    maxLength: MAX_FREE_RESPONSE_ANSWER_LENGTH,
    maxWords: MAX_FREE_RESPONSE_WORDS,
  });
  if (!friendly) {
    return {
      mode: 'identification',
      eligible: false,
      reason: TOO_LONG_FOR_IDENTIFICATION,
    };
  }
  return { mode: 'identification', eligible: true };
}

/** Multiple choice needs enough real distractors (never invented ones). */
export function getMultipleChoiceEligibility(
  question: Question,
  pool: readonly Question[],
): ModeEligibility {
  if (!question.answer.trim() || !question.prompt.trim()) {
    return {
      mode: 'multiple-choice',
      eligible: false,
      reason: 'This question is missing a question or an answer.',
    };
  }
  const availability = checkChoiceAvailability(question, pool);
  if (!availability.ok) {
    return {
      mode: 'multiple-choice',
      eligible: false,
      reason: availability.reason,
    };
  }
  return { mode: 'multiple-choice', eligible: true };
}

export function getEligibility(
  question: Question,
  pool: readonly Question[],
): Record<PresentationMode, ModeEligibility> {
  return {
    flashcard: getFlashcardEligibility(question),
    'multiple-choice': getMultipleChoiceEligibility(question, pool),
    identification: getIdentificationEligibility(question),
  };
}

/** Counts how many questions can be studied in each mode. */
export function countEligible(
  questions: readonly Question[],
  pool: readonly Question[],
): Record<PresentationMode, number> {
  const counts: Record<PresentationMode, number> = {
    flashcard: 0,
    'multiple-choice': 0,
    identification: 0,
  };
  for (const question of questions) {
    const eligibility = getEligibility(question, pool);
    if (eligibility.flashcard.eligible) counts.flashcard += 1;
    if (eligibility['multiple-choice'].eligible) counts['multiple-choice'] += 1;
    if (eligibility.identification.eligible) counts.identification += 1;
  }
  return counts;
}

/** Eligible modes for one question, most demanding first. */
export function eligibleModes(
  question: Question,
  pool: readonly Question[],
): PresentationMode[] {
  const eligibility = getEligibility(question, pool);
  const modes: PresentationMode[] = [];
  if (eligibility['multiple-choice'].eligible) modes.push('multiple-choice');
  if (eligibility.identification.eligible) modes.push('identification');
  modes.push('flashcard');
  return modes;
}
