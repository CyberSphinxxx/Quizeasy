import { useId, useState } from 'react';
import {
  CheckCircle2,
  CircleAlert,
  CircleSlash,
  PencilLine,
  TriangleAlert,
} from 'lucide-react';
import type { ParsedQuestion } from '@/parser';
import { itemStatus } from '@/parser';
import type { EditableItemFields } from '@/parser/validate';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { splitList } from '@/domain/quiz/normalize';

const STATUS_META: Record<
  ReturnType<typeof itemStatus>,
  { label: string; tone: BadgeTone; icon: typeof CheckCircle2 }
> = {
  valid: { label: 'Ready', tone: 'success', icon: CheckCircle2 },
  warning: { label: 'Check this', tone: 'warning', icon: TriangleAlert },
  invalid: { label: 'Needs fixing', tone: 'danger', icon: CircleAlert },
};

export function ImportItemCard({
  item,
  index,
  included,
  onToggleInclude,
  onEdit,
}: {
  item: ParsedQuestion;
  index: number;
  included: boolean;
  onToggleInclude: () => void;
  onEdit: (fields: Partial<EditableItemFields>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EditableItemFields>({
    prompt: item.prompt,
    answer: item.answer,
    acceptedAnswers: item.acceptedAnswers,
    wrongChoices: item.wrongChoices,
    explanation: item.explanation,
    tags: item.tags,
  });
  const fieldId = useId();

  const status = itemStatus(item.issues);
  const meta = STATUS_META[status];
  const StatusIcon = meta.icon;

  const startEditing = () => {
    setDraft({
      prompt: item.prompt,
      answer: item.answer,
      acceptedAnswers: item.acceptedAnswers,
      wrongChoices: item.wrongChoices,
      explanation: item.explanation,
      tags: item.tags,
    });
    setEditing(true);
  };

  const commit = () => {
    onEdit({
      prompt: draft.prompt,
      answer: draft.answer,
      wrongChoices: draft.wrongChoices,
      explanation: draft.explanation,
      tags: draft.tags,
    });
    setEditing(false);
  };

  return (
    <li
      className={`card p-3 ${included ? '' : 'opacity-60'}`}
      data-testid={`import-item-${index}`}
      data-status={status}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            #{index + 1}
          </span>
          <Badge tone={meta.tone}>
            <StatusIcon aria-hidden="true" className="size-3.5" />
            {meta.label}
          </Badge>
          <span className="hint">
            lines {item.lineStart}–{item.lineEnd}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={startEditing}>
            <PencilLine aria-hidden="true" className="size-4" />
            Edit
          </Button>
          <Button
            size="sm"
            variant={included ? 'secondary' : 'primary'}
            onClick={onToggleInclude}
            aria-pressed={!included}
          >
            <CircleSlash aria-hidden="true" className="size-4" />
            {included ? 'Exclude' : 'Excluded'}
          </Button>
        </div>
      </div>

      {editing ? (
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="label" htmlFor={`${fieldId}-prompt`}>
              Question
            </label>
            <textarea
              id={`${fieldId}-prompt`}
              className="input min-h-20"
              value={draft.prompt}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  prompt: event.target.value,
                }))
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="label" htmlFor={`${fieldId}-answer`}>
              Correct answer
            </label>
            <input
              id={`${fieldId}-answer`}
              className="input"
              value={draft.answer}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  answer: event.target.value,
                }))
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="label" htmlFor={`${fieldId}-wrong`}>
              Wrong choices (one per line)
            </label>
            <textarea
              id={`${fieldId}-wrong`}
              className="input min-h-20"
              value={draft.wrongChoices.join('\n')}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  wrongChoices: event.target.value.split('\n'),
                }))
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="label" htmlFor={`${fieldId}-explanation`}>
              Explanation (optional)
            </label>
            <textarea
              id={`${fieldId}-explanation`}
              className="input min-h-16"
              value={draft.explanation ?? ''}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  explanation: event.target.value,
                }))
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="label" htmlFor={`${fieldId}-tags`}>
              Tags (comma separated)
            </label>
            <input
              id={`${fieldId}-tags`}
              className="input"
              value={draft.tags.join(', ')}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  tags: splitList(event.target.value),
                }))
              }
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={commit}>
              Apply changes
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          <p className="whitespace-pre-wrap text-sm font-medium">
            {item.prompt || (
              <span className="text-rose-700 dark:text-rose-300">
                (no question text)
              </span>
            )}
          </p>
          <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
            <span className="font-semibold">Answer:</span>{' '}
            {item.answer || (
              <span className="text-rose-700 dark:text-rose-300">
                (missing)
              </span>
            )}
          </p>
          {item.wrongChoices.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {item.wrongChoices.map((choice) => (
                <li key={choice}>
                  <Badge tone="neutral">✗ {choice}</Badge>
                </li>
              ))}
            </ul>
          ) : null}
          {item.explanation ? (
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {item.explanation}
            </p>
          ) : null}
          {item.tags.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <li key={tag}>
                  <Badge tone="info">#{tag}</Badge>
                </li>
              ))}
            </ul>
          ) : null}
          {item.issues.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {item.issues.map((issue, issueIndex) => (
                <li
                  key={`${issue.code}-${issueIndex}`}
                  className={`text-xs ${
                    issue.severity === 'error'
                      ? 'text-rose-700 dark:text-rose-300'
                      : 'text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {issue.severity === 'error' ? 'Error: ' : 'Note: '}
                  {issue.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </li>
  );
}
