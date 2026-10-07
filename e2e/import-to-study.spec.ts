import { expect, test } from '@playwright/test';
import {
  SAMPLE_QUESTIONS,
  completeFlashcardsAsKnown,
  openSetStudy,
  pasteQuestions,
} from './helpers';

test('first-time visitor imports questions and studies flashcards', async ({
  page,
}) => {
  await page.goto('/');

  // Empty library teaches the next step.
  await expect(
    page.getByText('Paste your questions to get started'),
  ).toBeVisible();

  await pasteQuestions(page, SAMPLE_QUESTIONS);

  await expect(page.getByText('4 questions found')).toBeVisible();
  await expect(
    page.getByTestId('import-counts').getByText('4 ready'),
  ).toBeVisible();
  await expect(page.locator('[data-testid^="import-item-"]')).toHaveCount(4);

  await page.getByTestId('import-save').click();

  // Set detail with mode eligibility.
  await expect(page).toHaveURL(/#\/sets\//);
  await expect(page.getByTestId('set-meta')).toContainText('4 questions');

  await openSetStudy(page);
  await expect(page.getByTestId('mode-flashcard')).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.getByTestId('start-session').click();
  await expect(page.getByText('Question 1 of 4')).toBeVisible();

  await completeFlashcardsAsKnown(page);

  // 100% because every card was marked known.
  await expect(page.getByTestId('results-percentage')).toHaveText('100%');
  await expect(
    page.getByText('No mistakes to retry — nice work.'),
  ).toBeVisible();
});

test('malformed entries can be fixed or excluded before saving', async ({
  page,
}) => {
  await pasteQuestions(
    page,
    `Q: Good one?
A: Yes

Q: Broken one?

Q: Another good one?
A: Also yes`,
  );

  await expect(page.getByText('3 questions found')).toBeVisible();
  await expect(
    page.getByTestId('import-counts').getByText('1 need fixing'),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Exclude the entry that needs fixing/i }),
  ).toBeVisible();

  // Fix it inline instead of excluding it.
  await page.getByRole('button', { name: 'Edit' }).nth(1).click();
  await page.getByLabel('Correct answer').fill('Fixed by hand');
  await page.getByRole('button', { name: 'Apply changes' }).click();

  await expect(
    page.getByTestId('import-counts').getByText('3 ready'),
  ).toBeVisible();

  await page.getByTestId('import-save').click();
  await expect(page).toHaveURL(/#\/sets\//);
  await expect(page.getByTestId('set-meta')).toContainText('3 questions');
  await page.getByRole('link', { name: 'Edit questions' }).click();
  await expect(page.getByText('Fixed by hand')).toBeVisible();
});
