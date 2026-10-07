import { useState } from 'react';
import type { Question, QuestionDraft } from '@/domain/schemas/question';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { TextAreaField, TextField } from '@/components/ui/Form';
import { repositories } from '@/data/repositories';
import { splitList } from '@/domain/quiz/normalize';
import { toast } from '@/app/store/appStore';

const EMPTY_DRAFT = {
  prompt: '',
  answer: '',
  acceptedAnswers: '',
  wrongChoices: '',
  explanation: '',
  tags: '',
};

function toFormState(question: Question | undefined) {
  if (!question) return { ...EMPTY_DRAFT };
  return {
    prompt: question.prompt,
    answer: question.answer,
    acceptedAnswers: question.acceptedAnswers.join(', '),
    wrongChoices: question.wrongChoices.join('\n'),
    explanation: question.explanation ?? '',
    tags: question.tags.join(', '),
  };
}

export function QuestionFormDialog({
  open,
  setId,
  question,
  onClose,
  onSaved,
}: {
  open: boolean;
  setId: string;
  question?: Question;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(() => toFormState(question));
  const [errors, setErrors] = useState<{ prompt?: string; answer?: string }>(
    {},
  );
  const [busy, setBusy] = useState(false);

  // Screens remount this dialog per question (via `key`), so state is always
  // the initial state for the question being edited. Closing clears it too.
  const handleClose = () => {
    setForm(toFormState(question));
    setErrors({});
    onClose();
  };

  const handleSubmit = async () => {
    const nextErrors: { prompt?: string; answer?: string } = {};
    if (form.prompt.trim().length === 0) {
      nextErrors.prompt = 'Add the question text.';
    }
    if (form.answer.trim().length === 0) {
      nextErrors.answer = 'Add the correct answer.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const draft: QuestionDraft = {
      prompt: form.prompt,
      answer: form.answer,
      acceptedAnswers: splitList(form.acceptedAnswers),
      wrongChoices: form.wrongChoices
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      explanation: form.explanation,
      tags: splitList(form.tags),
    };

    setBusy(true);
    try {
      if (question) {
        await repositories.questions.update(question.id, draft);
        toast('Question updated.', 'success');
      } else {
        await repositories.questions.create(setId, draft);
        toast('Question added.', 'success');
      }
      onSaved();
      onClose();
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : 'Quizeasy could not save that question.',
        'error',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={question ? 'Edit question' : 'Add a question'}
      description="Only the question and the correct answer are required."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={busy}
            data-testid="question-save"
          >
            {busy ? 'Saving…' : question ? 'Save changes' : 'Add question'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <TextAreaField
          label="Question"
          value={form.prompt}
          error={errors.prompt}
          onChange={(event) => setForm({ ...form, prompt: event.target.value })}
          data-testid="question-prompt"
        />
        <TextAreaField
          label="Correct answer"
          value={form.answer}
          error={errors.answer}
          onChange={(event) => setForm({ ...form, answer: event.target.value })}
          data-testid="question-answer"
        />

        <details className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
          <summary className="cursor-pointer text-sm font-medium">
            More options (accepted answers, wrong choices, explanation, tags)
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            <TextField
              label="Also accept these answers"
              hint="Separate with commas. Used by identification and multiple choice."
              value={form.acceptedAnswers}
              onChange={(event) =>
                setForm({ ...form, acceptedAnswers: event.target.value })
              }
            />
            <TextAreaField
              label="Wrong choices"
              hint="One per line. Multiple choice uses these first."
              value={form.wrongChoices}
              onChange={(event) =>
                setForm({ ...form, wrongChoices: event.target.value })
              }
            />
            <TextAreaField
              label="Explanation (optional)"
              value={form.explanation}
              onChange={(event) =>
                setForm({ ...form, explanation: event.target.value })
              }
            />
            <TextField
              label="Tags"
              hint="Separate with commas. Used to filter study sessions."
              value={form.tags}
              onChange={(event) =>
                setForm({ ...form, tags: event.target.value })
              }
            />
          </div>
        </details>
      </div>
    </Dialog>
  );
}
