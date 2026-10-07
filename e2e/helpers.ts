import { expect, type Locator, type Page } from '@playwright/test';

export const SAMPLE_QUESTIONS = `Q: What does CPU stand for?
A: Central Processing Unit
W: Central Program Unit
W: Computer Processing Utility
W: Core Processing Utility
E: The CPU executes instructions.
T: hardware, computer

Q: What does RAM stand for?
A: Random Access Memory
W: Read Access Memory
W: Random Allocation Module
W: Rapid Access Machine
E: RAM stores data for running programs.
T: memory, computer

Q: What does ROM stand for?
A: Read Only Memory
W: Random Output Memory
W: Read Operating Module
W: Runtime Object Memory
E: ROM keeps data that rarely changes.
T: memory

Q: What is 2 + 2?
A: 4`;

/** Opens the import screen and pastes text into it. */
export async function pasteQuestions(page: Page, text: string): Promise<void> {
  await page.goto('/#/import');
  const textarea = page.getByTestId('import-textarea');
  await expect(textarea).toBeVisible();
  await textarea.fill(text);
}

/** Pastes text, waits for the preview, and saves the set. */
export async function importQuestions(page: Page, text: string): Promise<void> {
  await pasteQuestions(page, text);
  await expect(page.getByTestId('import-items')).toBeVisible();
  await page.getByTestId('import-save').click();
  await expect(page).toHaveURL(/#\/sets\//);
  await expect(page.getByTestId('set-meta')).toBeVisible();
}

/** Question count shown on the set page, e.g. "4 questions". */
export function setMeta(page: Page) {
  return page.getByTestId('set-meta');
}

/**
 * Opens the setup screen for the set currently on screen.
 *
 * The shell renders the global navigation before `<main id="main-content">`,
 * so a bare "Study" link resolves to the sidebar item (the study index). Set
 * pages live inside `#main-content`, so scope to it to reach the set action.
 */
export async function openSetStudy(page: Page): Promise<void> {
  await page
    .locator('#main-content')
    .getByRole('link', { name: 'Study' })
    .click();
  // The setup screen only renders once the set has loaded.
  await expect(page.getByTestId('start-session')).toBeVisible();
}

/**
 * Reads the yes/no verdict from a feedback card. The heading line is either
 * "Correct" or "Not quite…" — checking the first line avoids matching the
 * "Correct answer:" label that also appears on a wrong identification.
 */
export async function feedbackVerdict(feedback: Locator): Promise<boolean> {
  const firstLine = (await feedback.innerText()).split('\n')[0]?.trim() ?? '';
  return firstLine === 'Correct';
}

/** Finishes flashcards: reveals and marks every card, then opens results. */
export async function completeFlashcardsAsKnown(page: Page): Promise<void> {
  const reveal = page.getByTestId('flashcard-reveal');
  await expect(reveal).toBeVisible();

  for (let index = 0; index < 200; index += 1) {
    if (await page.getByTestId('session-finish').isVisible()) {
      // Last card still needs answering.
      if (await reveal.isVisible()) {
        await reveal.click();
        await page.getByTestId('flashcard-known').click();
      }
      break;
    }
    await reveal.click();
    await page.getByTestId('flashcard-known').click();
  }

  await page.getByTestId('session-finish').click();
  await expect(page.getByTestId('results-percentage')).toBeVisible();
}
