import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { QuizeasyDatabase } from '@/data/db/database';
import { createRepositories } from '@/data/repositories';
import type { RepositoryBundle } from '@/data/repositories';
import { itemStatus, parseQuizText } from '@/parser';
import {
  buildSetExport,
  importSetFile,
  validateSetExport,
} from './setTransfer';
import {
  buildBackupFile,
  collectBackupPayload,
  restoreBackupPayload,
  validateBackupFile,
} from './backupService';

// The README tells users to import these two files, so they are verified here
// rather than only shipped. Vitest runs from the repository root, and
// `import.meta.url` is an http:// URL inside the jsdom environment.
const EXAMPLES_DIR = path.join(process.cwd(), 'examples');
const SAMPLE_IMPORT_FILE = path.join(EXAMPLES_DIR, 'sample-import.txt');
const SAMPLE_SET_FILE = path.join(EXAMPLES_DIR, 'sample-set.quizeasy.json');

function readSample(file: string): string {
  return readFileSync(file, 'utf8');
}

/** Parses the shipped set export the same way the import button does. */
function readSampleSetExport() {
  const raw: unknown = JSON.parse(readSample(SAMPLE_SET_FILE));
  const validated = validateSetExport(raw);
  if (!validated.ok) throw new Error(validated.message);
  return validated;
}

let databaseCounter = 0;
const openDatabases: QuizeasyDatabase[] = [];

function createTestDatabase(): RepositoryBundle {
  databaseCounter += 1;
  const database = new QuizeasyDatabase(`quizeasy-example-${databaseCounter}`);
  openDatabases.push(database);
  return createRepositories(database);
}

afterEach(async () => {
  while (openDatabases.length > 0) {
    const database = openDatabases.pop();
    if (database) await database.delete();
  }
});

describe('shipped example artifacts', () => {
  it('parses the sample import text into four ready questions', () => {
    const result = parseQuizText(readSample(SAMPLE_IMPORT_FILE));

    expect(result.detectedFormat).toBe('labelled');
    expect(result.errors).toEqual([]);
    expect(result.truncated).toBe(false);
    expect(result.items).toHaveLength(4);

    for (const item of result.items) {
      expect(itemStatus(item.issues)).toBe('valid');
    }

    const cpu = result.items[0];
    expect(cpu?.prompt).toBe('What does CPU stand for?');
    expect(cpu?.answer).toBe('Central Processing Unit');
    expect(cpu?.wrongChoices).toHaveLength(3);
    expect(cpu?.explanation).toBeTruthy();
    expect(cpu?.tags).toEqual(['computer', 'hardware']);
  });

  it('accepts the sample set export with no warnings', () => {
    const validated = readSampleSetExport();

    expect(validated.warnings).toEqual([]);
    expect(validated.file.set.title).toBe('Computer Basics');
    expect(validated.file.questions).toHaveLength(4);
    // Every question can be studied as multiple choice.
    for (const question of validated.file.questions) {
      expect(question.wrongChoices.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('imports the sample set, then re-imports it without overwriting', async () => {
    const repositories = createTestDatabase();
    const { file } = readSampleSetExport();

    const first = await importSetFile(repositories, file);
    expect(first.set.title).toBe('Computer Basics');
    expect(first.importedQuestions).toBe(4);
    expect(first.remappedIds).toBe(0);
    expect(
      (await repositories.questions.listBySet(first.set.id)).items,
    ).toHaveLength(4);

    // The same file twice must merge, never replace what is already there.
    const second = await importSetFile(repositories, file);
    expect(second.set.id).not.toBe(first.set.id);
    expect(second.remappedIds).toBeGreaterThan(0);
    expect((await repositories.sets.list()).items).toHaveLength(2);
    expect((await repositories.questions.listAll()).items).toHaveLength(8);
  });

  it('round-trips the sample set through export, backup, and restore', async () => {
    const repositories = createTestDatabase();
    const { file } = readSampleSetExport();
    const imported = await importSetFile(repositories, file);
    const questions = await repositories.questions.listBySet(imported.set.id);

    // Re-exporting what was imported must validate again (lossless round trip).
    const reExported = validateSetExport(
      JSON.parse(
        JSON.stringify(buildSetExport(imported.set, questions.items)),
      ) as unknown,
    );
    expect(reExported.ok).toBe(true);

    // The whole-library backup must validate as real JSON, then restore into a
    // library that has nothing in it.
    const backup = validateBackupFile(
      JSON.parse(
        JSON.stringify(
          buildBackupFile(await collectBackupPayload(repositories)),
        ),
      ) as unknown,
    );
    expect(backup.ok).toBe(true);
    if (!backup.ok) throw new Error(backup.message);

    const fresh = createTestDatabase();
    const summary = await restoreBackupPayload(fresh, backup.file);
    expect(summary.sets).toBe(1);
    expect(summary.questions).toBe(4);
    expect(summary.remappedIds).toBe(0);
    expect((await fresh.questions.listAll()).items).toHaveLength(4);

    // Restoring the same backup again merges instead of wiping.
    const again = await restoreBackupPayload(fresh, backup.file);
    expect(again.remappedIds).toBeGreaterThan(0);
    expect((await fresh.sets.list()).items).toHaveLength(2);
    expect((await fresh.questions.listAll()).items).toHaveLength(8);
  });
});
