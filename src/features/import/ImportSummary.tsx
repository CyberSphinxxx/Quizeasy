import { CheckCircle2, CircleAlert, Info, TriangleAlert } from 'lucide-react';
import { PARSE_FORMAT_LABELS, type ParseResult } from '@/parser';
import { Badge } from '@/components/ui/Badge';

export interface ImportCounts {
  total: number;
  ready: number;
  check: number;
  needsFix: number;
  included: number;
}

export function ImportCountsRow({
  counts,
  testId = 'import-counts',
}: {
  counts: ImportCounts;
  testId?: string;
}) {
  return (
    <ul className="flex flex-wrap items-center gap-2" data-testid={testId}>
      <li>
        <Badge tone="success">
          <CheckCircle2 aria-hidden="true" className="size-3.5" />
          {counts.ready} ready
        </Badge>
      </li>
      <li>
        <Badge tone="warning">
          <TriangleAlert aria-hidden="true" className="size-3.5" />
          {counts.check} to check
        </Badge>
      </li>
      <li>
        <Badge tone="danger">
          <CircleAlert aria-hidden="true" className="size-3.5" />
          {counts.needsFix} need fixing
        </Badge>
      </li>
      <li>
        <Badge tone="neutral">{counts.included} will be saved</Badge>
      </li>
    </ul>
  );
}

export function ImportSummary({
  result,
  counts,
  errors,
  warnings,
}: {
  result: ParseResult;
  counts: ImportCounts;
  /** Recalculated after edits so fixed entries stop being reported. */
  errors: string[];
  warnings: string[];
}) {
  const hasGlobalIssues = errors.length > 0 || warnings.length > 0;

  return (
    <section
      className="card flex flex-col gap-3 p-4"
      aria-label="Import summary"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base">
          {counts.total} {counts.total === 1 ? 'question' : 'questions'} found
        </h2>
        <Badge tone="info">
          <Info aria-hidden="true" className="size-3.5" />
          {PARSE_FORMAT_LABELS[result.detectedFormat]}
        </Badge>
      </div>

      <ImportCountsRow counts={counts} />

      {hasGlobalIssues ? (
        <details className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
          <summary className="cursor-pointer font-medium">
            {errors.length} {errors.length === 1 ? 'problem' : 'problems'} to
            look at
          </summary>
          <ul className="mt-2 flex flex-col gap-1">
            {errors.slice(0, 20).map((message, index) => (
              <li
                key={`error-${index}`}
                className="text-rose-700 dark:text-rose-300"
              >
                {message}
              </li>
            ))}
            {warnings.slice(0, 20).map((message, index) => (
              <li
                key={`warning-${index}`}
                className="text-amber-700 dark:text-amber-300"
              >
                {message}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
