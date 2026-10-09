import type { ReactNode } from 'react';
import { Loader2, TriangleAlert } from 'lucide-react';
import { Button } from './Button';

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-body text-muted">
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
    <div className="card flex flex-col items-start gap-3 px-6 py-8">
      {icon ? (
        <span aria-hidden="true" className="text-muted">
          {icon}
        </span>
      ) : null}
      <h2 className="text-question">{title}</h2>
      <p className="max-w-prose text-body text-muted">{description}</p>
      {actions ? (
        <div className="mt-1 flex flex-wrap items-center gap-2">{actions}</div>
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
      className="card flex flex-col items-start gap-3 px-5 py-4"
    >
      <p className="flex items-center gap-2 text-body font-medium text-incorrect">
        <TriangleAlert aria-hidden="true" className="size-4" />
        {title}
      </p>
      <p className="text-body text-ink">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/** 3px, accent fill, no animation. */
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
      className="progress-track"
    >
      <div className="progress-fill" style={{ width: `${percentage}%` }} />
    </div>
  );
}
