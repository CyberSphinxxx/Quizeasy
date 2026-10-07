import { Check, Eye, X } from 'lucide-react';
import type { Question } from '@/domain/schemas/question';
import { Button } from '@/components/ui/Button';

export function FlashcardView({
  question,
  revealed,
  answered,
  onReveal,
  onAnswer,
  onSkip,
}: {
  question: Question;
  revealed: boolean;
  answered: boolean;
  onReveal: () => void;
  onAnswer: (result: 'known' | 'missed') => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="card flex min-h-40 flex-col justify-center gap-3 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Question
        </p>
        <p
          className="whitespace-pre-wrap text-lg font-medium"
          data-testid="flashcard-prompt"
        >
          {question.prompt}
        </p>
      </div>

      {revealed ? (
        <div
          className="card animate-fade-in flex flex-col gap-3 border-indigo-200 p-5 dark:border-indigo-900"
          data-testid="flashcard-answer"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
            Answer
          </p>
          <p className="whitespace-pre-wrap text-lg">{question.answer}</p>
          {question.explanation ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {question.explanation}
            </p>
          ) : null}
        </div>
      ) : null}

      {!revealed ? (
        <div className="flex flex-wrap gap-2">
          <Button onClick={onReveal} data-testid="flashcard-reveal">
            <Eye aria-hidden="true" className="size-4" />
            Show answer
          </Button>
          <Button variant="ghost" onClick={onSkip} disabled={answered}>
            Skip for now
          </Button>
          <p className="hint w-full">Tip: press Space to reveal.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="danger"
              onClick={() => onAnswer('missed')}
              disabled={answered}
              data-testid="flashcard-missed"
            >
              <X aria-hidden="true" className="size-4" />I missed it
            </Button>
            <Button
              onClick={() => onAnswer('known')}
              disabled={answered}
              data-testid="flashcard-known"
            >
              <Check aria-hidden="true" className="size-4" />I knew it
            </Button>
            <Button variant="ghost" onClick={onSkip} disabled={answered}>
              Skip for now
            </Button>
          </div>
          <p className="hint">Keys: 1 = missed, 2 = knew it, arrows to move.</p>
        </div>
      )}
    </div>
  );
}
