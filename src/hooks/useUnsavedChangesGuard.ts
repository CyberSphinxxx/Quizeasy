import { useEffect } from 'react';

/**
 * Warns before the page unloads while there is unsaved work.
 *
 * Combined with the import draft stored in sessionStorage, this means a
 * pasted set is never lost by accident.
 */
export function useUnsavedChangesGuard(active: boolean): void {
  useEffect(() => {
    if (!active) return undefined;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Older browsers need returnValue to show the confirmation.
      event.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [active]);
}
