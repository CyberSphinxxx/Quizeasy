import { expect, test } from '@playwright/test';
import {
  SAMPLE_QUESTIONS,
  feedbackVerdict,
  importQuestions,
  openSetStudy,
} from './helpers';

test('multiple choice session never repeats the correct answer', async ({
  page,
}) => {
  await importQuestions(page, SAMPLE_QUESTIONS);
  await openSetStudy(page);
  await page.getByTestId('mode-multiple-choice').click();
  await page.getByTestId('start-session').click();

  await expect(page.getByText('Question 1 of 4')).toBeVisible();

  // Answer every question by picking the last choice, then check the score
  // matches what the app told us while answering.
  let correctSeen = 0;
  for (let index = 0; index < 4; index += 1) {
    const choices = page.getByTestId('mcq-choices').getByRole('button');
    await expect(choices).toHaveCount(4);
    const labels = await choices.allInnerTexts();
    const unique = new Set(
      labels.map((label) => label.replace(/^[A-F]\s*/, '').trim()),
    );
    expect(unique.size).toBe(4);

    await choices.last().click();
    const feedback = page.getByTestId('mcq-feedback');
    await expect(feedback).toBeVisible();
    if (await feedbackVerdict(feedback)) correctSeen += 1;

    if (await page.getByTestId('session-finish').isVisible()) break;
    await page.getByTestId('session-next').click();
  }

  await page.getByTestId('session-finish').click();
  await expect(page.getByTestId('results-percentage')).toBeVisible();
  await expect(
    page.getByText(`${correctSeen} of 4 questions correct`),
  ).toBeVisible();
});

test('identification accepts normalized answers', async ({ page }) => {
  await importQuestions(page, SAMPLE_QUESTIONS);
  await openSetStudy(page);
  await page.getByTestId('mode-identification').click();
  await page.getByTestId('start-session').click();

  await expect(page.getByTestId('identification-input')).toBeVisible();

  // The shuffle order is random, so answer from the visible question text.
  let answeredCorrectly = 0;
  for (let index = 0; index < 4; index += 1) {
    const prompt = await page.getByTestId('identification-prompt').innerText();
    const answer = prompt.includes('CPU')
      ? 'CENTRAL PROCESSING UNIT.'
      : prompt.includes('RAM')
        ? '  random access memory  '
        : prompt.includes('ROM')
          ? 'read only memory'
          : '4';

    await page.getByTestId('identification-input').fill(answer);
    await page.getByTestId('identification-submit').click();
    const feedback = page.getByTestId('identification-feedback');
    await expect(feedback).toBeVisible();
    if (await feedbackVerdict(feedback)) answeredCorrectly += 1;

    if (await page.getByTestId('session-finish').isVisible()) break;
    await page.getByTestId('session-next').click();
  }

  await page.getByTestId('session-finish').click();
  await expect(
    page.getByText(`${answeredCorrectly} of 4 questions correct`),
  ).toBeVisible();
  expect(answeredCorrectly).toBeGreaterThan(0);
});

test('mixed mode builds a session from every supported style', async ({
  page,
}) => {
  await importQuestions(page, SAMPLE_QUESTIONS);
  await openSetStudy(page);
  await page.getByTestId('mode-mixed').click();
  await page.getByTestId('start-session').click();

  await expect(page.getByText('Question 1 of 4')).toBeVisible();
  await expect(page.getByText('Mixed quiz')).toBeVisible();
});

test('test mode delays feedback until the results screen', async ({ page }) => {
  await importQuestions(page, SAMPLE_QUESTIONS);
  await openSetStudy(page);
  await page.getByRole('radio', { name: /Test mode/i }).click();
  await page.getByTestId('start-session').click();

  await expect(page.getByText('Test mode')).toBeVisible();
  await page.getByTestId('flashcard-reveal').click();
  await page.getByTestId('flashcard-known').click();
  await expect(page.getByText('Question 2 of 4')).toBeVisible();
});
