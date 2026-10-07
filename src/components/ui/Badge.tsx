import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  success:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  warning: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  danger: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
  info: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200',
};

export function Badge({
  tone = 'neutral',
  children,
  className = '',
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`badge ${TONE_CLASSES[tone]} ${className}`.trim()}>
      {children}
    </span>
  );
}
