import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Every page opens with an eyebrow, a serif title and one sentence of context.
 * `actions` carries at most the screen's single primary action — never an
 * action that is also repeated inside the page body.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  backTo,
  backLabel,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  backTo?: string;
  backLabel?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-3">
      {backTo ? (
        <Link
          to={backTo}
          className="rounded-control text-muted hover:text-accent inline-flex w-fit items-center gap-1.5 px-1 text-body font-medium transition"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {backLabel ?? 'Back'}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
          <h1 className="text-title">{title}</h1>
          {subtitle ? (
            <p className="text-body text-muted mt-2 max-w-prose">{subtitle}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
