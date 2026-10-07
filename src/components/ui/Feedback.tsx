import type { ReactNode } from 'react';
import { Loader2, TriangleAlert } from 'lucide-react';
import { Button } from './Button';

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
      <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      <span>{label}</span>
    </span>
  );
}

export function LoadingPanel({ label }: { label?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center" role="status">
      <Spinner label={label} />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  actions,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
      {icon ? (
        <div
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
        >
          {icon}
        </div>
      ) : null}
      <h2 className="text-lg">{title}</h2>
      <p className="max-w-prose text-sm text-slate-600 dark:text-slate-300">
        {description}
      </p>
      {actions ? (
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="card flex flex-col items-start gap-3 border-rose-300 px-5 py-4 dark:border-rose-900"
    >
      <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
        <TriangleAlert aria-hidden="true" className="size-5" />
        <h2 className="text-base">{title}</h2>
      </div>
      <p className="text-sm text-slate-700 dark:text-slate-200">{message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function ProgressBar({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  const percentage =
    max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
    >
      <div
        className="h-full rounded-full bg-indigo-600 transition-[width] duration-300 dark:bg-indigo-400"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
