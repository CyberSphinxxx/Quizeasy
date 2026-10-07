import { create } from 'zustand';

export type ToastTone = 'info' | 'success' | 'error';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
  action?: ToastAction;
  /** Milliseconds before auto-dismiss; 0 keeps it until dismissed. */
  duration: number;
}

export interface AddToastInput {
  message: string;
  tone?: ToastTone;
  action?: ToastAction;
  duration?: number;
}

interface AppState {
  toasts: Toast[];
  updateAvailable: boolean;
  applyUpdate?: () => void;
  addToast: (input: AddToastInput) => string;
  dismissToast: (id: string) => void;
  setUpdateAvailable: (available: boolean) => void;
  setApplyUpdate: (apply: () => void) => void;
}

let toastCounter = 0;

/** UI-only state: never persisted domain data. */
export const useAppStore = create<AppState>()((set) => ({
  toasts: [],
  updateAvailable: false,

  addToast: (input) => {
    toastCounter += 1;
    const id = `toast-${toastCounter}`;
    const toast: Toast = {
      id,
      tone: input.tone ?? 'info',
      message: input.message,
      duration: input.duration ?? (input.action ? 8000 : 4500),
      ...(input.action ? { action: input.action } : {}),
    };
    set((state) => ({ toasts: [...state.toasts, toast] }));
    return id;
  },

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),

  setUpdateAvailable: (available) => set({ updateAvailable: available }),

  setApplyUpdate: (apply) => set({ applyUpdate: apply }),
}));

/** Convenience helpers so components do not need to import the store type. */
export function toast(message: string, tone: ToastTone = 'info'): void {
  useAppStore.getState().addToast({ message, tone });
}

export function toastWithUndo(message: string, onUndo: () => void): void {
  useAppStore.getState().addToast({
    message,
    tone: 'info',
    action: { label: 'Undo', onClick: onUndo },
    duration: 8000,
  });
}
