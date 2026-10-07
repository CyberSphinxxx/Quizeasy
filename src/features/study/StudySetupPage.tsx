import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Play, TriangleAlert } from 'lucide-react';
import { useSetBundle } from '@/hooks/useSetBundle';
import { usePreferences } from '@/app/providers/PreferencesProvider';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, ErrorState, LoadingPanel } from '@/components/ui/Feedback';
import { SegmentedControl, Toggle } from '@/components/ui/Form';
import { countEligible } from '@/domain/study/eligibility';
import { generateSessionPlan } from '@/domain/study/plan';
import { useStudySession } from './studySessionStore';
import {
  STUDY_MODE_DESCRIPTIONS,
  STUDY_MODE_LABELS,
  type FeedbackMode,
  type QuestionLimit,
  type StudyMode,
  type StudyOptions,
} from '@/domain/schemas/study';
import { createSessionSeed } from '@/lib/rng';
import { EMPTY_QUESTIONS } from '@/lib/empties';
import { toast } from '@/app/store/appStore';
import { pluralize } from '@/lib/utils';

const MODE_ORDER: StudyMode[] = [
  'flashcard',
  'multiple-choice',
  'identification',
  'mixed',
];

const LIMIT_OPTIONS: { value: string; label: string }[] = [
  { value: '10', label: '10' },
  { value: '20', label: '20' },
  { value: '50', label: '50' },
  { value: 'all', label: 'All' },
];

export function StudySetupPage() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const bundle = useSetBundle(setId);
  const { preferences } = usePreferences();
  const startSession = useStudySession((state) => state.start);

  const [mode, setMode] = useState<StudyMode | undefined>(undefined);
  const [limit, setLimit] = useState<string>('all');
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean | undefined>(
    undefined,
  );
  const [shuffleChoices, setShuffleChoices] = useState<boolean | undefined>(
    undefined,
  );
  const [feedback, setFeedback] = useState<FeedbackMode | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [starting, setStarting] = useState(false);

  const questions = bundle.data?.questions ?? EMPTY_QUESTIONS;

  const eligibility = useMemo(
    () => countEligible(questions, questions),
    [questions],
  );

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    for (const question of questions) {
      for (const tag of question.tags) set.add(tag);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [questions]);

  const resolvedMode: StudyMode = mode ?? preferences.defaultMode;
  const resolvedShuffleQuestions =
    shuffleQuestions ?? preferences.defaultShuffleQuestions;
  const resolvedShuffleChoices =
    shuffleChoices ?? preferences.defaultShuffleChoices;
  const resolvedFeedback = feedback ?? preferences.defaultFeedback;

  const modeCounts: Record<StudyMode, number> = {
    flashcard: eligibility.flashcard,
    'multiple-choice': eligibility['multiple-choice'],
    identification: eligibility.identification,
    mixed: eligibility.flashcard,
  };

  const eligibleCount = modeCounts[resolvedMode];

  const handleStart = async () => {
    if (!setId) return;
    setStarting(true);
    try {
      const seed = createSessionSeed();
      const options: StudyOptions = {
        mode: resolvedMode,
        questionLimit: (limit === 'all'
          ? 'all'
          : Number(limit)) as QuestionLimit,
        shuffleQuestions: resolvedShuffleQuestions,
        shuffleChoices: resolvedShuffleChoices,
        feedback: resolvedFeedback,
        ...(tags.length > 0 ? { tags } : {}),
        seed,
      };

      const plan = generateSessionPlan({
        questions,
        pool: questions,
        options,
        seed,
      });

      if (plan.items.length === 0) {
        toast(
          plan.excluded[0]?.reason ??
            'No questions in this set can be studied that way yet.',
          'error',
        );
        return;
      }

      await startSession({
        setId,
        options,
        plan: plan.items,
        excluded: plan.excluded,
      });
      navigate(`/sets/${setId}/study/session`);
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : 'Quizeasy could not start that session.',
        'error',
      );
    } finally {
      setStarting(false);
    }
  };

  if (bundle.loading) return <LoadingPanel label="Loading set…" />;
  if (bundle.error)
    return <ErrorState message={bundle.error} onRetry={bundle.reload} />;
  if (!bundle.data) {
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

  if (questions.length === 0) {
    return (
      <EmptyState
        title="Nothing to study yet"
        description="Add questions to this set first, then choose how you want to study them."
        actions={
          <Link
            to={`/import?set=${bundle.data.set.id}`}
            className="btn btn-primary"
          >
            Add questions
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Study"
        subtitle={`${bundle.data.set.title} · ${questions.length} ${pluralize(
          questions.length,
          'question',
        )}`}
        backTo={`/sets/${bundle.data.set.id}`}
        backLabel="Back to set"
      />

      <section aria-label="Choose a study mode" className="mb-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          How do you want to study?
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {MODE_ORDER.map((candidate) => {
            const count = modeCounts[candidate];
            const disabled = count === 0;
            const selected = candidate === resolvedMode;
            return (
              <button
                key={candidate}
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                onClick={() => setMode(candidate)}
                data-testid={`mode-${candidate}`}
                className={`card flex flex-col items-start gap-1 p-4 text-left transition disabled:opacity-50 ${
                  selected
                    ? 'border-indigo-500 ring-2 ring-indigo-200 dark:border-indigo-400 dark:ring-indigo-900'
                    : 'hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="font-semibold">
                    {STUDY_MODE_LABELS[candidate]}
                  </span>
                  <Badge
                    tone={
                      count === 0 ? 'danger' : selected ? 'info' : 'neutral'
                    }
                  >
                    {count} available
                  </Badge>
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {STUDY_MODE_DESCRIPTIONS[candidate]}
                </span>
                {candidate === 'multiple-choice' &&
                eligibility['multiple-choice'] === 0 ? (
                  <span className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                    Add “W:” wrong choices to a question, or import more
                    questions, to unlock multiple choice.
                  </span>
                ) : null}
                {candidate === 'identification' &&
                eligibility.identification === 0 ? (
                  <span className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                    Identification needs short answers (under 80 characters).
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section
        className="card mb-6 flex flex-col gap-4 p-4"
        aria-label="Session options"
      >
        <SegmentedControl
          label="How many questions?"
          value={limit}
          onChange={setLimit}
          options={LIMIT_OPTIONS.map((option) => ({
            value: option.value,
            label:
              option.value === 'all' ? `All (${eligibleCount})` : option.label,
          }))}
        />

        <SegmentedControl
          label="Feedback"
          value={resolvedFeedback}
          onChange={(value) => setFeedback(value)}
          options={[
            { value: 'immediate', label: 'Study mode — instant feedback' },
            { value: 'delayed', label: 'Test mode — feedback at the end' },
          ]}
        />

        <div className="flex flex-col">
          <Toggle
            label="Shuffle questions"
            description="Mix the order so you do not memorize positions."
            checked={resolvedShuffleQuestions}
            onChange={setShuffleQuestions}
          />
          <Toggle
            label="Shuffle answer choices"
            description="Applies to multiple choice question order."
            checked={resolvedShuffleChoices}
            onChange={setShuffleChoices}
          />
        </div>

        {availableTags.length > 0 ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="label">Only study these tags (optional)</legend>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const selected = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      setTags((current) =>
                        selected
                          ? current.filter((value) => value !== tag)
                          : [...current, tag],
                      )
                    }
                    className={`min-h-9 rounded-full border px-3 text-sm font-medium transition ${
                      selected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-800 dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-200'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <p className="hint">
              {tags.length === 0
                ? 'All tags included.'
                : `${tags.length} tag${tags.length === 1 ? '' : 's'} selected.`}
            </p>
          </fieldset>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => void handleStart()}
          disabled={starting || eligibleCount === 0}
          data-testid="start-session"
        >
          <Play aria-hidden="true" className="size-4" />
          {starting ? 'Starting…' : 'Start session'}
        </Button>
        <p className="hint">
          {eligibleCount} {pluralize(eligibleCount, 'question')} ready for{' '}
          {STUDY_MODE_LABELS[resolvedMode].toLowerCase()}.
        </p>
      </div>

      {questions.length > eligibility.flashcard ? (
        <p className="mt-3 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
          <TriangleAlert
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
          />
          {questions.length - eligibility.flashcard} questions are missing a
          question or answer and cannot be studied.
        </p>
      ) : null}
    </div>
  );
}
