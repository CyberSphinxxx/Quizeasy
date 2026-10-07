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
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingPanel } from '@/components/ui/Feedback';
import { SetFileImportButton } from '@/features/shared/SetFileImportButton';
import { repositories } from '@/data/repositories';
import { toast } from '@/app/store/appStore';
import type { QuizSet } from '@/domain/schemas/set';
import { EMPTY_SET_STATS } from '@/lib/empties';

export function LibraryPage() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useLibrary();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<QuizSet | undefined>(undefined);
  const [creating, setCreating] = useState(false);

  const sets = data?.items ?? EMPTY_SET_STATS;
  const skipped = data?.skipped ?? 0;

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

  return (
    <div>
      <PageHeader
        title="Your library"
        subtitle="Everything here is stored in this browser only."
        actions={
          <>
            <SetFileImportButton
              onImported={(setId) => navigate(`/sets/${setId}`)}
            />
            <Button onClick={() => navigate('/import')}>
              <ClipboardPaste aria-hidden="true" className="size-4" />
              Paste questions
            </Button>
          </>
        }
      />

      {skipped > 0 ? (
        <div
          role="status"
          className="mb-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"
        >
          <TriangleAlert
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
          />
          <p>
            {skipped} stored {skipped === 1 ? 'set was' : 'sets were'}{' '}
            unreadable and {skipped === 1 ? 'was' : 'were'} skipped. Restoring a
            backup may recover them.
          </p>
        </div>
      ) : null}

      {loading ? <LoadingPanel label="Loading your sets…" /> : null}

      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {!loading && !error && sets.length === 0 ? (
        <EmptyState
          icon={<ClipboardPaste aria-hidden="true" className="size-6" />}
          title="Paste your questions to get started"
          description="Quizeasy reads plain text like “Q: What does CPU stand for?” followed by “A: Central Processing Unit”. Paste it once and study it as flashcards, multiple choice, identification, or a mixed quiz."
          actions={
            <>
              <Button onClick={() => navigate('/import')}>
                <ClipboardPaste aria-hidden="true" className="size-4" />
                Paste questions
              </Button>
              <Button
                variant="secondary"
                onClick={handleCreate}
                disabled={creating}
              >
                <Plus aria-hidden="true" className="size-4" />
                Create manually
              </Button>
              <Button variant="ghost" onClick={() => navigate('/guide')}>
                <Sparkles aria-hidden="true" className="size-4" />
                See AI guide
              </Button>
            </>
          }
        />
      ) : null}

      {sets.length > 0 ? (
        <>
          <div className="mb-5">
            <label className="sr-only" htmlFor="library-search">
              Search sets
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
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

          {query.trim().length > 0 && filtered.length === 0 ? (
            <EmptyState
              title="No sets match that search"
              description={`Nothing matched "${query.trim()}". Try a different word, or clear the search to see all ${sets.length} sets.`}
              actions={
                <Button variant="secondary" onClick={() => setQuery('')}>
                  Clear search
                </Button>
              }
            />
          ) : null}

          {showSections ? (
            <section className="mb-6">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Recently studied
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {recentlyStudied.map((stats) => (
                  <SetCard
                    key={stats.set.id}
                    stats={stats}
                    onMore={() => setSelected(stats.set)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {filtered.length > 0 ? (
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {showSections ? 'All sets' : 'Sets'}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((stats) => (
                  <SetCard
                    key={stats.set.id}
                    stats={stats}
                    onMore={() => setSelected(stats.set)}
                  />
                ))}
              </div>
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
