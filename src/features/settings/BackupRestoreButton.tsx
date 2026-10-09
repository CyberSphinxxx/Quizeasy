import { useId, useRef, useState, type ChangeEvent } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { repositories } from '@/data/repositories';
import {
  restoreBackupPayload,
  validateBackupFile,
} from '@/services/backupService';
import { parseJson, readTextFile } from '@/lib/files';
import { toast } from '@/app/store/appStore';

export function BackupRestoreButton({
  onRestored,
}: {
  onRestored: () => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
      const validated = validateBackupFile(parsed.value);
      if (!validated.ok) {
        // Existing local data is untouched on an invalid file.
        toast(validated.message, 'error');
        return;
      }

      const summary = await restoreBackupPayload(repositories, validated.file);
      for (const warning of summary.warnings.slice(0, 2)) {
        toast(warning, 'info');
      }
      toast(
        `Restored ${summary.sets} ${summary.sets === 1 ? 'set' : 'sets'} and ${summary.questions} ${
          summary.questions === 1 ? 'question' : 'questions'
        }${summary.remappedIds > 0 ? ` (${summary.remappedIds} IDs were remapped to avoid overwriting)` : ''}.`,
        'success',
      );
      onRestored();
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : 'Quizeasy could not restore that backup.',
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
        aria-label="Restore from backup file"
      />
      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        <RefreshCw aria-hidden="true" className="size-4" />
        {busy ? 'Restoring…' : 'Restore backup'}
      </Button>
    </>
  );
}
