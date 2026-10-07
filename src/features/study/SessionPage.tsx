import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Flag } from 'lucide-react';
import { useSetBundle } from '@/hooks/useSetBundle';
import { repositories } from '@/data/repositories';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  EmptyState,
  ErrorState,
  LoadingPanel,
  ProgressBar,
} from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { FlashcardView } from './FlashcardView';
import { IdentificationView, gradeIdentification } from './IdentificationView';
import { MultipleChoiceView } from './MultipleChoiceView';
import { findAttempt, useStudySession } from './studySessionStore';
import { STUDY_MODE_LABELS, type StudySession } from '@/domain/schemas/study';
import { answerKey } from '@/domain/quiz/normalize';
import { toast } from '@/app/store/appStore';
import { pluralize } from '@/lib/utils';
import { EMPTY_QUESTIONS } from '@/lib/empties';

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || target.isContentEditable;
}

export function SessionPage() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const bundle = useSetBundle(setId);

  const session = useStudySession((state) => state.session);
  const plan = useStudySession((state) => state.plan);
  const attempts = useStudySession((state) => state.attempts);
  const index = useStudySession((state) => state.index);
  const revealed = useStudySession((state) => state.revealed);
  const answered = useStudySession((state) => state.answered);
  const { resume, record, next, previous, reveal, finish } = useStudySession();

  const [resolving, setResolving] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  /** Resume an interrupted session after a reload, if one exists. */
  useEffect(() => {
    if (!setId || bundle.loading) return undefined;
    let active = true;

    const resolve = async () => {
      const alreadyActive = session && session.setId === setId;
      if (!alreadyActive) {
        const existing: StudySession | undefined =
          await repositories.sessions.findActiveForSet(setId);
        if (!active) return;
        if (existing && existing.plan && existing.plan.length > 0) {
          await resume(existing);
          if (!active) return;
          toast('Resumed your unfinished session.', 'info');
        }
      }
      if (active) setResolving(false);
    };

    void resolve();

    return () => {
      active = false;
    };
  }, [setId, bundle.loading, session, resume]);

  const questions = bundle.data?.questions ?? EMPTY_QUESTIONS;
  const item = plan[index];
  const question = useMemo(
    () =>
      item
        ? questions.find((candidate) => candidate.id === item.questionId)
        : undefined,
    [item, questions],
  );
  const attempt = findAttempt(attempts, item);
  const isLast = plan.length > 0 && index === plan.length - 1;
  const feedback = session?.options.feedback ?? 'immediate';

  const goToResults = useCallback(async () => {
    if (!session || !setId) return;
    await finish();
    navigate(`/sets/${setId}/results/${session.id}`, { replace: true });
  }, [finish, navigate, session, setId]);

  const handleAnswer = useCallback(
    async (result: 'known' | 'missed') => {
      if (!item || !question) return;
      await record({ result });
      if (!isLast) next();
    },
    [record, item, question, isLast, next],
  );

  const handleChoice = useCallback(
    async (choice: string) => {
      if (!item || !question) return;
      const correct = item.choices?.[item.correctChoiceIndex ?? -1];
      const isCorrect =
        correct !== undefined && answerKey(choice) === answerKey(correct);
      await record({
        result: isCorrect ? 'correct' : 'incorrect',
        selectedChoice: choice,
      });
      if (feedback === 'delayed' && !isLast) next();
    },
    [item, question, record, feedback, isLast, next],
  );

  const handleIdentification = useCallback(
    async (response: string) => {
      if (!question) return;
      const isCorrect = gradeIdentification(response, question);
      await record({
        result: isCorrect ? 'correct' : 'incorrect',
        response,
      });
      if (feedback === 'delayed' && !isLast) next();
    },
    [question, record, feedback, isLast, next],
  );

  const handleSkip = useCallback(async () => {
    if (!item || !question) return;
    await record({ result: 'skipped' });
    if (!isLast) next();
  }, [item, question, record, isLast, next]);

  // Keyboard shortcuts for a keyboard-first study flow.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (!item || !question) return;

      if (event.key === ' ') {
        if (feedback === 'immediate' && answered && !isLast) {
          event.preventDefault();
          next();
          return;
        }
        if (item.presentationMode === 'flashcard' && !revealed) {
          event.preventDefault();
          reveal();
        }
        return;
      }

      if (event.key === 'ArrowRight' && !isLast && index < plan.length - 1) {
        next();
        return;
      }
      if (event.key === 'ArrowLeft' && index > 0) {
        previous();
        return;
      }

      if (event.key === 'Enter' && answered && !isLast) {
        next();
        return;
      }

      if (/^[1-9]$/.test(event.key)) {
        const numeric = Number(event.key);
        if (item.presentationMode === 'multiple-choice' && !answered) {
          const choice = item.choices?.[numeric - 1];
          if (choice) {
            event.preventDefault();
            void handleChoice(choice);
          }
          return;
        }
        if (item.presentationMode === 'flashcard' && revealed && !answered) {
          event.preventDefault();
          void handleAnswer(numeric === 1 ? 'missed' : 'known');
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    answered,
    feedback,
    handleAnswer,
    handleChoice,
    index,
    isLast,
    item,
    next,
    plan.length,
    previous,
    question,
    reveal,
    revealed,
  ]);

  if (bundle.loading || resolving) {
    return <LoadingPanel label="Getting your session ready…" />;
  }
  if (bundle.error) {
    return <ErrorState message={bundle.error} onRetry={bundle.reload} />;
  }
  if (!setId || !bundle.data) {
    return (
      <EmptyState
        title="That set is gone"
        description="It may have been deleted in another tab."
        actions={
          <Link to="/" className="btn btn-primary">
            Back to library
          </Link>
        }
      />
    );
  }

  if (!session || plan.length === 0) {
    return (
      <EmptyState
        title="No session in progress"
        description="Choose a study mode and how many questions you want, then start again."
        actions={
          <Link to={`/sets/${setId}/study`} className="btn btn-primary">
            Set up a session
          </Link>
        }
      />
    );
  }

  if (!item || !question) {
    return (
      <EmptyState
        title="This question is no longer available"
        description="It looks like the question was deleted while this session was open."
        actions={
          <Button onClick={() => void goToResults()}>See results</Button>
        }
      />
    );
  }

  const answeredCount = attempts.length;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              Question {index + 1} of {plan.length}
            </span>
            <Badge tone="info">{STUDY_MODE_LABELS[session.mode]}</Badge>
            <Badge tone="neutral">
              {feedback === 'immediate' ? 'Study mode' : 'Test mode'}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setConfirmEnd(true)}>
            <Flag aria-hidden="true" className="size-4" />
            Finish now
          </Button>
        </div>
        <ProgressBar
          value={answeredCount}
          max={plan.length}
          label={`${answeredCount} of ${plan.length} answered`}
        />
      </header>

      {item.presentationMode === 'flashcard' ? (
        <FlashcardView
          question={question}
          revealed={revealed}
          answered={answered}
          onReveal={reveal}
          onAnswer={(result) => void handleAnswer(result)}
          onSkip={() => void handleSkip()}
        />
      ) : null}

      {item.presentationMode === 'multiple-choice' ? (
        <MultipleChoiceView
          item={item}
          prompt={question.prompt}
          {...(question.explanation
            ? { explanation: question.explanation }
            : {})}
          {...(attempt?.selectedChoice
            ? { selectedChoice: attempt.selectedChoice }
            : {})}
          answered={answered}
          showFeedback={feedback === 'immediate'}
          onSelect={(choice) => void handleChoice(choice)}
          onSkip={() => void handleSkip()}
        />
      ) : null}

      {item.presentationMode === 'identification' ? (
        <IdentificationView
          key={item.questionId}
          question={question}
          answered={answered}
          {...(attempt?.response ? { response: attempt.response } : {})}
          isCorrect={
            attempt?.response
              ? gradeIdentification(attempt.response, question)
              : false
          }
          showFeedback={feedback === 'immediate'}
          onSubmit={(response) => void handleIdentification(response)}
          onSkip={() => void handleSkip()}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="ghost"
          onClick={() => previous()}
          disabled={index === 0}
          aria-label="Previous question"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Previous
        </Button>

        {isLast ? (
          <Button
            onClick={() => void goToResults()}
            disabled={busy}
            data-testid="session-finish"
          >
            See results
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={() => next()}
            data-testid="session-next"
          >
            Next
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        )}
      </div>

      {answered && feedback === 'delayed' && !isLast ? (
        <p className="hint">
          Answer saved. Feedback comes at the end in test mode.
        </p>
      ) : null}

      <ConfirmDialog
        open={confirmEnd}
        title="Finish this session now?"
        message={`You have answered ${answeredCount} of ${plan.length} ${pluralize(
          plan.length,
          'question',
        )}. Everything you answered is saved, and the rest count as skipped.`}
        confirmLabel="Finish and see results"
        tone="primary"
        busy={busy}
        onConfirm={() => {
          setBusy(true);
          void goToResults().finally(() => setBusy(false));
        }}
        onCancel={() => setConfirmEnd(false)}
      />
    </div>
  );
}
