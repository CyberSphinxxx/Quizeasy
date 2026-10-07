import { THEME_STORAGE_KEY, type Theme } from '@/domain/schemas/preferences';

export function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Applies the theme to the document and mirrors it to localStorage. */
export function applyTheme(
  theme: Theme,
  prefersDark = systemPrefersDark(),
): void {
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', dark);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode can block localStorage; the theme still applies for now.
  }
}

export function applyReducedMotion(reduced: boolean): void {
  document.documentElement.classList.toggle('reduced-motion', reduced);
}

/** Subscribes to OS theme changes; returns an unsubscribe function. */
export function watchSystemTheme(onChange: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const query = window.matchMedia('(prefers-color-scheme: dark)');
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
