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

/** A bordered group: mono eyebrow on top, hairline-separated rows inside. */
function SettingsGroup({
  eyebrow,
  label,
  children,
}: {
  eyebrow: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5" aria-label={label}>
      {/* A real heading so the group is still navigable by screen readers. */}
      <h2 className="eyebrow mb-3">{eyebrow}</h2>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

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
  const storedTotal =
    (data?.sets ?? 0) +
    (data?.questions ?? 0) +
    (data?.sessions ?? 0) +
    (data?.attempts ?? 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Preferences" title="Settings" />

      <SettingsGroup eyebrow="APPEARANCE" label="Appearance">
        <div className="row items-start">
          <SegmentedControl
            label="Theme"
            options={THEME_OPTIONS}
            value={preferences.theme}
            onChange={(theme) => void update({ theme })}
          />
        </div>
        <Toggle
          label="Reduce motion"
          description="Turns off transitions and reveals."
          checked={preferences.reducedMotion}
          onChange={(reducedMotion) => void update({ reducedMotion })}
        />
      </SettingsGroup>

      <SettingsGroup eyebrow="STUDY DEFAULTS" label="Study defaults">
        <div className="row items-start">
          <div className="flex flex-col gap-1.5">
            <SegmentedControl
              label="Default study mode"
              options={MODE_OPTIONS}
              value={preferences.defaultMode}
              onChange={(mode) => void update({ defaultMode: mode })}
            />
            <p className="hint">
              {STUDY_MODE_DESCRIPTIONS[preferences.defaultMode]}
            </p>
          </div>
        </div>
        <div className="row items-start">
          <SegmentedControl
            label="Default feedback"
            options={[
              { value: 'immediate', label: 'Study mode' },
              { value: 'delayed', label: 'Test mode' },
            ]}
            value={preferences.defaultFeedback}
            onChange={(feedback) => void update({ defaultFeedback: feedback })}
          />
        </div>
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
      </SettingsGroup>

      <SettingsGroup eyebrow="YOUR DATA" label="Your data">
        {counts.loading ? (
          <p className="hint py-3">Counting what is stored…</p>
        ) : storedTotal === 0 ? (
          <p className="hint py-3">Nothing stored yet.</p>
        ) : (
          <dl className="border-line mt-1 grid grid-cols-2 gap-x-4 gap-y-4 border-t pt-4 sm:grid-cols-4">
            <div className="flex flex-col gap-1">
              <dd className="stat-number">{data?.sets ?? 0}</dd>
              <dt className="stat-label">Sets</dt>
            </div>
            <div className="flex flex-col gap-1">
              <dd className="stat-number">{data?.questions ?? 0}</dd>
              <dt className="stat-label">Questions</dt>
            </div>
            <div className="flex flex-col gap-1">
              <dd className="stat-number">{data?.sessions ?? 0}</dd>
              <dt className="stat-label">Sessions</dt>
            </div>
            <div className="flex flex-col gap-1">
              <dd className="stat-number">{data?.attempts ?? 0}</dd>
              <dt className="stat-label">Answers</dt>
            </div>
          </dl>
        )}

        <div className="border-line mt-3 flex flex-wrap items-start gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => void handleExportAll()}>
            <Download aria-hidden="true" className="size-4" />
            Export all data
          </Button>
          <BackupRestoreButton onRestored={counts.reload} />
          <Button variant="danger" onClick={() => setConfirmClear(true)}>
            <Trash2 aria-hidden="true" className="size-4" />
            Clear all local data
          </Button>
        </div>

        <p className="hint pt-3">
          Restoring a backup merges it into your library. Records with matching
          IDs are given new IDs instead of overwriting anything you already
          have.
        </p>
      </SettingsGroup>

      <SettingsGroup eyebrow="AI PROVIDERS" label="AI providers">
        <h2 className="text-card flex items-center gap-2 font-medium">
          <KeyRound aria-hidden="true" className="text-muted size-4" />
          Not enabled yet
        </h2>
        <p className="text-body text-muted mt-2 max-w-prose">
          Quizeasy works fully offline and never sends your notes anywhere. A
          future release will let you connect your own key for providers such as
          OpenAI, Gemini, Anthropic, OpenRouter, or a compatible custom
          endpoint.
        </p>
        <ul className="text-body text-muted mt-3 flex list-disc flex-col gap-1 pl-5">
          <li>Keys would be stored per device and can be session-only.</li>
          <li>
            Browser storage cannot be treated as a secure secret store, so
            Quizeasy will say so plainly before you add a key.
          </li>
          <li>
            Until then, use the AI guide to copy prompts into your own tool.
          </li>
        </ul>
        <div className="pt-4">
          <Link to="/guide" className="btn btn-outline">
            Open the AI guide
          </Link>
        </div>
      </SettingsGroup>

      <SettingsGroup eyebrow="ABOUT" label="About">
        <h2 className="text-card flex items-center gap-2 font-medium">
          <ShieldCheck aria-hidden="true" className="text-muted size-4" />
          Privacy
        </h2>
        <p className="text-body text-muted mt-2 max-w-prose">
          Export a backup before clearing browser data. Restoring one merges it
          back and never overwrites what is already here.
        </p>
        <p className="hint pt-3">
          App version 1.0.0 · data schema v{SCHEMA_VERSION} · local-first and
          MIT licensed.
        </p>
      </SettingsGroup>

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
