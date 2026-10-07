import { MIN_MCQ_DISTRACTORS } from '@/domain/constants';
import { answerKey, promptKey } from '@/domain/quiz/normalize';
import { dedupeText } from '@/domain/schemas/question';
import { PARSER_LIMITS } from './limits';
import type { ParseIssue } from './types';

/** The editable fields of one import item. */
export interface EditableItemFields {
  prompt: string;
  answer: string;
  acceptedAnswers: string[];
  wrongChoices: string[];
  explanation?: string;
  tags: string[];
}

export interface ItemValidationInput extends EditableItemFields {
  /** 1-based source line, used for messages. */
  line: number;
  /** False when the source had no "Q:" label at all. */
  sawQuestionLabel: boolean;
  /** False when the source had no "A:" label at all. */
  sawAnswerLabel: boolean;
  /** Pre-dedupe count of wrong choices in the source (for the duplicate warning). */
  rawWrongChoiceCount?: number;
  /** Pre-dedupe count of tags in the source (for the duplicate warning). */
  rawTagCount?: number;
}

export interface ItemValidationResult {
  fields: EditableItemFields;
  issues: ParseIssue[];
}

/**
 * Validates one import item.
 *
 * Errors block saving; warnings do not. Re-running this after the user edits an
 * item in the preview is what makes inline correction work.
 */
export function validateItemFields(
  input: ItemValidationInput,
): ItemValidationResult {
  const issues: ParseIssue[] = [];
  const line = input.line;

  let prompt = input.prompt.trim();
  let answer = input.answer.trim();
  let explanation = input.explanation?.trim() ?? '';
  const acceptedAnswers = dedupeText(input.acceptedAnswers);
  const wrongChoices = dedupeText(input.wrongChoices);
  const tags = dedupeText(input.tags);

  if (!prompt && !answer && !input.sawQuestionLabel && !input.sawAnswerLabel) {
    issues.push({
      code: 'empty-item',
      severity: 'error',
      message:
        'This entry has no question or answer. Fill it in or exclude it.',
      line,
    });
  } else {
    if (!prompt) {
      issues.push({
        code: input.sawQuestionLabel ? 'empty-question' : 'missing-question',
        severity: 'error',
        message: input.sawQuestionLabel
          ? 'The question text is empty.'
          : 'No question found for this answer. Add a "Q:" line.',
        line,
      });
    }
    if (!answer) {
      issues.push({
        code: input.sawAnswerLabel ? 'empty-answer' : 'missing-answer',
        severity: 'error',
        message: input.sawAnswerLabel
          ? 'The answer text is empty.'
          : 'No answer found for this question. Add an "A:" line.',
        line,
      });
    }
  }

  if (prompt.length > PARSER_LIMITS.maxFieldChars) {
    prompt = prompt.slice(0, PARSER_LIMITS.maxFieldChars);
    issues.push({
      code: 'long-field',
      severity: 'warning',
      message: `This question was shortened to ${PARSER_LIMITS.maxFieldChars} characters.`,
      line,
    });
  } else if (prompt.length > PARSER_LIMITS.suspiciousFieldChars) {
    issues.push({
      code: 'long-field',
      severity: 'warning',
      message: 'This question is unusually long. Check the line breaks.',
      line,
    });
  }

  if (answer.length > PARSER_LIMITS.maxFieldChars) {
    answer = answer.slice(0, PARSER_LIMITS.maxFieldChars);
    issues.push({
      code: 'long-field',
      severity: 'warning',
      message: `This answer was shortened to ${PARSER_LIMITS.maxFieldChars} characters.`,
      line,
    });
  }

  if (explanation.length > PARSER_LIMITS.maxFieldChars) {
    explanation = explanation.slice(0, PARSER_LIMITS.maxFieldChars);
    issues.push({
      code: 'long-field',
      severity: 'warning',
      message: `This explanation was shortened to ${PARSER_LIMITS.maxFieldChars} characters.`,
      line,
    });
  }

  const answerKeys = new Set(
    [answer, ...acceptedAnswers]
      .map((value) => answerKey(value))
      .filter(Boolean),
  );
  for (const choice of wrongChoices) {
    if (answerKeys.has(answerKey(choice))) {
      issues.push({
        code: 'wrong-choice-equals-answer',
        severity: 'warning',
        message: `"${choice}" is the same as the correct answer, so it will be ignored.`,
        line,
      });
    }
  }

  const rawWrongCount = input.rawWrongChoiceCount ?? wrongChoices.length;
  if (rawWrongCount > wrongChoices.length) {
    issues.push({
      code: 'duplicate-wrong-choice',
      severity: 'warning',
      message: 'Repeated wrong choices were removed.',
      line,
    });
  }

  if (wrongChoices.length > 0 && wrongChoices.length < MIN_MCQ_DISTRACTORS) {
    issues.push({
      code: 'insufficient-choices',
      severity: 'warning',
      message: `Only ${wrongChoices.length} wrong choice found. Multiple choice will look for distractors in other questions.`,
      line,
    });
  }

  const rawTagCount = input.rawTagCount ?? tags.length;
  if (rawTagCount > tags.length) {
    issues.push({
      code: 'duplicate-tag',
      severity: 'warning',
      message: 'Repeated tags were removed.',
      line,
    });
  }

  return {
    fields: {
      prompt,
      answer,
      acceptedAnswers,
      wrongChoices,
      ...(explanation ? { explanation } : {}),
      tags,
    },
    issues,
  };
}

/**
 * Recomputes "likely duplicate question" warnings across a full item list.
 * Parser-owned warnings are dropped first so editing an item clears stale ones.
 */
export function withDuplicateWarnings<
  T extends { prompt: string; lineStart: number; issues: ParseIssue[] },
>(items: readonly T[]): T[] {
  const seen = new Map<string, number>();
  return items.map((item, index) => {
    const issues = item.issues.filter(
      (issue) => issue.code !== 'duplicate-question',
    );
    const key = promptKey(item.prompt);
    if (key) {
      const previous = seen.get(key);
      if (previous !== undefined) {
        issues.push({
          code: 'duplicate-question',
          severity: 'warning',
          message: `This looks like a repeat of question ${previous + 1}.`,
          itemIndex: index,
          line: item.lineStart,
        });
      } else {
        seen.set(key, index);
      }
    }
    return { ...item, issues };
  });
}
