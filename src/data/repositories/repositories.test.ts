import { afterEach, describe, expect, it } from 'vitest';
import { QuizeasyDatabase } from '@/data/db/database';
import { ValidationError } from '@/data/db/validation';
import { createRepositories, NotFoundError } from './index';
import type { RepositoryBundle } from './types';
import { DEFAULT_PREFERENCES } from '@/domain/schemas/preferences';
import { makeDraft, makeQuestion } from '@/test/factories';

let databaseCounter = 0;
const openDatabases: QuizeasyDatabase[] = [];

function createTestDatabase(): RepositoryBundle {
  databaseCounter += 1;
  const db = new QuizeasyDatabase(`quizeasy-test-${databaseCounter}`);
  openDatabases.push(db);
  return createRepositories(db);
}

function currentDatabase(): QuizeasyDatabase {
  const db = openDatabases[openDatabases.length - 1];
  if (!db) throw new Error('no test database');
  return db;
}

afterEach(async () => {
  while (openDatabases.length > 0) {
    const db = openDatabases.pop();
    if (db) await db.delete();
  }
});

describe('set repository', () => {
  it('creates and reads back a set', async () => {
    const repositories = createTestDatabase();
    const created = await repositories.sets.create({ title: 'Biology' });
    const loaded = await repositories.sets.get(created.id);

    expect(loaded?.title).toBe('Biology');
    expect(loaded?.schemaVersion).toBe(1);
    expect(loaded?.createdAt).toBeTruthy();
  });

  it('lists sets newest first', async () => {
    const repositories = createTestDatabase();
    const first = await repositories.sets.create({ title: 'First' });
    const second = await repositories.sets.create({ title: 'Second' });
    await repositories.sets.rename(first.id, 'First updated');

    const list = await repositories.sets.list();
    expect(list.skipped).toBe(0);
    expect(list.items.map((set) => set.id)).toEqual([first.id, second.id]);
  });

  it('updates title, description, and tags', async () => {
    const repositories = createTestDatabase();
    const created = await repositories.sets.create({ title: 'Draft' });
    const updated = await repositories.sets.update(created.id, {
      title: '  Final title  ',
      description: 'About cells',
      tags: ['biology', 'biology', ' cell '],
    });

    expect(updated.title).toBe('Final title');
    expect(updated.description).toBe('About cells');
    expect(updated.tags).toEqual(['biology', 'cell']);
  });

  it('throws when updating a set that does not exist', async () => {
    const repositories = createTestDatabase();
    await expect(
      repositories.sets.update('missing', { title: 'Nope' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects invalid data before it reaches storage', async () => {
    const repositories = createTestDatabase();
    await expect(
      repositories.sets.createWithId({
        id: 'bad-set',
        schemaVersion: 1,
        title: '   ',
        createdAt: 'not-a-date',
        updatedAt: 'not-a-date',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(await repositories.sets.counts()).toEqual({
      sets: 0,
      questions: 0,
      sessions: 0,
      attempts: 0,
    });
  });

  it('duplicates a set with fresh question IDs', async () => {
    const repositories = createTestDatabase();
    const source = await repositories.sets.create({ title: 'Source' });
    await repositories.questions.createMany(source.id, [
      makeDraft({ prompt: 'One?', answer: '1' }),
      makeDraft({ prompt: 'Two?', answer: '2' }),
    ]);

    const copy = await repositories.sets.duplicate(source.id);
    const originalQuestions = await repositories.questions.listBySet(source.id);
    const copiedQuestions = await repositories.questions.listBySet(copy.id);

    expect(copy.title).toBe('Source (copy)');
    expect(copy.id).not.toBe(source.id);
    expect(copiedQuestions.items).toHaveLength(2);
    expect(copiedQuestions.items[0]?.id).not.toBe(
      originalQuestions.items[0]?.id,
    );
    expect(copiedQuestions.items[0]?.answer).toBe('1');
  });

  it('cascade-deletes questions, sessions, and attempts with the set', async () => {
    const repositories = createTestDatabase();
    const set = await repositories.sets.create({ title: 'To delete' });
    const questions = await repositories.questions.createMany(set.id, [
      makeDraft(),
    ]);
    const question = questions[0];
    if (!question) throw new Error('missing question');

    const session = await repositories.sessions.create({
      setId: set.id,
      mode: 'flashcard',
      options: {
        mode: 'flashcard',
        questionLimit: 'all',
        shuffleQuestions: false,
        shuffleChoices: false,
        feedback: 'immediate',
      },
      plan: [{ questionId: question.id, presentationMode: 'flashcard' }],
    });
    await repositories.attempts.record({
      sessionId: session.id,
      questionId: question.id,
      presentationMode: 'flashcard',
      result: 'known',
    });

    await repositories.sets.remove(set.id);

    expect(await repositories.sets.counts()).toEqual({
      sets: 0,
      questions: 0,
      sessions: 0,
      attempts: 0,
    });
  });

  it('records when a set was last studied', async () => {
    const repositories = createTestDatabase();
    const set = await repositories.sets.create({ title: 'Studied' });
    await repositories.sets.touchStudied(set.id, '2026-02-02T10:00:00.000Z');
    const loaded = await repositories.sets.get(set.id);
    expect(loaded?.lastStudiedAt).toBe('2026-02-02T10:00:00.000Z');
  });

  it('persists across a database reopen', async () => {
    const repositories = createTestDatabase();
    const set = await repositories.sets.create({ title: 'Persistent' });
    await repositories.questions.createMany(set.id, [makeDraft()]);
    const db = currentDatabase();
    const name = db.name;
    db.close();

    const reopened = createRepositories(new QuizeasyDatabase(name));
    const list = await reopened.sets.list();
    const questions = await reopened.questions.listBySet(set.id);

    expect(list.items).toHaveLength(1);
    expect(list.items[0]?.title).toBe('Persistent');
    expect(questions.items).toHaveLength(1);
  });

  it('skips corrupted rows instead of failing the whole read', async () => {
    const repositories = createTestDatabase();
    const good = await repositories.sets.create({ title: 'Good' });
    // Simulate a row written by a future/older version of Quizeasy.
    await currentDatabase().sets.put({
      id: 'corrupt',
      schemaVersion: 1,
      title: 'Corrupt',
      createdAt: 'nope',
      updatedAt: 'nope',
    } as never);

    const list = await repositories.sets.list();
    expect(list.items.map((set) => set.id)).toEqual([good.id]);
    expect(list.skipped).toBe(1);
  });
});

describe('question repository', () => {
  it('creates, lists, updates, and removes questions', async () => {
    const repositories = createTestDatabase();
    const set = await repositories.sets.create({ title: 'Questions' });

    const created = await repositories.questions.create(
      set.id,
      makeDraft({ prompt: 'What is RAM?', answer: 'Random Access Memory' }),
    );
    expect(created.source?.type).toBe('manual');

    const updated = await repositories.questions.update(created.id, {
      prompt: 'What is RAM (volatile)?',
      answer: 'Random Access Memory',
      acceptedAnswers: ['RAM'],
      wrongChoices: ['Read Only Memory'],
      explanation: 'Volatile memory',
      tags: ['memory'],
    });
    expect(updated.prompt).toBe('What is RAM (volatile)?');
    expect(updated.acceptedAnswers).toEqual(['RAM']);
    expect(updated.explanation).toBe('Volatile memory');
    expect(updated.source?.type).toBe('manual');

    await repositories.questions.remove(created.id);
    const list = await repositories.questions.listBySet(set.id);
    expect(list.items).toHaveLength(0);
  });

  it('stores imported questions with their source', async () => {
    const repositories = createTestDatabase();
    const set = await repositories.sets.create({ title: 'Imported' });
    const [question] = await repositories.questions.createMany(set.id, [
      makeDraft({ prompt: 'Paste me', answer: 'Yes' }),
    ]);
    expect(question?.source?.type).toBe('paste-import');
  });

  it('counts questions per set', async () => {
    const repositories = createTestDatabase();
    const set = await repositories.sets.create({ title: 'Counted' });
    await repositories.questions.createMany(set.id, [makeDraft(), makeDraft()]);
    expect(await repositories.questions.countBySet(set.id)).toBe(2);
  });

  it('reports per-set stats for the library', async () => {
    const repositories = createTestDatabase();
    const set = await repositories.sets.create({ title: 'Library set' });
    await repositories.questions.createMany(set.id, [makeDraft(), makeDraft()]);
    const stats = await repositories.sets.listWithStats();
    expect(stats.items[0]?.questionCount).toBe(2);
    expect(stats.items[0]?.sessionCount).toBe(0);
  });
});

describe('session and attempt repositories', () => {
  it('creates a session, records attempts, and completes it', async () => {
    const repositories = createTestDatabase();
    const set = await repositories.sets.create({ title: 'Study' });
    const [question] = await repositories.questions.createMany(set.id, [
      makeDraft(),
    ]);
    if (!question) throw new Error('missing question');

    const session = await repositories.sessions.create({
      setId: set.id,
      mode: 'flashcard',
      options: {
        mode: 'flashcard',
        questionLimit: 'all',
        shuffleQuestions: false,
        shuffleChoices: false,
        feedback: 'immediate',
        seed: 'seed-1',
      },
      plan: [{ questionId: question.id, presentationMode: 'flashcard' }],
    });

    expect(session.completedAt).toBeUndefined();
    expect(session.itemIds).toEqual([question.id]);
    expect(await repositories.sessions.findActiveForSet(set.id)).toBeDefined();

    await repositories.attempts.record({
      sessionId: session.id,
      questionId: question.id,
      presentationMode: 'flashcard',
      result: 'known',
    });
    const attempts = await repositories.attempts.listBySession(session.id);
    expect(attempts.items).toHaveLength(1);
    expect(attempts.items[0]?.result).toBe('known');

    await repositories.sessions.complete(
      session.id,
      '2026-03-03T00:00:00.000Z',
    );
    expect(
      await repositories.sessions.findActiveForSet(set.id),
    ).toBeUndefined();
    expect(
      await repositories.sessions.latestCompletedForSet(set.id),
    ).toBeDefined();
  });
});

describe('preferences repository', () => {
  it('returns defaults before anything is saved', async () => {
    const repositories = createTestDatabase();
    expect(await repositories.preferences.get()).toEqual(DEFAULT_PREFERENCES);
  });

  it('saves and updates preferences', async () => {
    const repositories = createTestDatabase();
    await repositories.preferences.update({ theme: 'dark' });
    const loaded = await repositories.preferences.get();
    expect(loaded.theme).toBe('dark');
    expect(loaded.defaultShuffleQuestions).toBe(
      DEFAULT_PREFERENCES.defaultShuffleQuestions,
    );
  });

  it('falls back to defaults for corrupted preference rows', async () => {
    const repositories = createTestDatabase();
    await currentDatabase().preferences.put({
      id: 'preferences',
      theme: 'neon',
    } as never);
    expect(await repositories.preferences.get()).toEqual(DEFAULT_PREFERENCES);
  });
});

describe('bulk operations', () => {
  it('adds existing sets and questions (used by restore)', async () => {
    const repositories = createTestDatabase();
    const question = makeQuestion({ id: 'imported-q', setId: 'imported-set' });
    await repositories.questions.addExisting([question]);
    expect(await repositories.questions.countBySet('imported-set')).toBe(1);
  });
});
