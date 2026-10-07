import { expect, test, type Page } from '@playwright/test';
import {
  SAMPLE_QUESTIONS,
  importQuestions,
  openSetStudy,
  pasteQuestions,
} from './helpers';

async function horizontalOverflow(page: Page) {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
}

test('core screens work on a narrow mobile viewport', async ({ page }) => {
  await pasteQuestions(page, SAMPLE_QUESTIONS);
  await expect(page.getByText('4 questions found')).toBeVisible();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);

  // The primary action is above the bottom navigation, not hidden behind it.
  const saveButton = page.getByTestId('import-save');
  await expect(saveButton).toBeVisible();
  const saveBox = await saveButton.boundingBox();
  const navBox = await page
    .getByRole('navigation', { name: 'Main' })
    .last()
    .boundingBox();
  expect(saveBox).not.toBeNull();
  expect(navBox).not.toBeNull();
  if (saveBox && navBox) {
    expect(saveBox.y + saveBox.height).toBeLessThanOrEqual(navBox.y + 1);
  }

  await saveButton.click();
  await expect(page).toHaveURL(/#\/sets\//);
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);

  await openSetStudy(page);
  await page.getByTestId('start-session').click();
  await expect(page.getByText('Question 1 of 4')).toBeVisible();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);

  // Long content wraps instead of stretching the page.
  await page.getByTestId('flashcard-reveal').click();
  await expect(page.getByTestId('flashcard-answer')).toBeVisible();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
});

test('mobile navigation reaches every primary screen', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main' }).last();

  await nav.getByRole('link', { name: 'Import' }).click();
  await expect(
    page.getByRole('heading', { name: 'Paste questions' }),
  ).toBeVisible();

  await nav.getByRole('link', { name: 'Guide' }).click();
  await expect(page.getByRole('heading', { name: 'AI guide' })).toBeVisible();
  // The prompt can be copied on mobile.
  await expect(
    page.getByRole('button', { name: /Copy prompt/i }),
  ).toBeVisible();

  await nav.getByRole('link', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Appearance' })).toBeVisible();

  await nav.getByRole('link', { name: 'Library' }).click();
  await expect(
    page.getByRole('heading', { name: 'Your library' }),
  ).toBeVisible();
});

test('dark mode keeps study feedback readable', async ({ page }) => {
  await importQuestions(page, SAMPLE_QUESTIONS);
  await page.getByRole('link', { name: 'Settings' }).first().click();
  await page.getByRole('radio', { name: 'Dark' }).click();
  await page.getByRole('link', { name: 'Library' }).first().click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
});
