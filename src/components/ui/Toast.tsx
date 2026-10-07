import { useEffect } from 'react';
import { CircleCheck, CircleX, Info, X } from 'lucide-react';
import { useAppStore, type Toast } from '@/app/store/appStore';

const TONE_STYLES: Record<Toast['tone'], string> = {
  info: 'border-slate-300 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
  success:
    'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100',
  error:
    'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100',
};

const TONE_ICONS = {
  info: Info,
  success: CircleCheck,
  error: CircleX,
} as const;

const TONE_ICON_COLORS: Record<Toast['tone'], string> = {
  info: 'text-slate-500 dark:text-slate-400',
  success: 'text-emerald-600 dark:text-emerald-400',
  error: 'text-rose-600 dark:text-rose-400',
};

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
      className={`animate-fade-in flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${TONE_STYLES[toast.tone]}`}
    >
      <Icon
        aria-hidden="true"
        className={`mt-0.5 size-5 shrink-0 ${TONE_ICON_COLORS[toast.tone]}`}
      />
      <p className="flex-1 text-sm">{toast.message}</p>
      {toast.action ? (
        <button
          type="button"
          className="rounded-lg px-2 py-1 text-sm font-semibold underline underline-offset-2 hover:no-underline"
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
        className="rounded-lg p-1 text-slate-500 hover:bg-black/5 dark:text-slate-400 dark:hover:bg-white/10"
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
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-auto sm:top-4 sm:items-end">
      <div className="pointer-events-auto flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toastItem) => (
          <ToastItem key={toastItem.id} toast={toastItem} />
        ))}
      </div>
    </div>
  );
}
