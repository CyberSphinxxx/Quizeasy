import { CircleAlert, CircleCheck } from 'lucide-react';
import type { SessionPlanItem } from '@/domain/schemas/study';
import { Button } from '@/components/ui/Button';
import { Keycap } from '@/components/ui/Badge';
import { answerKey } from '@/domain/quiz/normalize';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function MultipleChoiceView({
  item,
  prompt,
  explanation,
  selectedChoice,
  answered,
  showFeedback,
  onSelect,
  onSkip,
}: {
  item: SessionPlanItem;
  prompt: string;
  explanation?: string;
  selectedChoice?: string;
  answered: boolean;
  showFeedback: boolean;
  onSelect: (choice: string) => void;
  onSkip: () => void;
}) {
  const choices = item.choices ?? [];
  const correctIndex = item.correctChoiceIndex ?? -1;
  const correctChoice = choices[correctIndex];
  const isCorrect =
    selectedChoice !== undefined &&
    correctChoice !== undefined &&
    answerKey(selectedChoice) === answerKey(correctChoice);
  const reveal = answered && showFeedback;

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-col gap-2 p-8">
        <p className="eyebrow">Pick the answer</p>
        <p
          className="text-question whitespace-pre-wrap"
          data-testid="mcq-prompt"
        >
          {prompt}
        </p>
        {item.reducedChoices ? (
          <p className="hint">
            This set only had {choices.length} usable choices for this question.
          </p>
        ) : null}
      </div>

      <ul className="flex flex-col gap-2" data-testid="mcq-choices">
        {choices.map((choice, index) => {
          const selected =
            selectedChoice !== undefined &&
            answerKey(choice) === answerKey(selectedChoice);
          const isAnswer = index === correctIndex;
          const showAsCorrect = reveal && isAnswer;
          const showAsWrong = reveal && selected && !isAnswer;

          return (
            <li key={`${choice}-${index}`}>
              <button
                type="button"
                className={`rounded-control flex w-full items-start gap-3 border px-4 py-3 text-left transition ${
                  showAsCorrect
                    ? 'border-correct bg-correct/8'
                    : showAsWrong
                      ? 'border-incorrect bg-incorrect/8'
                      : selected
                        ? 'border-accent bg-accent-soft'
                        : 'border-line bg-surface hover:border-line-strong hover:bg-raised'
                }`}
                onClick={() => onSelect(choice)}
                disabled={answered}
                aria-pressed={selected}
                aria-label={`Choice ${LETTERS[index] ?? index + 1}: ${choice}`}
              >
                <span
                  aria-hidden="true"
                  className="rounded-chip bg-raised text-muted mt-0.5 flex size-5 shrink-0 items-center justify-center font-mono text-eyebrow"
                >
                  {LETTERS[index] ?? index + 1}
                </span>
                <span className="text-body whitespace-pre-wrap font-medium">
                  {choice}
                </span>
                {showAsCorrect ? (
                  <span className="text-caption text-correct ml-auto flex items-center gap-1 font-medium">
                    <CircleCheck aria-hidden="true" className="size-4" />
                    Correct
                  </span>
                ) : null}
                {showAsWrong ? (
                  <span className="text-caption text-incorrect ml-auto flex items-center gap-1 font-medium">
                    <CircleAlert aria-hidden="true" className="size-4" />
                    Not this one
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      {reveal ? (
        <div className="card p-5" data-testid="mcq-feedback">
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
                {selectedChoice === undefined
                  ? 'Skipped'
                  : `Not quite — the answer is ${correctChoice ?? 'unknown'}`}
              </>
            )}
          </p>
          {explanation ? (
            <p className="text-body text-muted mt-2">{explanation}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {!answered ? (
          <Button variant="ghost" onClick={onSkip}>
            Skip
          </Button>
        ) : null}
        <p className="text-caption text-muted flex flex-wrap items-center gap-1.5">
          <Keycap>1</Keycap>
          <span aria-hidden="true">–</span>
          <Keycap>{String(choices.length)}</Keycap>
          <span>choose</span>
          <span aria-hidden="true">·</span>
          <Keycap>Enter</Keycap>
          <span>next</span>
        </p>
      </div>
    </div>
  );
}
