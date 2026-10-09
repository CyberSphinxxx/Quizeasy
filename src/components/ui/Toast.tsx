import { useEffect } from 'react';
import { CircleCheck, CircleX, Info, X } from 'lucide-react';
import { useAppStore, type Toast } from '@/app/store/appStore';

const TONE_STYLES: Record<Toast['tone'], string> = {
  info: 'text-ink',
  success: 'text-correct',
  error: 'text-incorrect',
};

const TONE_ICONS = {
  info: Info,
  success: CircleCheck,
  error: CircleX,
} as const;

function ToastItem({ toast }: { toast: Toast }) {
  const dismissToast = useAppStore((state) => state.dismissToast);
  const Icon = TONE_ICONS[toast.tone];

  useEffect(() => {
    if (toast.duration <= 0) return;
    const timer = window.setTimeout(
      () => dismissToast(toast.id),
      toast.duration,
    );
    return () => window.clearTimeout(timer);
  }, [toast.id, toast.duration, dismissToast]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-3 rounded-card border border-line bg-surface px-4 py-3"
    >
      <Icon
        aria-hidden="true"
        className={`mt-0.5 size-4 shrink-0 ${TONE_STYLES[toast.tone]}`}
      />
      <p className="flex-1 text-body text-ink">{toast.message}</p>
      {toast.action ? (
        <button
          type="button"
          className="text-body font-medium text-accent underline underline-offset-2 hover:no-underline"
          onClick={() => {
            toast.action?.onClick();
            dismissToast(toast.id);
          }}
        >
          {toast.action.label}
        </button>
      ) : null}
      <button
        type="button"
        className="rounded-control p-1 text-muted transition hover:bg-raised hover:text-ink"
        aria-label="Dismiss notification"
        onClick={() => dismissToast(toast.id)}
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}

export function ToastViewport() {
  const toasts = useAppStore((state) => state.toasts);
  if (toasts.length === 0) return null;

  return (
    <div className="nav:bottom-6 pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center px-4">
      <div className="pointer-events-auto flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toastItem) => (
          <ToastItem key={toastItem.id} toast={toastItem} />
        ))}
      </div>
    </div>
  );
}
