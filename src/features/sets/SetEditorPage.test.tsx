import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp, resetDatabase, seedSet, draft } from '@/test/renderApp';
import { repositories } from '@/data/repositories';

describe('SetEditorPage', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('adds a question manually', async () => {
    const user = userEvent.setup();
    const { setId } = await seedSet('Manual set', []);
    renderApp(`/sets/${setId}/edit`);

    await user.click(
      await screen.findByRole('button', { name: /Add a question/i }),
    );
    await user.type(
      await screen.findByTestId('question-prompt'),
      'What is water?',
    );
    await user.type(screen.getByTestId('question-answer'), 'H2O');
    await user.click(screen.getByTestId('question-save'));

    await waitFor(async () => {
      const questions = await repositories.questions.listBySet(setId);
      expect(questions.items).toHaveLength(1);
    });
    expect(await screen.findByText('What is water?')).toBeInTheDocument();
  });

  it('edits an existing question', async () => {
    const user = userEvent.setup();
    const { setId } = await seedSet('Editable', [
      draft('Old prompt?', 'Old answer'),
    ]);
    renderApp(`/sets/${setId}/edit`);

    await user.click(
      await screen.findByRole('button', { name: /Edit question: Old prompt/i }),
    );
    const promptField = await screen.findByTestId('question-prompt');
    await user.clear(promptField);
    await user.type(promptField, 'New prompt?');
    await user.click(screen.getByTestId('question-save'));

    await waitFor(async () => {
      const questions = await repositories.questions.listBySet(setId);
      expect(questions.items[0]?.prompt).toBe('New prompt?');
    });
    expect(await screen.findByText('New prompt?')).toBeInTheDocument();
  });

  it('validates required fields before saving', async () => {
    const user = userEvent.setup();
    const { setId } = await seedSet('Validation', []);
    renderApp(`/sets/${setId}/edit`);

    await user.click(
      await screen.findByRole('button', { name: /Add a question/i }),
    );
    await user.click(await screen.findByTestId('question-save'));

    expect(
      await screen.findByText('Add the question text.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Add the correct answer.')).toBeInTheDocument();
    const questions = await repositories.questions.listBySet(setId);
    expect(questions.items).toHaveLength(0);
  });

  it('deletes a question and offers undo', async () => {
    const user = userEvent.setup();
    const { setId } = await seedSet('Deletable', [draft('Delete me?', 'Gone')]);
    renderApp(`/sets/${setId}/edit`);

    await user.click(
      await screen.findByRole('button', {
        name: /Delete question: Delete me/i,
      }),
    );
    await user.click(
      await screen.findByRole('button', { name: 'Delete question' }),
    );

    await waitFor(async () => {
      const questions = await repositories.questions.listBySet(setId);
      expect(questions.items).toHaveLength(0);
    });

    await user.click(await screen.findByRole('button', { name: 'Undo' }));

    await waitFor(async () => {
      const questions = await repositories.questions.listBySet(setId);
      expect(questions.items).toHaveLength(1);
    });
    expect(await screen.findByText('Delete me?')).toBeInTheDocument();
  });

  it('filters questions with the search box', async () => {
    const user = userEvent.setup();
    const { setId } = await seedSet('Searchable', [
      draft('Alpha question?', 'A'),
      draft('Beta question?', 'B'),
    ]);
    renderApp(`/sets/${setId}/edit`);

    await user.type(await screen.findByLabelText('Search questions'), 'alpha');

    expect(screen.getByText('Alpha question?')).toBeInTheDocument();
    expect(screen.queryByText('Beta question?')).not.toBeInTheDocument();
  });
});
