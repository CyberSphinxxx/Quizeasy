import { Link } from 'react-router-dom';
import { BookOpen, Play } from 'lucide-react';
import { useLibrary } from '@/hooks/useLibrary';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState, ErrorState, LoadingPanel } from '@/components/ui/Feedback';
import { formatRelativeDate, pluralize } from '@/lib/utils';

export function StudyIndexPage() {
  const { data, loading, error, reload } = useLibrary();

  const studyable = (data?.items ?? []).filter(
    (stats) => stats.questionCount > 0,
  );

  return (
    <div>
      <PageHeader
        title="Study"
        subtitle="Pick a set to study as flashcards, multiple choice, identification, or a mixed quiz."
      />

      {loading ? <LoadingPanel label="Loading your sets…" /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {!loading && !error && studyable.length === 0 ? (
        <EmptyState
          icon={<BookOpen aria-hidden="true" className="size-6" />}
          title="Nothing to study yet"
          description="Add questions to a set first. Paste text that already looks like questions and answers — Quizeasy handles the rest."
          actions={
            <>
              <Link to="/import" className="btn btn-primary">
                Paste questions
              </Link>
              <Link to="/" className="btn btn-secondary">
                Go to library
              </Link>
            </>
          }
        />
      ) : null}

      {studyable.length > 0 ? (
        <ul className="flex flex-col gap-3" data-testid="study-set-list">
          {studyable.map(({ set, questionCount }) => (
            <li
              key={set.id}
              className="card flex flex-wrap items-center gap-3 p-4"
            >
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base">
                  <Link
                    to={`/sets/${set.id}`}
                    className="hover:text-indigo-700 dark:hover:text-indigo-300"
                  >
                    {set.title}
                  </Link>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {questionCount} {pluralize(questionCount, 'question')} ·{' '}
                  {formatRelativeDate(set.lastStudiedAt)}
                </p>
              </div>
              <Link to={`/sets/${set.id}/study`} className="btn btn-primary">
                <Play aria-hidden="true" className="size-4" />
                Study
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
