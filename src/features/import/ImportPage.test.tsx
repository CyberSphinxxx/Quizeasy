import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp, resetDatabase } from '@/test/renderApp';
import { repositories } from '@/data/repositories';

const SAMPLE = `Q: What does CPU stand for?
A: Central Processing Unit
W: Central Program Unit
W: Computer Processing Utility
W: Core Processing Utility

Q: What does RAM stand for?
A: Random Access Memory`;

describe('ImportPage', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('parses pasted text and shows what will be saved', async () => {
    const user = userEvent.setup();
    renderApp('/import');

    const textarea = await screen.findByTestId('import-textarea');
    await user.click(textarea);
    await user.paste(SAMPLE);

    await waitFor(() =>
      expect(screen.getByText('2 questions found')).toBeInTheDocument(),
    );
    const counts = screen.getByTestId('import-counts');
    expect(within(counts).getByText('2 ready')).toBeInTheDocument();
    expect(within(counts).getByText('2 will be saved')).toBeInTheDocument();

    const items = await screen.findAllByTestId(/^import-item-/);
    expect(items).toHaveLength(2);
    expect(
      screen.getByDisplayValue('What does CPU stand for'),
    ).toBeInTheDocument();
  });

  it('saves the reviewed questions into a new set', async () => {
    const user = userEvent.setup();
    renderApp('/import');

    await user.click(await screen.findByTestId('import-textarea'));
    await user.paste(SAMPLE);
    await screen.findByText('2 questions found');

    await user.click(screen.getByTestId('import-save'));

    await waitFor(async () => {
      const sets = await repositories.sets.list();
      expect(sets.items).toHaveLength(1);
    });

    const sets = await repositories.sets.list();
    const setId = sets.items[0]?.id;
    expect(setId).toBeDefined();
    const questions = await repositories.questions.listBySet(setId ?? '');
    expect(questions.items).toHaveLength(2);
    expect(questions.items[0]?.answer).toBe('Central Processing Unit');
    expect(questions.items[0]?.wrongChoices).toHaveLength(3);
  });

  it('flags a malformed entry and lets the user exclude it', async () => {
    const user = userEvent.setup();
    renderApp('/import');

    await user.click(await screen.findByTestId('import-textarea'));
    await user.paste(`Q: Good question?
A: Yes

Q: Broken question?

Q: Another good one?
A: Also yes`);

    await screen.findByText('3 questions found');
    const counts = screen.getByTestId('import-counts');
    expect(within(counts).getByText('1 need fixing')).toBeInTheDocument();

    await user.click(
      await screen.findByRole('button', {
        name: /Exclude the entry that needs fixing/i,
      }),
    );

    await waitFor(() =>
      expect(
        within(screen.getByTestId('import-counts')).getByText(
          '2 will be saved',
        ),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByTestId('import-save'));

    await waitFor(async () => {
      const sets = await repositories.sets.list();
      expect(sets.items).toHaveLength(1);
    });
    const questions = await repositories.questions.listAll();
    expect(questions.items).toHaveLength(2);
  });

  it('lets the user fix an invalid entry inline and save it', async () => {
    const user = userEvent.setup();
    renderApp('/import');

    await user.click(await screen.findByTestId('import-textarea'));
    await user.paste('Q: Missing answer?');

    await screen.findByText('1 question found');
    expect(
      screen.getAllByText(/No answer found for this question/i).length,
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const answerField = await screen.findByLabelText('Correct answer');
    await user.type(answerField, 'Now it has one');
    await user.click(screen.getByRole('button', { name: 'Apply changes' }));

    await waitFor(() =>
      expect(
        within(screen.getByTestId('import-counts')).getByText('1 ready'),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText(/No answer found for this question/i)).toBeNull();

    await user.click(screen.getByTestId('import-save'));
    await waitFor(async () => {
      const questions = await repositories.questions.listAll();
      expect(questions.items[0]?.answer).toBe('Now it has one');
    });
  });

  it('explains when the pasted text cannot be parsed', async () => {
    const user = userEvent.setup();
    renderApp('/import');

    await user.click(await screen.findByTestId('import-textarea'));
    await user.paste('just some notes about biology');

    expect(
      await screen.findByText(/could not find questions/i),
    ).toBeInTheDocument();
    // Nothing to save, so the save bar is not offered at all.
    expect(screen.queryByTestId('import-save')).toBeNull();
  });

  it('warns about likely duplicate questions without dropping them', async () => {
    const user = userEvent.setup();
    renderApp('/import');

    await user.click(await screen.findByTestId('import-textarea'));
    await user.paste(`Q: What is RAM?
A: Random Access Memory

Q: what is ram
A: Random access memory.`);

    await screen.findByText('2 questions found');
    expect(
      screen.getAllByText(/looks like a repeat of question 1/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByTestId(/^import-item-/)).toHaveLength(2);
  });
});
