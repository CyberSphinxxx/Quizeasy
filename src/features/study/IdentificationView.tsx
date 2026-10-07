import { useState } from 'react';
import { CircleAlert, CircleCheck } from 'lucide-react';
import type { Question } from '@/domain/schemas/question';
import { Button } from '@/components/ui/Button';
import { matchesAnyAnswer } from '@/domain/quiz/normalize';

export function IdentificationView({
  question,
  answered,
  response,
  isCorrect,
  showFeedback,
  onSubmit,
  onSkip,
}: {
  question: Question;
  answered: boolean;
  response?: string;
  isCorrect: boolean;
  showFeedback: boolean;
  onSubmit: (response: string) => void;
  onSkip: () => void;
}) {
  // The session page remounts this view per question, so the initial value is
  // always the answer recorded for the current question (if any).
  const [value, setValue] = useState(response ?? '');

  const reveal = answered && showFeedback;

  return (
    <div className="flex flex-col gap-4">
      <div className="card flex flex-col gap-2 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Type the answer
        </p>
        <p
          className="whitespace-pre-wrap text-lg font-medium"
          data-testid="identification-prompt"
        >
          {question.prompt}
        </p>
        {question.tags.length > 0 ? (
          <p className="hint">#{question.tags.join(' #')}</p>
        ) : null}
      </div>

      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (answered || value.trim().length === 0) return;
          onSubmit(value);
        }}
      >
        <label className="label" htmlFor="identification-input">
          Your answer
        </label>
        <input
          id="identification-input"
          className="input"
          value={value}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          disabled={answered}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Type what you remember"
          data-testid="identification-input"
        />
        <div className="flex flex-wrap items-center gap-2">
          {!answered ? (
            <>
              <Button
                type="submit"
                disabled={value.trim().length === 0}
                data-testid="identification-submit"
              >
                Check answer
              </Button>
              <Button variant="ghost" onClick={onSkip}>
                I don&apos;t know
              </Button>
            </>
          ) : null}
          <p className="hint">
            Enter submits. Capitalization and spacing do not matter.
          </p>
        </div>
      </form>

      {reveal ? (
        <div
          className={`card p-4 ${isCorrect ? 'border-emerald-300 dark:border-emerald-800' : 'border-rose-300 dark:border-rose-900'}`}
          data-testid="identification-feedback"
        >
          <p className="flex items-center gap-2 font-semibold">
            {isCorrect ? (
              <>
                <CircleCheck
                  aria-hidden="true"
                  className="size-5 text-emerald-600 dark:text-emerald-400"
                />
                Correct
              </>
            ) : (
              <>
                <CircleAlert
                  aria-hidden="true"
                  className="size-5 text-rose-600 dark:text-rose-400"
                />
                Not quite
              </>
            )}
          </p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
            <span className="font-semibold">Correct answer:</span>{' '}
            {question.answer}
          </p>
          {question.acceptedAnswers.length > 0 ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Also accepted: {question.acceptedAnswers.join(', ')}
            </p>
          ) : null}
          {response && !isCorrect ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              You typed: {response}
            </p>
          ) : null}
          {question.explanation ? (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {question.explanation}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Shared scoring helper so the view and the session page agree. */
export function gradeIdentification(
  response: string,
  question: Question,
): boolean {
  return matchesAnyAnswer(response, [
    question.answer,
    ...question.acceptedAnswers,
  ]);
}
