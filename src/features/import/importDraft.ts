/** Keeps an in-progress paste safe if the user navigates away. */

const DRAFT_KEY = 'quizeasy.import-draft';

export interface ImportDraft {
  text: string;
  title: string;
  description: string;
}

export function readImportDraft(): ImportDraft | undefined {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<ImportDraft>;
    if (typeof parsed.text !== 'string') return undefined;
    return {
      text: parsed.text,
      title: typeof parsed.title === 'string' ? parsed.title : '',
      description:
        typeof parsed.description === 'string' ? parsed.description : '',
    };
  } catch {
    return undefined;
  }
}

export function saveImportDraft(draft: ImportDraft): void {
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage can be unavailable; the draft simply is not kept.
  }
}

export function clearImportDraft(): void {
  try {
    window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing to do.
  }
}
