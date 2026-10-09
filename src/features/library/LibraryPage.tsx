import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardPaste,
  Plus,
  Search,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { useLibrary } from '@/hooks/useLibrary';
import { SetCard } from './SetCard';
import { SetActionsDialog } from './SetActionsDialog';
import { useSetSignals } from './useSetSignals';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingPanel } from '@/components/ui/Feedback';
import { SetFileImportButton } from '@/features/shared/SetFileImportButton';
import { repositories } from '@/data/repositories';
import { toast } from '@/app/store/appStore';
import type { QuizSet } from '@/domain/schemas/set';
import { EMPTY_SET_STATS } from '@/lib/empties';

/** Sets shown before the search field earns its place on the page. */
const SEARCH_THRESHOLD = 6;

/** Illustration for the empty state. Never editable, never saved. */
const SAMPLE_PAIRS = [
  { prompt: 'What does CPU stand for?', answer: 'Central Processing Unit' },
  { prompt: 'What does RAM stand for?', answer: 'Random Access Memory' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Generate with the AI guide',
    detail: 'Ask any AI for plain Q: and A: lines — the guide has the prompt.',
  },
  {
    step: '02',
    title: 'Review the import',
    detail: 'Quizeasy shows what it found and flags anything it cannot read.',
  },
  {
    step: '03',
    title: 'Study 4 ways',
    detail: 'Flashcards, multiple choice, identification, or a mixed quiz.',
  },
];

/**
 * A read-only look-alike of the paste box: it shows the expected shape of the
 * input but cannot be typed into, and it is hidden from assistive tech so the
 * real "Review import" action is the only thing announced.
 */
function SamplePreview() {
  return (
    <div
      aria-hidden="true"
      className="rounded-control border-line-strong bg-inset border p-3"
    >
      <pre className="font-mono text-caption whitespace-pre-wrap">
        {SAMPLE_PAIRS.map((pair, index) => (
          <span key={pair.prompt}>
            <span className="text-accent">Q:</span>{' '}
            <span className="text-ink">{pair.prompt}</span>
            {'\n'}
            <span className="text-accent">A:</span>{' '}
            <span className="text-muted">{pair.answer}</span>
            {index < SAMPLE_PAIRS.length - 1 ? '\n\n' : '\n'}
          </span>
        ))}
      </pre>
    </div>
  );
}

function LibraryEmptyState({
  creating,
  onReviewImport,
  onImported,
  onCreate,
}: {
  creating: boolean;
  onReviewImport: () => void;
  onImported: (setId: string) => void;
  onCreate: () => void;
}) {
  return (
    <section className="card p-6 lg:p-8" aria-label="Get started">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="flex min-w-0 flex-col gap-4">
          <p className="eyebrow">PASTE QUESTIONS</p>
          <h2 className="text-question">Paste your questions to get started</h2>
          <p className="text-body text-muted">
            Quizeasy reads plain text like the sample below, then shows you
            exactly what it found before saving anything.
          </p>
          <SamplePreview />
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={onReviewImport}>
              <ClipboardPaste aria-hidden="true" className="size-4" />
              Review import
            </Button>
            <SetFileImportButton onImported={onImported} />
            <Button variant="ghost" onClick={onCreate} disabled={creating}>
              <Plus aria-hidden="true" className="size-4" />
              Create manually
            </Button>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <p className="eyebrow">HOW IT WORKS</p>
          <ol className="flex flex-col gap-4">
            {HOW_IT_WORKS.map((item) => (
              <li key={item.step} className="flex gap-3">
                <span className="font-mono text-eyebrow text-muted mt-0.5">
                  {item.step}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-body font-semibold text-ink">
                    {item.title}
                  </span>
                  <span className="text-caption text-muted">{item.detail}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="text-caption text-muted flex items-start gap-2">
            <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            Every mode studies the same saved questions — nothing is duplicated.
          </p>
        </div>
      </div>
    </section>
  );
}

export function LibraryPage() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useLibrary();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<QuizSet | undefined>(undefined);
  const [creating, setCreating] = useState(false);

  const sets = data?.items ?? EMPTY_SET_STATS;
  const skipped = data?.skipped ?? 0;
  const signals = useSetSignals(sets.length > 0);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return sets;
    return sets.filter(({ set }) => {
      const haystack = [set.title, set.description ?? '', ...(set.tags ?? [])]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [sets, query]);

  const recentlyStudied = useMemo(
    () =>
      sets
        .filter(({ set }) => Boolean(set.lastStudiedAt))
        .sort((a, b) =>
          (b.set.lastStudiedAt ?? '').localeCompare(a.set.lastStudiedAt ?? ''),
        )
        .slice(0, 3),
    [sets],
  );

  const showSections = query.trim().length === 0 && recentlyStudied.length > 0;

  const handleCreate = async () => {
    setCreating(true);
    try {
      const set = await repositories.sets.create({ title: 'Untitled set' });
      navigate(`/sets/${set.id}/edit`);
    } catch (cause) {
      toast(
        cause instanceof Error
          ? cause.message
          : 'Quizeasy could not create a new set.',
        'error',
      );
    } finally {
      setCreating(false);
    }
  };

  const renderGrid = (items: typeof filtered) => (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((stats) => (
        <SetCard
          key={stats.set.id}
          stats={stats}
          modes={signals.modes[stats.set.id] ?? []}
          lastMode={signals.lastMode[stats.set.id]}
          onMore={() => setSelected(stats.set)}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* With sets on screen the header carries the one action the page body
          cannot show; the empty state owns its own actions instead. */}
      <PageHeader
        eyebrow="Your sets"
        title="Your library"
        actions={
          sets.length > 0 ? (
            <SetFileImportButton
              variant="ghost"
              onImported={(setId) => navigate(`/sets/${setId}`)}
            />
          ) : undefined
        }
      />

      {skipped > 0 ? (
        <div
          role="status"
          className="card text-body flex items-start gap-2 px-4 py-3"
        >
          <TriangleAlert
            aria-hidden="true"
            className="text-warning mt-0.5 size-4 shrink-0"
          />
          <p className="text-ink">
            {skipped} stored {skipped === 1 ? 'set was' : 'sets were'}{' '}
            unreadable and {skipped === 1 ? 'was' : 'were'} skipped. Restoring a
            backup may recover them.
          </p>
        </div>
      ) : null}

      {loading ? <LoadingPanel label="Loading your sets…" /> : null}

      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {!loading && !error && sets.length === 0 ? (
        <LibraryEmptyState
          creating={creating}
          onReviewImport={() => navigate('/import')}
          onImported={(setId) => navigate(`/sets/${setId}`)}
          onCreate={handleCreate}
        />
      ) : null}

      {!loading && !error && sets.length > 0 ? (
        <>
          {sets.length > SEARCH_THRESHOLD ? (
            <div>
              <label className="sr-only" htmlFor="library-search">
                Search sets
              </label>
              <div className="relative max-w-md">
                <Search
                  aria-hidden="true"
                  className="text-muted pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
                />
                <input
                  id="library-search"
                  type="search"
                  className="input pl-9"
                  placeholder="Search sets by title, description, or tag"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
            </div>
          ) : null}

          {query.trim().length > 0 && filtered.length === 0 ? (
            <EmptyState
              title="No sets match that search"
              description={`Nothing matched "${query.trim()}". Try a different word, or clear the search to see all ${sets.length} sets.`}
              actions={
                <Button variant="outline" onClick={() => setQuery('')}>
                  Clear search
                </Button>
              }
            />
          ) : null}

          {showSections ? (
            <section>
              <h2 className="eyebrow mb-3">RECENTLY STUDIED</h2>
              {renderGrid(recentlyStudied)}
            </section>
          ) : null}

          {filtered.length > 0 ? (
            <section>
              <h2 className="eyebrow mb-3">ALL SETS</h2>
              {renderGrid(filtered)}
            </section>
          ) : null}
        </>
      ) : null}

      <SetActionsDialog
        set={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(undefined)}
        onChanged={reload}
      />
    </div>
  );
}
