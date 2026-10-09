import { Check, Eye, X } from 'lucide-react';
import type { Question } from '@/domain/schemas/question';
import { Button } from '@/components/ui/Button';
import { Keycap } from '@/components/ui/Badge';

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
    <div className="flex flex-col gap-5">
      <div className="card flex flex-col gap-3 p-8">
        <p className="eyebrow">Question</p>
        <p
          className="text-question whitespace-pre-wrap"
          data-testid="flashcard-prompt"
        >
          {question.prompt}
        </p>
      </div>

      {revealed ? (
        <div className="card p-5" data-testid="flashcard-answer">
          <p className="eyebrow">Answer</p>
          <p className="text-question mt-2 whitespace-pre-wrap">
            {question.answer}
          </p>
          {question.explanation ? (
            <p className="text-body text-muted border-line mt-3 border-t pt-3">
              {question.explanation}
            </p>
          ) : null}
        </div>
      ) : null}

      {!revealed ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={onReveal} data-testid="flashcard-reveal">
              <Eye aria-hidden="true" className="size-4" />
              Show answer
            </Button>
            <Button variant="ghost" onClick={onSkip} disabled={answered}>
              Skip for now
            </Button>
          </div>
          <p className="text-caption text-muted flex items-center gap-1.5">
            <Keycap>Space</Keycap>
            <span>reveals the answer</span>
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
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
          <p className="text-caption text-muted flex flex-wrap items-center gap-1.5">
            <Keycap>1</Keycap>
            <span>missed</span>
            <span aria-hidden="true">·</span>
            <Keycap>2</Keycap>
            <span>knew it</span>
          </p>
        </div>
      )}
    </div>
  );
}
