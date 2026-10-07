import { useCallback, useState } from 'react';
import { repositories, NotFoundError } from '@/data/repositories';
import type { SetWithStats } from '@/data/repositories';
import { useAsyncData } from './useAsyncData';
import { toast } from '@/app/store/appStore';
import type { QuizSet } from '@/domain/schemas/set';

export interface LibraryData {
  items: SetWithStats[];
  skipped: number;
}

export function useLibrary() {
  const state = useAsyncData<LibraryData>(async () => {
    const result = await repositories.sets.listWithStats();
    return { items: result.items, skipped: result.skipped };
  }, []);

  return state;
}

export function useSetActions() {
  const [busy, setBusy] = useState(false);

  const removeSet = useCallback(async (set: QuizSet) => {
    setBusy(true);
    try {
      await repositories.sets.remove(set.id);
      toast(`"${set.title}" and its study history were deleted.`, 'success');
      return true;
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : 'Quizeasy could not delete that set.',
        'error',
      );
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const duplicateSet = useCallback(async (set: QuizSet) => {
    setBusy(true);
    try {
      const copy = await repositories.sets.duplicate(set.id);
      toast(`Copied to "${copy.title}".`, 'success');
      return copy;
    } catch (error) {
      if (error instanceof NotFoundError) {
        toast(error.message, 'error');
      } else {
        toast(
          error instanceof Error
            ? error.message
            : 'Quizeasy could not copy that set.',
          'error',
        );
      }
      return undefined;
    } finally {
      setBusy(false);
    }
  }, []);

  const renameSet = useCallback(async (setId: string, title: string) => {
    try {
      await repositories.sets.update(setId, { title });
      toast('Set updated.', 'success');
      return true;
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : 'Quizeasy could not save that.',
        'error',
      );
      return false;
    }
  }, []);

  return { busy, removeSet, duplicateSet, renameSet };
}
