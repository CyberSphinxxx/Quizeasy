import { z } from 'zod';
import { isoDateString, nonEmptyString } from './common';
import {
  ATTEMPT_RESULTS,
  FEEDBACK_MODES,
  PRESENTATION_MODES,
  STUDY_MODES,
} from '@/domain/constants';

export const studyModeSchema = z.enum(STUDY_MODES);
export const presentationModeSchema = z.enum(PRESENTATION_MODES);
export const feedbackModeSchema = z.enum(FEEDBACK_MODES);
export const attemptResultSchema = z.enum(ATTEMPT_RESULTS);

export const questionLimitSchema = z.union([
  z.literal('all'),
  z.number().int().min(1).max(500),
]);

/** Everything the user chose before a session started. */
export const studyOptionsSchema = z.object({
  mode: studyModeSchema,
  questionLimit: questionLimitSchema,
  shuffleQuestions: z.boolean(),
  shuffleChoices: z.boolean(),
  feedback: feedbackModeSchema,
  tags: z.array(z.string()).optional(),
  /** Seed used to make shuffling reproducible (also enables resuming). */
  seed: z.string().optional(),
});

/**
 * One planned presentation of one question inside a session. The plan is
 * persisted with the session so a reload can resume the same questions and
 * the same choice order.
 */
export const sessionPlanItemSchema = z.object({
  questionId: nonEmptyString,
  presentationMode: presentationModeSchema,
  choices: z.array(z.string()).optional(),
  correctChoiceIndex: z.number().int().min(0).optional(),
  /** True when fewer than the target number of choices were available. */
  reducedChoices: z.boolean().optional(),
  /** Human-readable notes about how the item was built (e.g. distractors). */
  notes: z.array(z.string()).optional(),
});

/** Why a question was left out of a session. */
export const excludedQuestionSchema = z.object({
  questionId: nonEmptyString,
  reason: z.string(),
});

export const studySessionSchema = z.object({
  id: nonEmptyString,
  setId: nonEmptyString,
  mode: studyModeSchema,
  startedAt: isoDateString,
  completedAt: isoDateString.optional(),
  options: studyOptionsSchema,
  itemIds: z.array(nonEmptyString),
  /** Optional richer plan; older/exported sessions may omit it. */
  plan: z.array(sessionPlanItemSchema).optional(),
  excluded: z.array(excludedQuestionSchema).optional(),
  /** Set when this session was created to retry another session's mistakes. */
  originSessionId: nonEmptyString.optional(),
});

export const studyAttemptSchema = z.object({
  id: nonEmptyString,
  sessionId: nonEmptyString,
  questionId: nonEmptyString,
  presentationMode: presentationModeSchema,
  response: z.string().optional(),
  selectedChoice: z.string().optional(),
  result: attemptResultSchema,
  answeredAt: isoDateString,
});

export type StudyMode = z.infer<typeof studyModeSchema>;
export type PresentationMode = z.infer<typeof presentationModeSchema>;
export type FeedbackMode = z.infer<typeof feedbackModeSchema>;
export type AttemptResult = z.infer<typeof attemptResultSchema>;
export type QuestionLimit = z.infer<typeof questionLimitSchema>;
export type StudyOptions = z.infer<typeof studyOptionsSchema>;
export type SessionPlanItem = z.infer<typeof sessionPlanItemSchema>;
export type ExcludedQuestion = z.infer<typeof excludedQuestionSchema>;
export type StudySession = z.infer<typeof studySessionSchema>;
export type StudyAttempt = z.infer<typeof studyAttemptSchema>;

export const STUDY_MODE_LABELS: Record<StudyMode, string> = {
  flashcard: 'Flashcards',
  'multiple-choice': 'Multiple choice',
  identification: 'Identification',
  mixed: 'Mixed quiz',
};

export const STUDY_MODE_DESCRIPTIONS: Record<StudyMode, string> = {
  flashcard:
    'Read the question, reveal the answer, and mark it known or missed.',
  'multiple-choice': 'Pick the right answer from a set of choices.',
  identification: 'Type the answer in your own words and get instant feedback.',
  mixed: 'A mix of every study style Quizeasy can build from this set.',
};

/** True when the attempt counts as a correct/known answer. */
export function isPositiveResult(result: AttemptResult): boolean {
  return result === 'correct' || result === 'known';
}
