import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, KeyRound, ShieldCheck, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { SegmentedControl, Toggle } from '@/components/ui/Form';
import { usePreferences } from '@/app/providers/PreferencesProvider';
import { useAsyncData } from '@/hooks/useAsyncData';
import { repositories } from '@/data/repositories';
import { collectBackupPayload, downloadBackup } from '@/services/backupService';
import { BackupRestoreButton } from './BackupRestoreButton';
import { SCHEMA_VERSION } from '@/domain/constants';
import {
  STUDY_MODE_DESCRIPTIONS,
  STUDY_MODE_LABELS,
  type StudyMode,
} from '@/domain/schemas/study';
import { toast } from '@/app/store/appStore';
import type { Theme } from '@/domain/schemas/preferences';

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const MODE_OPTIONS: { value: StudyMode; label: string }[] = (
  ['flashcard', 'multiple-choice', 'identification', 'mixed'] as StudyMode[]
).map((mode) => ({ value: mode, label: STUDY_MODE_LABELS[mode] }));

export function SettingsPage() {
  const { preferences, update } = usePreferences();
  const counts = useAsyncData(() => repositories.sets.counts(), []);
  const [confirmClear, setConfirmClear] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleExportAll = useCallback(async () => {
    try {
      const payload = await collectBackupPayload(repositories);
      const filename = downloadBackup(payload);
      toast(`Saved ${filename}.`, 'success');
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : 'Quizeasy could not export your data.',
        'error',
      );
    }
  }, []);

  const handleClearAll = useCallback(async () => {
    setBusy(true);
    try {
      await repositories.sets.clearAll();
      toast('All local sets and study history were removed.', 'success');
      setConfirmClear(false);
      counts.reload();
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : 'Quizeasy could not clear your data.',
        'error',
      );
    } finally {
      setBusy(false);
    }
  }, [counts]);

  const data = counts.data;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Settings"
        subtitle="Everything here is stored on this device only."
      />

      <section className="card flex flex-col gap-4 p-4" aria-label="Appearance">
        <h2 className="text-base">Appearance</h2>
        <SegmentedControl
          label="Theme"
          options={THEME_OPTIONS}
          value={preferences.theme}
          onChange={(theme) => void update({ theme })}
        />
        <Toggle
          label="Reduce motion"
          description="Turns off card flips and transitions."
          checked={preferences.reducedMotion}
          onChange={(reducedMotion) => void update({ reducedMotion })}
        />
      </section>

      <section
        className="card flex flex-col gap-4 p-4"
        aria-label="Study defaults"
      >
        <h2 className="text-base">Study defaults</h2>
        <SegmentedControl
          label="Default study mode"
          options={MODE_OPTIONS}
          value={preferences.defaultMode}
          onChange={(mode) => void update({ defaultMode: mode })}
        />
        <p className="hint">
          {STUDY_MODE_DESCRIPTIONS[preferences.defaultMode]}
        </p>
        <SegmentedControl
          label="Default feedback"
          options={[
            { value: 'immediate', label: 'Study mode' },
            { value: 'delayed', label: 'Test mode' },
          ]}
          value={preferences.defaultFeedback}
          onChange={(feedback) => void update({ defaultFeedback: feedback })}
        />
        <Toggle
          label="Shuffle questions by default"
          checked={preferences.defaultShuffleQuestions}
          onChange={(value) => void update({ defaultShuffleQuestions: value })}
        />
        <Toggle
          label="Shuffle answer choices by default"
          checked={preferences.defaultShuffleChoices}
          onChange={(value) => void update({ defaultShuffleChoices: value })}
        />
      </section>

      <section className="card flex flex-col gap-4 p-4" aria-label="Your data">
        <h2 className="text-base">Your data</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="hint">Sets</dt>
            <dd className="font-semibold">{data?.sets ?? '—'}</dd>
          </div>
          <div>
            <dt className="hint">Questions</dt>
            <dd className="font-semibold">{data?.questions ?? '—'}</dd>
          </div>
          <div>
            <dt className="hint">Sessions</dt>
            <dd className="font-semibold">{data?.sessions ?? '—'}</dd>
          </div>
          <div>
            <dt className="hint">Answers recorded</dt>
            <dd className="font-semibold">{data?.attempts ?? '—'}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void handleExportAll()}>
            <Download aria-hidden="true" className="size-4" />
            Export all data
          </Button>
          <BackupRestoreButton onRestored={counts.reload} />
          <Button variant="danger" onClick={() => setConfirmClear(true)}>
            <Trash2 aria-hidden="true" className="size-4" />
            Clear all local data
          </Button>
        </div>

        <p className="hint">
          Restoring a backup merges it into your library. Records with matching
          IDs are given new IDs instead of overwriting anything you already
          have.
        </p>
      </section>

      <section
        className="card flex flex-col gap-3 p-4"
        aria-label="AI providers"
      >
        <h2 className="flex items-center gap-2 text-base">
          <KeyRound aria-hidden="true" className="size-4" />
          AI providers (not enabled yet)
        </h2>
        <p className="text-sm text-slate-700 dark:text-slate-200">
          Quizeasy works fully offline and never sends your notes anywhere. A
          future release will let you connect your own key for providers such as
          OpenAI, Gemini, Anthropic, OpenRouter, or a compatible custom
          endpoint.
        </p>
        <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-300">
          <li>Keys would be stored per device and can be session-only.</li>
          <li>
            Browser storage cannot be treated as a secure secret store, so
            Quizeasy will say so plainly before you add a key.
          </li>
          <li>
            Until then, use the AI guide to copy prompts into your own tool.
          </li>
        </ul>
        <div>
          <Link to="/guide" className="btn btn-secondary">
            Open the AI guide
          </Link>
        </div>
      </section>

      <section className="card flex flex-col gap-2 p-4" aria-label="About">
        <h2 className="flex items-center gap-2 text-base">
          <ShieldCheck aria-hidden="true" className="size-4" />
          Privacy
        </h2>
        <p className="text-sm text-slate-700 dark:text-slate-200">
          Your sets, questions, and study history live in this browser&apos;s
          IndexedDB storage. There is no account, no server, and no telemetry.
          Export a backup before clearing browser data.
        </p>
        <p className="hint">
          App version 1.0.0 · data schema v{SCHEMA_VERSION} · local-first and
          MIT licensed.
        </p>
      </section>

      <ConfirmDialog
        open={confirmClear}
        title="Clear all local data?"
        message="This deletes every set, question, session, and recorded answer from this browser. It cannot be undone, so export a backup first."
        confirmLabel="Delete everything"
        confirmationPhrase="DELETE"
        busy={busy}
        onConfirm={() => void handleClearAll()}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
