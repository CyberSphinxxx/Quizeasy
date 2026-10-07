import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function PageHeader({
  title,
  subtitle,
  backTo,
  backLabel,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  backTo?: string;
  backLabel?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-col gap-3">
      {backTo ? (
        <Link
          to={backTo}
          className="inline-flex min-h-9 w-fit items-center gap-1 rounded-lg px-1 text-sm font-medium text-slate-600 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-indigo-300"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {backLabel ?? 'Back'}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
