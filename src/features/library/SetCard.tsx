import { Link } from 'react-router-dom';
import { MoreHorizontal, Play } from 'lucide-react';
import type { SetWithStats } from '@/data/repositories';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatRelativeDate } from '@/lib/utils';
import { pluralize } from '@/lib/utils';
import type { PresentationMode, StudyMode } from '@/domain/schemas/study';

const MODE_LABELS: Record<PresentationMode, string> = {
  flashcard: 'Flashcards',
  'multiple-choice': 'Multiple choice',
  identification: 'Identification',
};

export function SetCard({
  stats,
  modes,
  lastMode,
  onMore,
}: {
  stats: SetWithStats;
  modes: PresentationMode[];
  lastMode?: StudyMode;
  onMore: () => void;
}) {
  const { set, questionCount, sessionCount } = stats;
  const canStudy = questionCount > 0;

  return (
    <article className="card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-card font-display truncate font-medium">
            <Link
              to={`/sets/${set.id}`}
              className="hover:text-accent transition"
            >
              {set.title}
            </Link>
          </h3>
          <p className="text-caption text-muted mt-1">
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
        <p className="text-body text-muted line-clamp-2">{set.description}</p>
      ) : null}

      {set.tags && set.tags.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {set.tags.slice(0, 2).map((tag) => (
            <li key={tag}>
              <Badge>{tag}</Badge>
            </li>
          ))}
        </ul>
      ) : null}

      {modes.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {modes.map((mode) => (
            <li key={mode}>
              {/* The mode studied most recently is the accented chip. */}
              <Badge tone={mode === lastMode ? 'accent' : 'neutral'}>
                {MODE_LABELS[mode]}
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto flex items-center gap-2 pt-1">
        {canStudy ? (
          <Link
            to={`/sets/${set.id}/study`}
            className="btn btn-ghost"
            aria-label={`Study ${set.title}`}
          >
            <Play aria-hidden="true" className="size-4" />
            Study
          </Link>
        ) : (
          <Link to={`/sets/${set.id}/edit`} className="btn btn-ghost">
            Add questions
          </Link>
        )}
      </div>
    </article>
  );
}
