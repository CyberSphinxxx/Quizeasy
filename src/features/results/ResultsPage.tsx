import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CircleCheck, CircleSlash, RefreshCw, Repeat, X } from 'lucide-react';
import { useSetBundle } from '@/hooks/useSetBundle';
import { repositories } from '@/data/repositories';
import { useAsyncData } from '@/hooks/useAsyncData';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  EmptyState,
  ErrorState,
  LoadingPanel,
  ProgressBar,
} from '@/components/ui/Feedback';
import { useStudySession } from '@/features/study/studySessionStore';
import { buildRetryPlan } from '@/domain/study/plan';
import { summarizeSession } from '@/domain/study/scoring';
import {
  STUDY_MODE_LABELS,
  type SessionPlanItem,
} from '@/domain/schemas/study';
import { createSessionSeed } from '@/lib/rng';
import { toast } from '@/app/store/appStore';
import { formatDateTime, pluralize } from '@/lib/utils';
import { EMPTY_QUESTIONS } from '@/lib/empties';

export function ResultsPage() {
  const { setId, sessionId } = useParams<{
    setId: string;
    sessionId: string;
  }>();
  const navigate = useNavigate();
  const bundle = useSetBundle(setId);
  const startSession = useStudySession((state) => state.start);
  const [retrying, setRetrying] = useState(false);

  const result = useAsyncData(async () => {
    if (!sessionId) return null;
    const session = await repositories.sessions.get(sessionId);
    if (!session) return null;
    const attempts = await repositories.attempts.listBySession(sessionId);
    return { session, attempts: attempts.items };
  }, [sessionId]);

  const questions = bundle.data?.questions ?? EMPTY_QUESTIONS;

  const plan: SessionPlanItem[] = useMemo(() => {
    const session = result.data?.session;
    if (!session) return [];
    if (session.plan && session.plan.length > 0) return session.plan;
    // Fall back for sessions saved without a plan.
    const attempts = result.data?.attempts ?? [];
    return session.itemIds.map((questionId) => ({
      questionId,
      presentationMode:
        attempts.find((attempt) => attempt.questionId === questionId)
          ?.presentationMode ?? 'flashcard',
    }));
  }, [result.data]);

  const summary = useMemo(
    () => summarizeSession(plan, result.data?.attempts ?? []),
    [plan, result.data],
  );

  const handleRetry = useCallback(async () => {
    const session = result.data?.session;
    if (!session || !setId) return;
    setRetrying(true);
    try {
      const seed = createSessionSeed();
      const options = {
        ...session.options,
        questionLimit: 'all' as const,
        seed,
      };
      const retry = buildRetryPlan({
        originItems: plan,
        missedQuestionIds: summary.missedQuestionIds,
        availableQuestionIds: questions.map((question) => question.id),
        options,
        seed,
      });

      if (retry.items.length === 0) {
        toast('Nothing to retry — those questions were deleted.', 'info');
        return;
      }

      await startSession({
        setId,
        options,
        plan: retry.items,
        originSessionId: session.id,
      });
      navigate(`/sets/${setId}/study/session`);
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : 'Quizeasy could not start the retry session.',
        'error',
      );
    } finally {
      setRetrying(false);
    }
  }, [
    navigate,
    plan,
    questions,
    result.data,
    setId,
    startSession,
    summary.missedQuestionIds,
  ]);

  if (bundle.loading || result.loading) {
    return <LoadingPanel label="Loading your results…" />;
  }
  if (bundle.error || result.error) {
    return (
      <ErrorState
        message={bundle.error ?? result.error ?? 'Unknown error'}
        onRetry={result.reload}
      />
    );
  }
  if (!setId || !result.data) {
    return (
      <EmptyState
        title="That session is gone"
        description="Study sessions are stored with their set. It may have been deleted."
        actions={
          <Link to="/" className="btn btn-outline">
            Back to library
          </Link>
        }
      />
    );
  }

  const { session, attempts } = result.data;
  const isComplete = Boolean(session.completedAt);

  return (
    <div>
      <PageHeader
        eyebrow={STUDY_MODE_LABELS[session.mode]}
        title={isComplete ? 'Results' : 'Results so far'}
        subtitle={`Started ${formatDateTime(session.startedAt)}${
          isComplete ? '' : ' · not finished'
        }`}
        backTo={`/sets/${setId}`}
        backLabel="Back to set"
      />

      <section className="card mb-5 flex flex-col gap-5 p-5" aria-label="Score">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p
              className="font-display text-title font-medium"
              data-testid="results-percentage"
            >
              {summary.percentage}%
            </p>
            <p className="text-body text-muted">
              {summary.correct} of {summary.totalItems}{' '}
              {pluralize(summary.totalItems, 'question')} correct
            </p>
          </div>
          <ul className="flex flex-wrap gap-2">
            <li>
              <Badge tone="correct">
                <CircleCheck aria-hidden="true" className="size-3.5" />
                {summary.correct} correct
              </Badge>
            </li>
            <li>
              <Badge tone="incorrect">
                <X aria-hidden="true" className="size-3.5" />
                {summary.incorrect} incorrect
              </Badge>
            </li>
            <li>
              <Badge tone="neutral">
                <CircleSlash aria-hidden="true" className="size-3.5" />
                {summary.skipped} skipped
              </Badge>
            </li>
          </ul>
        </div>

        <ProgressBar
          value={summary.correct}
          max={Math.max(1, summary.totalItems)}
          label="Score"
        />

        <dl className="border-line flex flex-col border-t pt-2">
          {Object.entries(summary.byMode).map(([mode, score]) =>
            score.total > 0 ? (
              <div key={mode} className="row">
                <dt className="text-body text-ink">
                  {STUDY_MODE_LABELS[mode as keyof typeof STUDY_MODE_LABELS]}
                </dt>
                <dd className="font-mono text-caption text-muted">
                  {score.correct}/{score.total}
                </dd>
              </div>
            ) : null,
          )}
          <div className="row">
            <dt className="text-body text-ink">Answered</dt>
            <dd className="font-mono text-caption text-muted">
              {summary.answered}/{summary.totalItems}
            </dd>
          </div>
        </dl>
      </section>

      <div className="mb-5 flex flex-wrap gap-2">
        {summary.missedQuestionIds.length > 0 ? (
          <Button
            onClick={() => void handleRetry()}
            disabled={retrying}
            data-testid="retry-mistakes"
          >
            <Repeat aria-hidden="true" className="size-4" />
            {retrying
              ? 'Starting…'
              : `Retry ${summary.missedQuestionIds.length} ${pluralize(
                  summary.missedQuestionIds.length,
                  'mistake',
                )}`}
          </Button>
        ) : (
          <p className="card text-body text-correct flex w-full items-center gap-2 px-4 py-3">
            <CircleCheck aria-hidden="true" className="size-4" />
            No mistakes to retry — nice work.
          </p>
        )}
        <Link to={`/sets/${setId}/study`} className="btn btn-outline">
          <RefreshCw aria-hidden="true" className="size-4" />
          Study again
        </Link>
        <Link to={`/sets/${setId}`} className="btn btn-ghost">
          Back to set
        </Link>
      </div>

      <section aria-label="Missed questions" className="mb-5">
        <h2 className="eyebrow mb-3">
          Questions to review ({summary.missedItems.length})
        </h2>
        {summary.missedItems.length === 0 ? (
          <p className="text-body text-muted">
            Every question was answered correctly.
          </p>
        ) : (
          <ul className="card flex flex-col p-2">
            {summary.missedItems.map((item) => {
              const question = questions.find(
                (candidate) => candidate.id === item.questionId,
              );
              const attempt = attempts.find(
                (candidate) => candidate.questionId === item.questionId,
              );
              return (
                <li
                  key={item.questionId}
                  className="border-line first:border-t-0 flex flex-col gap-1 border-t px-3 py-4"
                >
                  <p className="text-card font-display font-medium">
                    {question?.prompt ?? 'This question was deleted.'}
                  </p>
                  <p className="text-body text-ink">
                    <span className="font-medium">Answer:</span>{' '}
                    {question?.answer ?? '—'}
                  </p>
                  {plan.find((entry) => entry.questionId === item.questionId)
                    ?.choices ? (
                    <p className="mt-1 hint">
                      Choices:{' '}
                      {plan
                        .find((entry) => entry.questionId === item.questionId)
                        ?.choices?.join(' · ')}
                    </p>
                  ) : null}
                  {attempt?.response ? (
                    <p className="text-body text-incorrect">
                      You answered: {attempt.response}
                    </p>
                  ) : null}
                  {question?.explanation ? (
                    <p className="text-caption text-muted">
                      {question.explanation}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <details className="card p-5">
        <summary className="text-body cursor-pointer font-medium">
          Review every question in this session
        </summary>
        <ul className="mt-3 flex flex-col">
          {plan.map((item) => {
            const question = questions.find(
              (candidate) => candidate.id === item.questionId,
            );
            const attempt = attempts.find(
              (candidate) => candidate.questionId === item.questionId,
            );
            const outcome = !attempt
              ? 'skipped'
              : attempt.result === 'correct' || attempt.result === 'known'
                ? 'correct'
                : attempt.result === 'skipped'
                  ? 'skipped'
                  : 'incorrect';
            return (
              <li
                key={item.questionId}
                className="border-line flex flex-col gap-1 border-t py-3 first:border-t-0"
              >
                <p className="text-body font-medium">
                  {question?.prompt ?? 'Deleted question'}
                </p>
                <p className="text-caption text-muted">
                  Answer: {question?.answer ?? '—'}
                </p>
                <span>
                  <Badge
                    tone={
                      outcome === 'correct'
                        ? 'correct'
                        : outcome === 'incorrect'
                          ? 'incorrect'
                          : 'neutral'
                    }
                  >
                    {outcome}
                  </Badge>
                </span>
              </li>
            );
          })}
        </ul>
      </details>
    </div>
  );
}
