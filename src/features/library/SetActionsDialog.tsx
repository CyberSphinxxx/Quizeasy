import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Download, Pencil, Play, Trash2 } from 'lucide-react';
import type { QuizSet } from '@/domain/schemas/set';
import { Dialog, ConfirmDialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { repositories } from '@/data/repositories';
import { downloadSetExport } from '@/services/setTransfer';
import { toast } from '@/app/store/appStore';

export function SetActionsDialog({
  set,
  open,
  onClose,
  onChanged,
}: {
  set: QuizSet | undefined;
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!set) return null;

  const handleExport = async () => {
    setBusy(true);
    try {
      const questions = await repositories.questions.listBySet(set.id);
      const filename = downloadSetExport(set, questions.items);
      toast(`Exported ${filename}.`, 'success');
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : 'Quizeasy could not export that set.',
        'error',
      );
    } finally {
      setBusy(false);
      onClose();
    }
  };

  const handleDuplicate = async () => {
    setBusy(true);
    try {
      const copy = await repositories.sets.duplicate(set.id);
      toast(`Copied to "${copy.title}".`, 'success');
      onChanged();
      onClose();
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : 'Quizeasy could not copy that set.',
        'error',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await repositories.sets.remove(set.id);
      toast(`"${set.title}" and its study history were deleted.`, 'success');
      setConfirmDelete(false);
      onChanged();
      onClose();
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : 'Quizeasy could not delete that set.',
        'error',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Dialog
        open={open && !confirmDelete}
        onClose={onClose}
        title={set.title}
        description="Manage this set."
        size="sm"
      >
        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              onClose();
              navigate(`/sets/${set.id}`);
            }}
          >
            <Pencil aria-hidden="true" className="size-4" />
            Open set
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onClose();
              navigate(`/sets/${set.id}/study`);
            }}
          >
            <Play aria-hidden="true" className="size-4" />
            Study
          </Button>
          <Button variant="secondary" onClick={handleExport} disabled={busy}>
            <Download aria-hidden="true" className="size-4" />
            Export as .quizeasy.json
          </Button>
          <Button variant="secondary" onClick={handleDuplicate} disabled={busy}>
            <Copy aria-hidden="true" className="size-4" />
            Duplicate set
          </Button>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 aria-hidden="true" className="size-4" />
            Delete set
          </Button>
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete "${set.title}"?`}
        message="This also deletes its questions and study history from this browser. Export a backup first if you are not sure."
        confirmLabel="Delete set"
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
