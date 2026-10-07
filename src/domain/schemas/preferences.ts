import { z } from 'zod';
import { FEEDBACK_MODES, STUDY_MODES, THEMES } from '@/domain/constants';

/** Single stored preferences row (there is exactly one local user). */
export const PREFERENCES_ID = 'preferences';

export const preferencesSchema = z.object({
  id: z.literal(PREFERENCES_ID),
  theme: z.enum(THEMES),
  reducedMotion: z.boolean(),
  defaultShuffleQuestions: z.boolean(),
  defaultShuffleChoices: z.boolean(),
  defaultMode: z.enum(STUDY_MODES),
  defaultFeedback: z.enum(FEEDBACK_MODES),
});

export type Preferences = z.infer<typeof preferencesSchema>;
export type Theme = Preferences['theme'];

export const DEFAULT_PREFERENCES: Preferences = {
  id: PREFERENCES_ID,
  theme: 'system',
  reducedMotion: false,
  defaultShuffleQuestions: true,
  defaultShuffleChoices: true,
  defaultMode: 'flashcard',
  defaultFeedback: 'immediate',
};

/** Theme preference is mirrored to localStorage so it can apply pre-paint. */
export const THEME_STORAGE_KEY = 'quizeasy.theme';
