import { z } from 'zod';
import { isoDateString } from './common';
import { quizSetSchema } from './set';
import { questionSchema } from './question';
import { studyAttemptSchema, studySessionSchema } from './study';
import { preferencesSchema } from './preferences';
import { BACKUP_FORMAT, SET_EXPORT_FORMAT } from '@/domain/constants';

/** A single exported set: the unit users share and re-import. */
export const setExportFileSchema = z.object({
  format: z.literal(SET_EXPORT_FORMAT),
  schemaVersion: z.number().int().min(1),
  exportedAt: isoDateString,
  set: quizSetSchema,
  questions: z.array(questionSchema),
});

/** A complete local backup. */
export const backupFileSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  schemaVersion: z.number().int().min(1),
  exportedAt: isoDateString,
  sets: z.array(quizSetSchema),
  questions: z.array(questionSchema),
  sessions: z.array(studySessionSchema),
  attempts: z.array(studyAttemptSchema),
  preferences: preferencesSchema.optional(),
});

export type SetExportFile = z.infer<typeof setExportFileSchema>;
export type BackupFile = z.infer<typeof backupFileSchema>;

export const SET_EXPORT_KEYS = [
  'format',
  'schemaVersion',
  'exportedAt',
  'set',
  'questions',
] as const;

export const BACKUP_KEYS = [
  'format',
  'schemaVersion',
  'exportedAt',
  'sets',
  'questions',
  'sessions',
  'attempts',
  'preferences',
] as const;
