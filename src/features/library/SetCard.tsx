import { Link } from 'react-router-dom';
import { MoreHorizontal, Play } from 'lucide-react';
import type { SetWithStats } from '@/data/repositories';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatRelativeDate } from '@/lib/utils';
import { pluralize } from '@/lib/utils';

export function SetCard({
  stats,
  onMore,
}: {
  stats: SetWithStats;
  onMore: () => void;
}) {
  const { set, questionCount, sessionCount } = stats;
  const canStudy = questionCount > 0;

  return (
    <article className="card flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base">
            <Link
              to={`/sets/${set.id}`}
              className="hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              {set.title}
            </Link>
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {questionCount} {pluralize(questionCount, 'question')} ·{' '}
            {formatRelativeDate(set.lastStudiedAt)}
            {sessionCount > 0
              ? ` · ${sessionCount} ${pluralize(sessionCount, 'session')}`
              : ''}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onMore}
          aria-label={`More actions for ${set.title}`}
        >
          <MoreHorizontal aria-hidden="true" className="size-4" />
        </Button>
      </div>

      {set.description ? (
        <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
          {set.description}
        </p>
      ) : null}

      {set.tags && set.tags.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {set.tags.slice(0, 4).map((tag) => (
            <li key={tag}>
              <Badge tone="neutral">{tag}</Badge>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto flex gap-2">
        {canStudy ? (
          <Link
            to={`/sets/${set.id}/study`}
            className="btn btn-primary flex-1"
            aria-label={`Study ${set.title}`}
          >
            <Play aria-hidden="true" className="size-4" />
            Study
          </Link>
        ) : (
          <Link to={`/sets/${set.id}/edit`} className="btn btn-primary flex-1">
            Add questions
          </Link>
        )}
        <Link to={`/sets/${set.id}`} className="btn btn-secondary">
          Open
        </Link>
      </div>
    </article>
  );
}
