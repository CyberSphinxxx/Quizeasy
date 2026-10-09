import { expect, test, type Page } from '@playwright/test';
import { SAMPLE_QUESTIONS, importQuestions } from './helpers';

/** The set detail page's questions card, which lists the first five Q&A pairs. */
function setQuestions(page: Page) {
  return page.getByRole('region', { name: 'Questions' });
}

test('sets and questions survive a reload', async ({ page }) => {
  await importQuestions(page, SAMPLE_QUESTIONS);

  await page.reload();

  await expect(page.getByTestId('set-meta')).toContainText('4 questions');
  await page.getByRole('link', { name: 'Library' }).first().click();
  await expect(
    page.getByRole('heading', { name: 'Your library' }),
  ).toBeVisible();
  await expect(page.getByText('What does CPU stand for')).toBeVisible();
});

test('the app shell works offline after the first visit', async ({
  page,
  context,
}) => {
  await importQuestions(page, SAMPLE_QUESTIONS);

  // Served over a loopback origin, so the worker registers on first load.
  await page.evaluate(() =>
    navigator.serviceWorker.ready.then(() => undefined),
  );

  // registerType 'prompt' keeps clientsClaim/skipWaiting off, so the freshly
  // activated worker only takes control on the next navigation.
  await page.reload();
  await page.waitForFunction(
    () => Boolean(navigator.serviceWorker?.controller),
    undefined,
    { timeout: 30_000 },
  );

  await context.setOffline(true);
  await page.reload();

  // The cached app shell still renders and local data is still readable.
  await expect(
    setQuestions(page).getByText('Central Processing Unit'),
  ).toBeVisible();

  await context.setOffline(false);
});

test('a set exports to a file and imports back with the same content', async ({
  page,
}) => {
  await importQuestions(page, SAMPLE_QUESTIONS);

  const exportButton = page.getByRole('button', { name: 'Export this set' });
  await page.getByRole('button', { name: 'More set actions' }).click();
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;
  const filePath = await download.path();
  expect(filePath).toBeTruthy();

  // Delete the set, then import the exported file from the library. There is
  // exactly one import input on the empty library screen.
  await page.getByRole('button', { name: 'Delete this set' }).click();
  await page.getByRole('button', { name: 'Delete set' }).click();
  await expect(
    page.getByText('Paste your questions to get started'),
  ).toBeVisible();

  await page
    .locator('input[type="file"][aria-label="Import set file"]')
    .setInputFiles(filePath as string);

  await expect(page).toHaveURL(/#\/sets\//);
  await expect(page.getByTestId('set-meta')).toContainText('4 questions');

  // Scoped to the questions card: the set title is auto-suggested from the
  // first prompt, so a page-wide text lookup would match more than one node.
  const questions = setQuestions(page);
  await expect(questions.getByText('What does CPU stand for?')).toBeVisible();
  await expect(questions.getByText('Central Processing Unit')).toBeVisible();

  // The wrong choices survived the round trip too (they only show in the editor).
  await page.getByRole('link', { name: 'Edit questions' }).click();
  await expect(
    page.getByTestId('question-list').getByText('Central Program Unit'),
  ).toBeVisible();
});

test('an invalid file never wipes local data', async ({ page }) => {
  await importQuestions(page, SAMPLE_QUESTIONS);

  await page.getByRole('link', { name: 'Settings' }).first().click();
  await expect(page.getByRole('heading', { name: 'Your data' })).toBeVisible();

  await page
    .locator('input[type="file"][aria-label="Restore from backup file"]')
    .setInputFiles({
      name: 'not-a-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"format":"something-else","sets":[]}'),
    });

  await expect(page.getByText(/not a Quizeasy backup/i)).toBeVisible();

  // Existing data is untouched.
  await page.getByRole('link', { name: 'Library' }).first().click();
  await expect(
    page.getByRole('link', { name: 'What does CPU stand for', exact: true }),
  ).toBeVisible();
});
