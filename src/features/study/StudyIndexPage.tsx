import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { useLibrary } from '@/hooks/useLibrary';
import { useSetSignals } from '@/features/library/useSetSignals';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState, ErrorState, LoadingPanel } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeDate, pluralize } from '@/lib/utils';
import type { PresentationMode } from '@/domain/schemas/study';

const MODE_LABELS: Record<PresentationMode, string> = {
  flashcard: 'Flashcards',
  'multiple-choice': 'Multiple choice',
  identification: 'Identification',
};

export function StudyIndexPage() {
  const { data, loading, error, reload } = useLibrary();

  const studyable = (data?.items ?? []).filter(
    (stats) => stats.questionCount > 0,
  );
  const signals = useSetSignals(studyable.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Study"
        title="Study"
        subtitle="Every mode reads the same saved questions."
      />

      {loading ? <LoadingPanel label="Loading your sets…" /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {!loading && !error && studyable.length === 0 ? (
        <EmptyState
          title="Nothing to study yet"
          description="Add questions to a set first — then every mode here works on the same saved data."
          actions={
            <Link to="/" className="btn btn-outline">
              Go to Library
            </Link>
          }
        />
      ) : null}

      {studyable.length > 0 ? (
        <ul className="card flex flex-col p-2" data-testid="study-set-list">
          {studyable.map(({ set, questionCount }) => {
            const modes = signals.modes[set.id] ?? [];
            const lastMode = signals.lastMode[set.id];
            return (
              <li
                key={set.id}
                className="border-line first:border-t-0 flex flex-wrap items-center gap-3 border-t px-3 py-4"
              >
                <div className="min-w-0 flex-1">
                  <h2 className="text-card font-display truncate font-medium">
                    <Link
                      to={`/sets/${set.id}`}
                      className="hover:text-accent transition"
                    >
                      {set.title}
                    </Link>
                  </h2>
                  <p className="text-caption text-muted mt-1">
                    {questionCount} {pluralize(questionCount, 'question')} ·{' '}
                    {formatRelativeDate(set.lastStudiedAt)}
                  </p>
                  {modes.length > 0 ? (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {modes.map((mode) => (
                        <li key={mode}>
                          <Badge
                            tone={mode === lastMode ? 'accent' : 'neutral'}
                          >
                            {MODE_LABELS[mode]}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <Link
                  to={`/sets/${set.id}/study`}
                  className="btn btn-ghost"
                  aria-label={`Study ${set.title}`}
                >
                  <Play aria-hidden="true" className="size-4" />
                  Start
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
