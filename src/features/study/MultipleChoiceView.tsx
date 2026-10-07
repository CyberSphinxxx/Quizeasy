import { CircleAlert, CircleCheck } from 'lucide-react';
import type { SessionPlanItem } from '@/domain/schemas/study';
import { Button } from '@/components/ui/Button';
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
    <div className="flex flex-col gap-4">
      <div className="card flex flex-col gap-2 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Pick the answer
        </p>
        <p
          className="whitespace-pre-wrap text-lg font-medium"
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
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
                  showAsCorrect
                    ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950'
                    : showAsWrong
                      ? 'border-rose-500 bg-rose-50 dark:border-rose-600 dark:bg-rose-950'
                      : selected
                        ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950'
                        : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/60 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
                }`}
                onClick={() => onSelect(choice)}
                disabled={answered}
                aria-pressed={selected}
                aria-label={`Choice ${LETTERS[index] ?? index + 1}: ${choice}`}
              >
                <span
                  aria-hidden="true"
                  className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-100"
                >
                  {LETTERS[index] ?? index + 1}
                </span>
                <span className="whitespace-pre-wrap text-sm font-medium">
                  {choice}
                </span>
                {showAsCorrect ? (
                  <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <CircleCheck aria-hidden="true" className="size-4" />
                    Correct
                  </span>
                ) : null}
                {showAsWrong ? (
                  <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-300">
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
        <div
          className={`card p-4 ${isCorrect ? 'border-emerald-300 dark:border-emerald-800' : 'border-rose-300 dark:border-rose-900'}`}
          data-testid="mcq-feedback"
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
                {selectedChoice === undefined
                  ? 'Skipped'
                  : `Not quite — the answer is ${correctChoice ?? 'unknown'}`}
              </>
            )}
          </p>
          {explanation ? (
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
              {explanation}
            </p>
          ) : null}
        </div>
      ) : null}

      {!answered ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={onSkip}>
            Skip
          </Button>
          <p className="hint">
            Keys: 1–{choices.length} to choose, Enter for next.
          </p>
        </div>
      ) : null}
    </div>
  );
}
