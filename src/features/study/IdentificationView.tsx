import { useState } from 'react';
import { CircleAlert, CircleCheck } from 'lucide-react';
import type { Question } from '@/domain/schemas/question';
import { Button } from '@/components/ui/Button';
import { Keycap } from '@/components/ui/Badge';
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
    <div className="flex flex-col gap-5">
      <div className="card flex flex-col gap-2 p-8">
        <p className="eyebrow">Type the answer</p>
        <p
          className="text-question whitespace-pre-wrap"
          data-testid="identification-prompt"
        >
          {question.prompt}
        </p>
        {question.tags.length > 0 ? (
          <p className="font-mono text-eyebrow text-muted">
            #{question.tags.join(' #')}
          </p>
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
        <div className="flex flex-wrap items-center gap-3">
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
          <p className="text-caption text-muted flex flex-wrap items-center gap-1.5">
            <Keycap>Enter</Keycap>
            <span>submits · capitalization and spacing do not matter</span>
          </p>
        </div>
      </form>

      {reveal ? (
        <div className="card p-5" data-testid="identification-feedback">
          <p className="text-body flex items-center gap-2 font-medium">
            {isCorrect ? (
              <>
                <CircleCheck
                  aria-hidden="true"
                  className="text-correct size-4"
                />
                Correct
              </>
            ) : (
              <>
                <CircleAlert
                  aria-hidden="true"
                  className="text-incorrect size-4"
                />
                Not quite
              </>
            )}
          </p>
          <div className="border-line mt-3 flex flex-col gap-1 border-t pt-3">
            <p className="text-body text-ink">
              <span className="font-medium">Correct answer:</span>{' '}
              {question.answer}
            </p>
            {question.acceptedAnswers.length > 0 ? (
              <p className="text-caption text-muted">
                Also accepted: {question.acceptedAnswers.join(', ')}
              </p>
            ) : null}
            {response && !isCorrect ? (
              <p className="text-caption text-muted">You typed: {response}</p>
            ) : null}
            {question.explanation ? (
              <p className="text-body text-muted">{question.explanation}</p>
            ) : null}
          </div>
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
