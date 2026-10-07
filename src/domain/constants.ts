/** Canonical domain constants shared by schemas, study engine, and storage. */

/** Version of the persisted/exported Quizeasy data schema. */
export const SCHEMA_VERSION = 1;

export const SET_EXPORT_FORMAT = 'quizeasy-set' as const;
export const BACKUP_FORMAT = 'quizeasy-backup' as const;

export const STUDY_MODES = [
  'flashcard',
  'multiple-choice',
  'identification',
  'mixed',
] as const;

export const PRESENTATION_MODES = [
  'flashcard',
  'multiple-choice',
  'identification',
] as const;

export const ATTEMPT_RESULTS = [
  'correct',
  'incorrect',
  'skipped',
  'known',
  'missed',
] as const;

export const FEEDBACK_MODES = ['immediate', 'delayed'] as const;

export const QUESTION_SOURCES = [
  'manual',
  'paste-import',
  'file-import',
  'future-ai',
] as const;

export const THEMES = ['system', 'light', 'dark'] as const;

/** Number of choices a multiple-choice question aims for (1 answer + 3). */
export const TARGET_MCQ_CHOICES = 4;

/** Minimum distractors needed before a multiple-choice question is eligible. */
export const MIN_MCQ_DISTRACTORS = 2;

/** Answers longer than this are considered poor free-response/choice material. */
export const MAX_FREE_RESPONSE_ANSWER_LENGTH = 80;
export const MAX_CHOICE_ANSWER_LENGTH = 90;
export const MAX_FREE_RESPONSE_WORDS = 8;
