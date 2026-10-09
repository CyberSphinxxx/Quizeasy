import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PRIMARY_NAV } from './navigation';

/** How long the `G` prefix stays armed after it is pressed. */
const CHORD_WINDOW_MS = 1500;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

function isModalOpen(): boolean {
  return document.querySelector('[role="dialog"][aria-modal="true"]') !== null;
}

/**
 * `G` then `L`/`I`/`S` jumps to Library, Import or Study — the same keys the
 * sidebar shows as keycap hints. Typing, modifier chords and open dialogs are
 * left alone so nothing steals input.
 */
export function useNavShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    let armedUntil = 0;

    const handler = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.repeat) return;
      if (isTypingTarget(event.target) || isModalOpen()) return;

      const key = event.key.toLowerCase();

      if (key === 'g') {
        armedUntil = Date.now() + CHORD_WINDOW_MS;
        return;
      }

      if (Date.now() > armedUntil) return;
      const match = PRIMARY_NAV.find(
        (item) => item.chord?.toLowerCase() === key,
      );
      if (!match) return;

      event.preventDefault();
      armedUntil = 0;
      void navigate(match.to);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);
}
