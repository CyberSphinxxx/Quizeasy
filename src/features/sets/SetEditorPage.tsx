import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  PencilLine,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useSetBundle } from '@/hooks/useSetBundle';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, ErrorState, LoadingPanel } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { QuestionFormDialog } from './QuestionFormDialog';
import { repositories } from '@/data/repositories';
import { toast, toastWithUndo } from '@/app/store/appStore';
import type { Question } from '@/domain/schemas/question';
import { truncate } from '@/domain/quiz/normalize';
import { EMPTY_QUESTIONS } from '@/lib/empties';

const PAGE_SIZE = 40;

export function SetEditorPage() {
  const { setId } = useParams<{ setId: string }>();
  const { data, loading, error, reload } = useSetBundle(setId);

  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [editing, setEditing] = useState<Question | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Question | undefined>(
    undefined,
  );
  const [busy, setBusy] = useState(false);

  const questions = data?.questions ?? EMPTY_QUESTIONS;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return questions;
    return questions.filter((question) =>
      [question.prompt, question.answer, ...question.tags]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [questions, query]);

  const visible = filtered.slice(0, visibleCount);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    const removed = pendingDelete;
    try {
      await repositories.questions.remove(removed.id);
      setPendingDelete(undefined);
      reload();
      toastWithUndo('Question deleted.', () => {
        void repositories.questions.addExisting([removed]).then(() => {
          reload();
          toast('Question restored.', 'success');
        });
      });
    } catch (cause) {
      toast(
        cause instanceof Error
          ? cause.message
          : 'Quizeasy could not delete that.',
        'error',
      );
    } finally {
      setBusy(false);
    }
  };

  const move = async (question: Question, direction: -1 | 1) => {
    if (!setId) return;
    const moved = await repositories.questions.move(
      setId,
      question.id,
      direction,
    );
    if (moved) reload();
  };

  if (loading) return <LoadingPanel label="Loading set…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) {
    return (
      <EmptyState
        title="That set is gone"
        description="It may have been deleted in another tab. Your other sets are still here."
        actions={
          <Link to="/" className="btn btn-primary">
            Back to library
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={`Edit "${data.set.title}"`}
        subtitle={`${questions.length} ${
          questions.length === 1 ? 'question' : 'questions'
        } in this set.`}
        backTo={`/sets/${data.set.id}`}
        backLabel="Back to set"
        actions={
          <Button
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus aria-hidden="true" className="size-4" />
            Add question
          </Button>
        }
      />

      {data.skippedQuestions > 0 ? (
        <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          {data.skippedQuestions} stored{' '}
          {data.skippedQuestions === 1 ? 'question was' : 'questions were'}{' '}
          unreadable and {data.skippedQuestions === 1 ? 'was' : 'were'} skipped.
        </p>
      ) : null}

      {questions.length === 0 ? (
        <EmptyState
          title="This set has no questions yet"
          description="Add one manually, or paste a batch of formatted questions."
          actions={
            <>
              <Button
                onClick={() => {
                  setEditing(undefined);
                  setFormOpen(true);
                }}
              >
                <Plus aria-hidden="true" className="size-4" />
                Add a question
              </Button>
              <Link
                to={`/import?set=${data.set.id}`}
                className="btn btn-secondary"
              >
                Paste multiple questions
              </Link>
            </>
          }
        />
      ) : (
        <>
          <div className="mb-4">
            <label className="sr-only" htmlFor="question-search">
              Search questions
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              />
              <input
                id="question-search"
                type="search"
                className="input pl-9"
                placeholder="Search questions, answers, or tags"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="No questions match that search"
              description={`Nothing matched "${query.trim()}" in this set.`}
              actions={
                <Button variant="secondary" onClick={() => setQuery('')}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <ul className="flex flex-col gap-2" data-testid="question-list">
              {visible.map((question) => (
                <li key={question.id} className="card flex flex-col gap-2 p-3">
                  <p className="text-sm font-medium">{question.prompt}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-200">
                    <span className="font-semibold">Answer:</span>{' '}
                    {question.answer}
                  </p>
                  {question.wrongChoices.length > 0 ? (
                    <p className="hint">
                      Wrong choices:{' '}
                      {truncate(question.wrongChoices.join(' · '), 120)}
                    </p>
                  ) : null}
                  {question.tags.length > 0 ? (
                    <ul className="flex flex-wrap gap-1.5">
                      {question.tags.map((tag) => (
                        <li key={tag}>
                          <Badge tone="info">#{tag}</Badge>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(question);
                        setFormOpen(true);
                      }}
                      aria-label={`Edit question: ${truncate(question.prompt, 40)}`}
                    >
                      <PencilLine aria-hidden="true" className="size-4" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void move(question, -1)}
                      aria-label={`Move up: ${truncate(question.prompt, 40)}`}
                    >
                      <ArrowUp aria-hidden="true" className="size-4" />
                      Up
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void move(question, 1)}
                      aria-label={`Move down: ${truncate(question.prompt, 40)}`}
                    >
                      <ArrowDown aria-hidden="true" className="size-4" />
                      Down
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPendingDelete(question)}
                      aria-label={`Delete question: ${truncate(question.prompt, 40)}`}
                      className="text-rose-700 hover:bg-rose-100 dark:text-rose-300 dark:hover:bg-rose-950"
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {filtered.length > visibleCount ? (
            <div className="mt-4">
              <Button
                variant="secondary"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                Show {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more
                of {filtered.length}
              </Button>
            </div>
          ) : null}
        </>
      )}

      <QuestionFormDialog
        key={editing?.id ?? 'new-question'}
        open={formOpen}
        setId={data.set.id}
        {...(editing ? { question: editing } : {})}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this question?"
        message="You can undo this right after deleting."
        confirmLabel="Delete question"
        busy={busy}
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDelete(undefined)}
      />
    </div>
  );
}
