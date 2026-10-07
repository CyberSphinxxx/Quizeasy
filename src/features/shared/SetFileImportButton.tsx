import { useId, useRef, useState, type ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import { Button, type ButtonVariant } from '@/components/ui/Button';
import { repositories } from '@/data/repositories';
import { importSetFile, validateSetExport } from '@/services/setTransfer';
import { toast } from '@/app/store/appStore';
import { parseJson, readTextFile } from '@/lib/files';

export function SetFileImportButton({
  label = 'Import set file',
  variant = 'secondary',
  targetSetId,
  onImported,
}: {
  label?: string;
  variant?: ButtonVariant;
  /** Append the imported questions to this set instead of creating a new one. */
  targetSetId?: string;
  onImported?: (setId: string) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Allow choosing the same file again later.
    event.target.value = '';
    if (!file) return;

    setBusy(true);
    try {
      const text = await readTextFile(file);
      if (!text.ok) {
        toast(text.message, 'error');
        return;
      }
      const parsed = parseJson(text.text);
      if (!parsed.ok) {
        toast(parsed.message, 'error');
        return;
      }
      const validated = validateSetExport(parsed.value);
      if (!validated.ok) {
        toast(validated.message, 'error');
        return;
      }

      const report = await importSetFile(
        repositories,
        validated.file,
        targetSetId ? { targetSetId } : {},
      );
      for (const warning of report.warnings.slice(0, 2)) {
        toast(warning, 'info');
      }
      toast(
        `Imported ${report.importedQuestions} ${
          report.importedQuestions === 1 ? 'question' : 'questions'
        } into "${report.set.title}".`,
        'success',
      );
      onImported?.(report.set.id);
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : 'Quizeasy could not import that file.',
        'error',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        onChange={handleFile}
        aria-label={label}
      />
      <Button
        variant={variant}
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        <Upload aria-hidden="true" className="size-4" />
        {busy ? 'Importing…' : label}
      </Button>
    </>
  );
}
