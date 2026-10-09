import { useEffect, useState, type ReactNode } from 'react';
import { PreferencesProvider } from './PreferencesProvider';
import { ToastViewport } from '@/components/ui/Toast';
import { useAppStore } from '@/app/store/appStore';
import { Button } from '@/components/ui/Button';
import { isIndexedDbAvailable } from '@/data/db/database';
import { EmptyState } from '@/components/ui/Feedback';

/** Tells the user when a new version is ready without interrupting study. */
function UpdateBanner() {
  const updateAvailable = useAppStore((state) => state.updateAvailable);
  const applyUpdate = useAppStore((state) => state.applyUpdate);
  const [dismissed, setDismissed] = useState(false);

  if (!updateAvailable || dismissed || !applyUpdate) return null;

  return (
    <div
      role="status"
      className="border-line bg-accent-soft flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2 text-body text-ink"
    >
      <span>A new version of Quizeasy is ready.</span>
      <span className="flex gap-2">
        <Button size="sm" onClick={() => applyUpdate()}>
          Reload
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
          Later
        </Button>
      </span>
    </div>
  );
}

function StorageGuard({ children }: { children: ReactNode }) {
  const [available] = useState(() => isIndexedDbAvailable());

  useEffect(() => {
    if (!available) {
      console.warn(
        'Quizeasy could not access IndexedDB. Private browsing or blocked site data can cause this.',
      );
    }
  }, [available]);

  if (!available) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <EmptyState
          title="Local storage is unavailable"
          description="Quizeasy saves your question sets in this browser, but storage is blocked right now. Turn off private browsing or allow site data, then reload the page."
        />
      </div>
    );
  }

  return <>{children}</>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <StorageGuard>
      <PreferencesProvider>
        <UpdateBanner />
        {children}
        <ToastViewport />
      </PreferencesProvider>
    </StorageGuard>
  );
}
