import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ClipboardPaste, Eraser, Save, TriangleAlert } from 'lucide-react';
import {
  parseQuizText,
  itemStatus,
  type ParseResult,
  type ParsedQuestion,
} from '@/parser';
import {
  validateItemFields,
  withDuplicateWarnings,
  type EditableItemFields,
} from '@/parser/validate';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { TextAreaField, TextField } from '@/components/ui/Form';
import { ImportItemCard } from './ImportItemCard';
import {
  ImportCountsRow,
  ImportSummary,
  type ImportCounts,
} from './ImportSummary';
import {
  clearImportDraft,
  readImportDraft,
  saveImportDraft,
} from './importDraft';
import { repositories } from '@/data/repositories';
import { saveImport, suggestSetTitle } from '@/services/importService';
import { toast } from '@/app/store/appStore';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { pluralize } from '@/lib/utils';

const PAGE_SIZE = 30;

interface ImportItemState {
  item: ParsedQuestion;
  included: boolean;
}

function revalidate(
  item: ParsedQuestion,
  fields: EditableItemFields,
): ParsedQuestion {
  const { fields: cleaned, issues } = validateItemFields({
    ...fields,
    line: item.lineStart,
    sawQuestionLabel: true,
    sawAnswerLabel: true,
  });
  return { ...item, ...cleaned, issues };
}

export function ImportPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetSetId = searchParams.get('set') ?? undefined;

  // An in-progress paste is restored synchronously (for example after an
  // accidental reload) so nothing the user typed is ever lost.
  const [restoredDraft] = useState(() => readImportDraft());
  const [text, setText] = useState(() => restoredDraft?.text ?? '');
  const [title, setTitle] = useState(() => restoredDraft?.title ?? '');
  const [description, setDescription] = useState(
    () => restoredDraft?.description ?? '',
  );
  const [result, setResult] = useState<ParseResult | undefined>(undefined);
  const [items, setItems] = useState<ImportItemState[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [saving, setSaving] = useState(false);
  const [targetSetTitle, setTargetSetTitle] = useState<string | undefined>(
    undefined,
  );
  const titleTouched = useRef(Boolean(restoredDraft?.title));

  useEffect(() => {
    if (!targetSetId) return;
    void repositories.sets.get(targetSetId).then((set) => {
      setTargetSetTitle(set?.title);
    });
  }, [targetSetId]);

  useUnsavedChangesGuard(text.trim().length > 0 && items.length > 0);

  // Parse as the user types, but never on every keystroke.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      const trimmed = text;
      if (trimmed.trim().length === 0) {
        setResult(undefined);
        setItems([]);
        return;
      }
      const parsed = parseQuizText(trimmed);
      setResult(parsed);
      setItems(
        withDuplicateWarnings(parsed.items).map((item) => ({
          item,
          included: true,
        })),
      );
      setVisibleCount(PAGE_SIZE);
      if (!titleTouched.current && parsed.items.length > 0) {
        setTitle(suggestSetTitle(parsed.items));
      }
    }, 250);

    return () => window.clearTimeout(handle);
  }, [text]);

  // Keep the draft in sessionStorage so nothing is lost on navigation.
  useEffect(() => {
    if (text.trim().length === 0 && !title && !description) return;
    const handle = window.setTimeout(() => {
      saveImportDraft({ text, title, description });
    }, 400);
    return () => window.clearTimeout(handle);
  }, [text, title, description]);

  const updateItems = useCallback(
    (updater: (current: ImportItemState[]) => ImportItemState[]) => {
      setItems((current) => {
        const next = updater(current);
        const flagged = withDuplicateWarnings(next.map((entry) => entry.item));
        return flagged.map((item, index) => ({
          item,
          included: next[index]?.included ?? true,
        }));
      });
    },
    [],
  );

  const handleEdit = useCallback(
    (index: number, fields: Partial<EditableItemFields>) => {
      updateItems((current) =>
        current.map((entry, entryIndex) => {
          if (entryIndex !== index) return entry;
          const merged: EditableItemFields = {
            prompt: fields.prompt ?? entry.item.prompt,
            answer: fields.answer ?? entry.item.answer,
            acceptedAnswers:
              fields.acceptedAnswers ?? entry.item.acceptedAnswers,
            wrongChoices: fields.wrongChoices ?? entry.item.wrongChoices,
            explanation: fields.explanation ?? entry.item.explanation,
            tags: fields.tags ?? entry.item.tags,
          };
          return {
            item: revalidate(entry.item, merged),
            included: entry.included,
          };
        }),
      );
    },
    [updateItems],
  );

  const counts: ImportCounts = useMemo(() => {
    let ready = 0;
    let check = 0;
    let needsFix = 0;
    let included = 0;
    for (const entry of items) {
      if (entry.included) included += 1;
      switch (itemStatus(entry.item.issues)) {
        case 'valid':
          ready += 1;
          break;
        case 'warning':
          check += 1;
          break;
        default:
          needsFix += 1;
          break;
      }
    }
    return { total: items.length, ready, check, needsFix, included };
  }, [items]);

  const includedItems = useMemo(
    () => items.filter((entry) => entry.included).map((entry) => entry.item),
    [items],
  );
  const includedWithErrors = useMemo(
    () =>
      includedItems.filter((item) => itemStatus(item.issues) === 'invalid')
        .length,
    [includedItems],
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await saveImport(repositories, {
        title,
        description,
        items: includedItems,
        ...(targetSetId ? { targetSetId } : {}),
      });
      clearImportDraft();
      setText('');
      setItems([]);
      setResult(undefined);
      toast(
        `Saved ${saved.questions.length} ${pluralize(saved.questions.length, 'question')} to "${saved.set.title}".`,
        'success',
      );
      navigate(`/sets/${saved.set.id}`);
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : 'Quizeasy could not save those questions.',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipboard = await navigator.clipboard.readText();
      if (clipboard.trim().length === 0) {
        toast('Your clipboard looks empty.', 'info');
        return;
      }
      setText((current) => (current ? `${current}\n${clipboard}` : clipboard));
    } catch {
      toast(
        'Your browser blocked clipboard access. Paste into the box with Ctrl+V or ⌘V instead.',
        'info',
      );
    }
  };

  const handleExcludeInvalid = () => {
    updateItems((current) =>
      current.map((entry) => ({
        item: entry.item,
        included:
          itemStatus(entry.item.issues) === 'invalid' ? false : entry.included,
      })),
    );
  };

  // Issue lists are recomputed from the current items so a fixed entry stops
  // being reported as a problem.
  const liveErrors = useMemo(
    () => [
      ...(result?.errors ?? [])
        .filter((issue) => issue.itemIndex === undefined)
        .map((issue) => issue.message),
      ...items.flatMap((entry) =>
        entry.item.issues
          .filter((issue) => issue.severity === 'error')
          .map((issue) => issue.message),
      ),
    ],
    [items, result],
  );

  const liveWarnings = useMemo(
    () => [
      ...(result?.warnings ?? [])
        .filter((issue) => issue.itemIndex === undefined)
        .map((issue) => issue.message),
      ...items.flatMap((entry) =>
        entry.item.issues
          .filter((issue) => issue.severity === 'warning')
          .map((issue) => issue.message),
      ),
    ],
    [items, result],
  );

  const visibleItems = items.slice(0, visibleCount);

  return (
    <div className="pb-4">
      <PageHeader
        title={
          targetSetId
            ? `Add questions to "${targetSetTitle ?? 'set'}"`
            : 'Paste questions'
        }
        subtitle="Paste your own notes or text from an AI tool. Quizeasy reads it and shows you exactly what it found before saving anything."
      />

      {targetSetId ? (
        <p className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-100">
          New questions will be added to the existing set instead of creating a
          new one.
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="flex flex-col gap-3" aria-label="Paste your text">
          <TextAreaField
            label="Questions and answers"
            hint="Supported: Q:/A: labels, Q/A/W/E/T, “Question:”/“Answer:”, numbered pairs, and “question | answer” lines."
            className="min-h-64 font-mono text-sm"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={
              'Q: What does CPU stand for?\nA: Central Processing Unit'
            }
            data-testid="import-textarea"
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={handlePasteFromClipboard}>
              <ClipboardPaste aria-hidden="true" className="size-4" />
              Paste from clipboard
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setText('');
                setResult(undefined);
                setItems([]);
                clearImportDraft();
              }}
              disabled={text.length === 0}
            >
              <Eraser aria-hidden="true" className="size-4" />
              Clear
            </Button>
            <span className="hint">
              {text.length.toLocaleString()} characters
            </span>
          </div>

          {!targetSetId ? (
            <div className="flex flex-col gap-3">
              <TextField
                label="Set title"
                value={title}
                onChange={(event) => {
                  titleTouched.current = true;
                  setTitle(event.target.value);
                }}
                placeholder="Computer basics"
                data-testid="import-title"
              />
              <TextField
                label="Description (optional)"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What is this set about?"
              />
            </div>
          ) : null}
        </section>

        <section className="flex flex-col gap-3" aria-label="Import preview">
          {!result ? (
            <EmptyState
              title="Nothing to preview yet"
              description="Paste your questions on the left. Quizeasy parses them instantly and shows each entry here so you can fix or exclude anything that looks wrong."
            />
          ) : (
            <>
              <ImportSummary
                result={result}
                counts={counts}
                errors={liveErrors}
                warnings={liveWarnings}
              />

              {result.truncated ? (
                <p className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
                  <TriangleAlert
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0"
                  />
                  Only the first {items.length} questions were read. Save this
                  set, then paste the rest into another one.
                </p>
              ) : null}

              {counts.included === counts.total && counts.needsFix > 0 ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExcludeInvalid}
                >
                  {counts.needsFix === 1
                    ? 'Exclude the entry that needs fixing'
                    : `Exclude the ${counts.needsFix} entries that need fixing`}
                </Button>
              ) : null}

              {items.length === 0 ? (
                <EmptyState
                  title="No questions found yet"
                  description="Quizeasy could not find questions in that text. Check that each entry has a “Q:” line and an “A:” line, or use the formats listed under the paste box."
                />
              ) : (
                <ul className="flex flex-col gap-3" data-testid="import-items">
                  {visibleItems.map((entry, index) => (
                    <ImportItemCard
                      key={`${entry.item.lineStart}-${index}`}
                      item={entry.item}
                      index={index}
                      included={entry.included}
                      onToggleInclude={() =>
                        updateItems((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, included: !item.included }
                              : item,
                          ),
                        )
                      }
                      onEdit={(fields) => handleEdit(index, fields)}
                    />
                  ))}
                </ul>
              )}

              {items.length > visibleCount ? (
                <Button
                  variant="secondary"
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                >
                  Show {Math.min(PAGE_SIZE, items.length - visibleCount)} more
                </Button>
              ) : null}
            </>
          )}
        </section>
      </div>

      {result && items.length > 0 ? (
        <div className="sticky bottom-16 mt-6 rounded-2xl border border-slate-200 bg-white/95 p-3 backdrop-blur lg:bottom-4 dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ImportCountsRow counts={counts} testId="import-counts-sticky" />
            <div className="flex flex-col items-end gap-1">
              <Button
                onClick={handleSave}
                disabled={
                  saving || counts.included === 0 || includedWithErrors > 0
                }
                data-testid="import-save"
              >
                <Save aria-hidden="true" className="size-4" />
                {saving
                  ? 'Saving…'
                  : targetSetId
                    ? `Add ${counts.included} to set`
                    : `Save ${counts.included} ${pluralize(counts.included, 'question')}`}
              </Button>
              {includedWithErrors > 0 ? (
                <p className="text-xs text-rose-700 dark:text-rose-300">
                  {includedWithErrors} included{' '}
                  {pluralize(includedWithErrors, 'entry', 'entries')} still need
                  fixing.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
