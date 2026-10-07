import { SCHEMA_VERSION, SET_EXPORT_FORMAT } from '@/domain/constants';
import { formatZodError } from '@/domain/schemas/common';
import type { Question } from '@/domain/schemas/question';
import { QUESTION_KEYS, questionSchema } from '@/domain/schemas/question';
import type { QuizSet } from '@/domain/schemas/set';
import { QUIZ_SET_KEYS, quizSetSchema } from '@/domain/schemas/set';
import {
  SET_EXPORT_KEYS,
  setExportFileSchema,
  type SetExportFile,
} from '@/domain/schemas/transfer';
import type { RepositoryBundle } from '@/data/repositories';
import { createId, nowIso } from '@/lib/utils';
import { downloadTextFile, sanitizeFilename } from '@/lib/files';

export interface ImportReport {
  set: QuizSet;
  importedQuestions: number;
  remappedIds: number;
  warnings: string[];
}

/** Builds the JSON payload for one exported set. */
export function buildSetExport(
  set: QuizSet,
  questions: readonly Question[],
): SetExportFile {
  return {
    format: SET_EXPORT_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: nowIso(),
    set: { ...set },
    questions: questions.map((question) => ({ ...question })),
  };
}

/** Builds and downloads the export file for one set. Returns the filename. */
export function downloadSetExport(
  set: QuizSet,
  questions: readonly Question[],
): string {
  const file = buildSetExport(set, questions);
  const filename = `${sanitizeFilename(set.title)}.quizeasy.json`;
  downloadTextFile(filename, `${JSON.stringify(file, null, 2)}\n`);
  return filename;
}

/** Lists keys Quizeasy does not recognise so nothing is dropped silently. */
export function collectUnknownKeys(
  value: unknown,
  knownKeys: readonly string[],
  label: string,
): string[] {
  if (typeof value !== 'object' || value === null) return [];
  const known = new Set(knownKeys);
  return Object.keys(value)
    .filter((key) => !known.has(key))
    .map((key) => `${label} field "${key}" was ignored.`);
}

export type SetExportValidation =
  | { ok: true; file: SetExportFile; warnings: string[] }
  | { ok: false; message: string };

/** Validates a parsed JSON value as a Quizeasy set export. */
export function validateSetExport(raw: unknown): SetExportValidation {
  const result = setExportFileSchema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      message: `That file is not a Quizeasy set export. ${formatZodError(result.error)}`,
    };
  }

  const file = result.data;
  if (file.schemaVersion > SCHEMA_VERSION) {
    return {
      ok: false,
      message: `That export was created by a newer version of Quizeasy (schema ${file.schemaVersion}). Update Quizeasy, then import it again.`,
    };
  }

  const warnings = [
    ...collectUnknownKeys(raw, SET_EXPORT_KEYS, 'Export'),
    ...collectUnknownKeys(file.set, QUIZ_SET_KEYS, 'Set'),
  ];
  const questionWarnings = new Set<string>();
  for (const question of file.questions) {
    for (const warning of collectUnknownKeys(
      question,
      QUESTION_KEYS,
      'Question',
    )) {
      questionWarnings.add(warning);
    }
  }
  warnings.push(...questionWarnings);

  return { ok: true, file, warnings };
}

export interface ImportSetOptions {
  /** When set, the questions are appended to this existing local set. */
  targetSetId?: string;
}

/**
 * Imports an exported set.
 *
 * Colliding IDs are remapped rather than overwriting unrelated local data, so
 * importing the same file twice never destroys existing sets.
 */
export async function importSetFile(
  repositories: RepositoryBundle,
  file: SetExportFile,
  options: ImportSetOptions = {},
): Promise<ImportReport> {
  const warnings = [
    ...collectUnknownKeys(file, SET_EXPORT_KEYS, 'Export'),
    ...collectUnknownKeys(file.set, QUIZ_SET_KEYS, 'Set'),
  ];
  let remappedIds = 0;
  const now = nowIso();

  const target = options.targetSetId
    ? await repositories.sets.get(options.targetSetId)
    : undefined;
  if (options.targetSetId && !target) {
    throw new Error(
      'That set no longer exists. Refresh the library and try again.',
    );
  }

  const collidingQuestionIds = target
    ? new Set(
        (await repositories.questions.listBySet(target.id)).items.map(
          (q) => q.id,
        ),
      )
    : await repositories.questions.allIds();

  const existingSet = target
    ? undefined
    : await repositories.sets.get(file.set.id);

  let destination: QuizSet;
  if (target) {
    destination = target;
  } else if (existingSet) {
    remappedIds += 1;
    warnings.push(
      'A set with this ID already exists, so the import was saved as a separate set.',
    );
    destination = {
      id: createId(),
      schemaVersion: SCHEMA_VERSION,
      title: file.set.title,
      createdAt: file.set.createdAt,
      updatedAt: now,
      ...(file.set.description ? { description: file.set.description } : {}),
      ...(file.set.tags ? { tags: file.set.tags } : {}),
    };
  } else {
    destination = {
      ...file.set,
      schemaVersion: SCHEMA_VERSION,
      updatedAt: now,
    };
  }

  const seenIds = new Set<string>();
  const questions: Question[] = file.questions.map((question) => {
    const collision =
      collidingQuestionIds.has(question.id) || seenIds.has(question.id);
    const id = collision ? createId() : question.id;
    if (collision) remappedIds += 1;
    seenIds.add(id);
    return { ...question, id, setId: destination.id, updatedAt: now };
  });

  const setResult = quizSetSchema.safeParse(destination);
  if (!setResult.success) {
    throw new Error(
      `That file contains a set Quizeasy cannot read: ${formatZodError(setResult.error)}`,
    );
  }
  for (const question of questions) {
    const result = questionSchema.safeParse(question);
    if (!result.success) {
      throw new Error(
        `That file contains a question Quizeasy cannot read: ${formatZodError(result.error)}`,
      );
    }
  }

  if (target) {
    await repositories.questions.addExisting(questions);
    return {
      set: target,
      importedQuestions: questions.length,
      remappedIds,
      warnings,
    };
  }

  await repositories.sets.createWithId(setResult.data);
  try {
    await repositories.questions.addExisting(questions);
  } catch (error) {
    // Never leave a half-imported set behind.
    await repositories.sets.remove(destination.id);
    throw error;
  }

  return {
    set: setResult.data,
    importedQuestions: questions.length,
    remappedIds,
    warnings,
  };
}
