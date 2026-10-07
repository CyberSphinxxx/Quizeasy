import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp, resetDatabase, seedSet, draft } from '@/test/renderApp';
import { repositories } from '@/data/repositories';
import { useStudySession } from '@/features/study/studySessionStore';

const QUESTIONS = [
  draft('What does CPU stand for?', 'Central Processing Unit', {
    wrongChoices: [
      'Central Program Unit',
      'Computer Processing Utility',
      'Core Processing Utility',
    ],
  }),
  draft('What does RAM stand for?', 'Random Access Memory', {
    wrongChoices: [
      'Read Access Memory',
      'Random Allocation Module',
      'Rapid Access Machine',
    ],
  }),
  draft('What does ROM stand for?', 'Read Only Memory', {
    wrongChoices: [
      'Random Output Memory',
      'Read Operating Module',
      'Runtime Object Memory',
    ],
  }),
  draft('What is 2 + 2?', '4'),
];

describe('study flow', () => {
  beforeEach(async () => {
    await resetDatabase();
    useStudySession.getState().clear();
  });

  it('configures a flashcard session, scores it, and retries mistakes', async () => {
    const user = userEvent.setup();
    const { setId } = await seedSet('Computer basics', QUESTIONS);
    renderApp(`/sets/${setId}/study`);

    // Default mode (flashcards) is preselected; shuffling is on by default.
    const startButton = await screen.findByTestId('start-session');
    expect(screen.getByTestId('mode-flashcard')).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('radio', { name: 'All (4)' }));
    await user.click(startButton);

    // First card: reveal the answer, then mark it missed.
    await screen.findByTestId('flashcard-prompt');
    const firstPrompt = screen.getByTestId('flashcard-prompt').textContent;
    await user.click(screen.getByTestId('flashcard-reveal'));
    await user.click(screen.getByTestId('flashcard-missed'));

    // Mark the remaining cards known.
    for (let index = 0; index < QUESTIONS.length - 1; index += 1) {
      await user.click(await screen.findByTestId('flashcard-reveal'));
      await user.click(screen.getByTestId('flashcard-known'));
    }

    await user.click(await screen.findByTestId('session-finish'));

    // 3 of 4 correct.
    await waitFor(() =>
      expect(screen.getByTestId('results-percentage')).toHaveTextContent('75%'),
    );
    expect(screen.getByText(/3 of 4 questions correct/i)).toBeInTheDocument();
    const review = screen.getByRole('region', { name: 'Missed questions' });
    expect(within(review).getByText(firstPrompt ?? '')).toBeInTheDocument();

    // The session is stored complete with attempts recorded.
    const sessions = await repositories.sessions.listAll();
    expect(sessions.items).toHaveLength(1);
    expect(sessions.items[0]?.completedAt).toBeTruthy();
    const attempts = await repositories.attempts.listBySession(
      sessions.items[0]?.id ?? '',
    );
    expect(attempts.items).toHaveLength(4);
    expect(
      attempts.items.filter((attempt) => attempt.result === 'missed'),
    ).toHaveLength(1);

    // Retry only the missed question.
    await user.click(screen.getByTestId('retry-mistakes'));
    await screen.findByTestId('flashcard-prompt');
    expect(screen.getByText(/Question 1 of 1/)).toBeInTheDocument();

    await user.click(screen.getByTestId('flashcard-reveal'));
    await user.click(screen.getByTestId('flashcard-known'));
    await user.click(await screen.findByTestId('session-finish'));

    await waitFor(() =>
      expect(screen.getByTestId('results-percentage')).toHaveTextContent(
        '100%',
      ),
    );
    await waitFor(async () => {
      const all = await repositories.sessions.listAll();
      expect(all.items).toHaveLength(2);
    });
  });

  it('asks a multiple choice question with unique choices and scores it', async () => {
    const user = userEvent.setup();
    const { setId } = await seedSet('MCQ set', QUESTIONS);
    renderApp(`/sets/${setId}/study`);

    await user.click(await screen.findByTestId('mode-multiple-choice'));
    await user.click(screen.getByTestId('start-session'));

    await screen.findByTestId('mcq-choices');
    const choices = within(screen.getByTestId('mcq-choices')).getAllByRole(
      'button',
    );
    expect(choices).toHaveLength(4);

    const labels = choices.map((choice) => choice.textContent ?? '');
    expect(new Set(labels).size).toBe(4);

    // First choice is not necessarily correct: read the session plan instead.
    const plan = useStudySession.getState().plan;
    const first = plan[0];
    const correctChoice = first?.choices?.[first.correctChoiceIndex ?? -1];
    expect(correctChoice).toBeTruthy();
    const target = choices.find((choice) =>
      choice.textContent?.includes(correctChoice ?? ''),
    );
    expect(target).toBeDefined();
    if (target) await user.click(target);

    const feedback = await screen.findByTestId('mcq-feedback');
    expect(within(feedback).getByText('Correct')).toBeInTheDocument();
  });

  it('checks identification answers with forgiving normalization', async () => {
    const user = userEvent.setup();
    const { setId } = await seedSet('Identification set', [
      draft('What does CPU stand for?', 'Central Processing Unit'),
      draft('What does RAM stand for?', 'Random Access Memory'),
    ]);
    renderApp(`/sets/${setId}/study`);

    await user.click(await screen.findByTestId('mode-identification'));
    await user.click(screen.getByTestId('start-session'));

    const input = await screen.findByTestId('identification-input');

    // Type the correct answer (in a messy way) for whatever question is first.
    const questionId = useStudySession.getState().plan[0]?.questionId ?? '';
    const question = await repositories.questions.get(questionId);
    await user.click(input);
    await user.type(input, `   ${(question?.answer ?? '').toUpperCase()}.  `);
    await user.click(screen.getByTestId('identification-submit'));

    const feedback = await screen.findByTestId('identification-feedback');
    expect(within(feedback).getByText('Correct')).toBeInTheDocument();
    expect(within(feedback).getByText(/Correct answer:/)).toBeInTheDocument();
  });

  it('marks clearly wrong identification answers as incorrect', async () => {
    const user = userEvent.setup();
    const { setId } = await seedSet('Wrong answers', [
      draft('What does CPU stand for?', 'Central Processing Unit'),
      draft('What does RAM stand for?', 'Random Access Memory'),
    ]);
    renderApp(`/sets/${setId}/study`);

    await user.click(await screen.findByTestId('mode-identification'));
    await user.click(screen.getByTestId('start-session'));

    const input = await screen.findByTestId('identification-input');
    await user.click(input);
    await user.type(input, 'Something completely wrong');
    await user.click(screen.getByTestId('identification-submit'));

    const feedback = await screen.findByTestId('identification-feedback');
    expect(within(feedback).getByText('Not quite')).toBeInTheDocument();
  });

  it('disables multiple choice when no question has usable distractors', async () => {
    const user = userEvent.setup();
    const { setId } = await seedSet('No distractors', [
      draft('Only question?', 'Only answer'),
    ]);
    renderApp(`/sets/${setId}/study`);

    const mcqCard = await screen.findByTestId('mode-multiple-choice');
    expect(mcqCard).toBeDisabled();
    expect(
      within(mcqCard).getByText(/Add “W:” wrong choices/i),
    ).toBeInTheDocument();
    expect(await screen.findByTestId('mode-flashcard')).not.toBeDisabled();
    await user.click(screen.getByTestId('start-session'));
    expect(await screen.findByTestId('flashcard-prompt')).toBeInTheDocument();
  });

  it('resumes an interrupted session after a reload', async () => {
    const user = userEvent.setup();
    const { setId } = await seedSet('Resumable', QUESTIONS);
    renderApp(`/sets/${setId}/study`);
    await user.click(await screen.findByTestId('start-session'));
    await screen.findByTestId('flashcard-prompt');

    // Simulate a reload: in-memory session state disappears.
    useStudySession.getState().clear();
    renderApp(`/sets/${setId}/study/session`);

    expect(await screen.findByTestId('flashcard-prompt')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/Question 1 of 4/)).toBeInTheDocument(),
    );
  });
});
