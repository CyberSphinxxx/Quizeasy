import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Copy,
  Download,
  MoreHorizontal,
  PencilLine,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';
import { useSetBundle } from '@/hooks/useSetBundle';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, ErrorState, LoadingPanel } from '@/components/ui/Feedback';
import { ConfirmDialog, Dialog } from '@/components/ui/Dialog';
import { TextField } from '@/components/ui/Form';
import { SetFileImportButton } from '@/features/shared/SetFileImportButton';
import { repositories } from '@/data/repositories';
import { downloadSetExport } from '@/services/setTransfer';
import { countEligible } from '@/domain/study/eligibility';
import { toast } from '@/app/store/appStore';
import { formatDateTime, formatRelativeDate, pluralize } from '@/lib/utils';
import { EMPTY_QUESTIONS } from '@/lib/empties';

export function SetDetailPage() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useSetBundle(setId);

  const [moreOpen, setMoreOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  const questions = data?.questions ?? EMPTY_QUESTIONS;
  const eligibility = useMemo(
    () => countEligible(questions, questions),
    [questions],
  );

  if (loading) return <LoadingPanel label="Loading set…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) {
    return (
      <EmptyState
        title="That set is gone"
        description="It may have been deleted in another tab. Your other sets are still here."
        actions={
          <Link to="/" className="btn btn-outline">
            Back to library
          </Link>
        }
      />
    );
  }

  const { set } = data;

  const handleDelete = async () => {
    setBusy(true);
    try {
      await repositories.sets.remove(set.id);
      toast(`"${set.title}" and its study history were deleted.`, 'success');
      navigate('/');
    } catch (cause) {
      toast(
        cause instanceof Error
          ? cause.message
          : 'Quizeasy could not delete that set.',
        'error',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async () => {
    try {
      const result = await repositories.questions.listBySet(set.id);
      const filename = downloadSetExport(set, result.items);
      toast(`Exported ${filename}.`, 'success');
    } catch (cause) {
      toast(
        cause instanceof Error
          ? cause.message
          : 'Quizeasy could not export that set.',
        'error',
      );
    }
  };

  const handleDuplicate = async () => {
    setBusy(true);
    try {
      const copy = await repositories.sets.duplicate(set.id);
      toast(`Copied to "${copy.title}".`, 'success');
      navigate(`/sets/${copy.id}`);
    } catch (cause) {
      toast(
        cause instanceof Error
          ? cause.message
          : 'Quizeasy could not copy that set.',
        'error',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRename = async () => {
    if (titleDraft.trim().length === 0) return;
    setBusy(true);
    try {
      await repositories.sets.update(set.id, {
        title: titleDraft,
        description: set.description,
        tags: set.tags,
      });
      toast('Set renamed.', 'success');
      setMoreOpen(false);
      reload();
    } catch (cause) {
      toast(
        cause instanceof Error
          ? cause.message
          : 'Quizeasy could not rename that set.',
        'error',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Set"
        title={set.title}
        subtitle={
          <span data-testid="set-meta">
            {questions.length} {pluralize(questions.length, 'question')} ·{' '}
            {formatRelativeDate(set.lastStudiedAt)}
          </span>
        }
        backTo="/"
        backLabel="Library"
        actions={
          <>
            {questions.length > 0 ? (
              <Link to={`/sets/${set.id}/study`} className="btn btn-primary">
                <Play aria-hidden="true" className="size-4" />
                Study
              </Link>
            ) : null}
            <Link to={`/sets/${set.id}/edit`} className="btn btn-outline">
              <PencilLine aria-hidden="true" className="size-4" />
              Edit questions
            </Link>
            <Button
              variant="outline"
              aria-label="More set actions"
              onClick={() => {
                setTitleDraft(set.title);
                setMoreOpen(true);
              }}
            >
              <MoreHorizontal aria-hidden="true" className="size-4" />
              More
            </Button>
          </>
        }
      />

      {set.description ? (
        <p className="text-body text-muted mb-4 max-w-prose">
          {set.description}
        </p>
      ) : null}

      {set.tags && set.tags.length > 0 ? (
        <ul className="mb-4 flex flex-wrap gap-1.5">
          {set.tags.map((tag) => (
            <li key={tag}>
              <Badge tone="neutral">{tag}</Badge>
            </li>
          ))}
        </ul>
      ) : null}

      {questions.length === 0 ? (
        <EmptyState
          title="No questions yet"
          description="Charts, notes, or AI output — paste anything that looks like question and answer pairs. Quizeasy will show you what it found before saving."
          actions={
            <>
              <Link to={`/import?set=${set.id}`} className="btn btn-primary">
                <Plus aria-hidden="true" className="size-4" />
                Add questions
              </Link>
              <Link to={`/sets/${set.id}/edit`} className="btn btn-outline">
                Add one manually
              </Link>
            </>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="card p-5 lg:col-span-2" aria-label="Questions">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="eyebrow">Questions</h2>
              <Link
                to={`/sets/${set.id}/edit`}
                className="text-body text-accent hover:underline"
              >
                Open editor
              </Link>
            </div>
            <ul className="flex flex-col">
              {questions.slice(0, 5).map((question) => (
                <li
                  key={question.id}
                  className="border-line first:border-t-0 flex flex-col gap-1 border-t py-3"
                >
                  <p className="text-body font-medium">{question.prompt}</p>
                  <p className="text-body text-muted">{question.answer}</p>
                </li>
              ))}
            </ul>
            {questions.length > 5 ? (
              <p className="text-caption text-muted mt-3">
                +{questions.length - 5} more in the editor.
              </p>
            ) : null}
          </section>

          <div className="flex flex-col gap-4">
            <section className="card p-5" aria-label="Study modes available">
              <h2 className="eyebrow mb-3">What you can study</h2>
              <dl className="flex flex-col">
                <div className="row">
                  <dt className="text-body">Flashcards</dt>
                  <dd className="font-mono text-caption text-muted">
                    {eligibility.flashcard}
                  </dd>
                </div>
                <div className="row">
                  <dt className="text-body">Multiple choice</dt>
                  <dd className="font-mono text-caption text-muted">
                    {eligibility['multiple-choice']}
                  </dd>
                </div>
                <div className="row">
                  <dt className="text-body">Identification</dt>
                  <dd className="font-mono text-caption text-muted">
                    {eligibility.identification}
                  </dd>
                </div>
              </dl>
              <p className="text-caption text-muted mt-3">
                Multiple choice needs wrong choices. Add “W:” lines in the
                editor if a question is missing them.
              </p>
            </section>

            <section className="card p-5" aria-label="Recent sessions">
              <h2 className="eyebrow mb-3">Recent sessions</h2>
              {data.sessions.length === 0 ? (
                <p className="text-body text-muted">
                  No sessions yet. Start one with the Study button.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {data.sessions.slice(0, 5).map((session) => (
                    <li
                      key={session.id}
                      className="flex flex-wrap items-baseline gap-2"
                    >
                      <Link
                        to={`/sets/${set.id}/results/${session.id}`}
                        className="text-body text-accent hover:underline"
                      >
                        {formatDateTime(session.startedAt)}
                      </Link>
                      <span className="font-mono text-eyebrow text-muted">
                        {session.mode}
                        {session.completedAt ? '' : ' · not finished'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}

      <Dialog
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="Set actions"
        description="Rename, export, copy, or delete this set."
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-end gap-2">
            <TextField
              label="Set title"
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
            />
            <Button onClick={() => void handleRename()} disabled={busy}>
              Save
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              to={`/import?set=${set.id}`}
              className="btn btn-outline"
              onClick={() => setMoreOpen(false)}
            >
              <Plus aria-hidden="true" className="size-4" />
              Add more questions
            </Link>
            <SetFileImportButton
              label="Import a set file into this set"
              targetSetId={set.id}
              onImported={() => {
                setMoreOpen(false);
                reload();
              }}
            />
            <Button variant="outline" onClick={() => void handleExport()}>
              <Download aria-hidden="true" className="size-4" />
              Export this set
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleDuplicate()}
              disabled={busy}
            >
              <Copy aria-hidden="true" className="size-4" />
              Duplicate this set
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setMoreOpen(false);
                setConfirmDelete(true);
              }}
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Delete this set
            </Button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete "${set.title}"?`}
        message="This deletes the questions and every study session for this set. Export a backup first if you are not sure."
        confirmLabel="Delete set"
        busy={busy}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
