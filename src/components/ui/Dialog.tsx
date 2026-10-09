import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button, type ButtonVariant } from './Button';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (element) =>
      element.offsetParent !== null || element === document.activeElement,
  );
}

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

/** Accessible modal with focus trapping, Escape handling, and scroll lock. */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  // Keep the latest close handler without re-running the focus effect (which
  // would steal focus from the user's field on every keystroke).
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return undefined;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = focusableElements(panel)[0] ?? panel;
    first?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusableElements(panelRef.current);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (!firstItem || !lastItem) return;
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const widthClass =
    size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-3xl' : 'max-w-xl';

  return createPortal(
    <div
      className="bg-scrim fixed inset-0 z-40 flex items-end justify-center overflow-y-auto p-3 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        {...(description ? { 'aria-describedby': descriptionId } : {})}
        tabIndex={-1}
        className={`rounded-card border-line bg-surface w-full ${widthClass} border p-5`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-question">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="text-body text-muted mt-1">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            className="rounded-control text-muted hover:bg-raised hover:text-ink p-1.5 transition"
            onClick={onClose}
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>

        {children ? <div className="mt-4">{children}</div> : null}
        {footer ? (
          <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ButtonVariant;
  /** When set, the user must type this phrase to enable the confirm button. */
  confirmationPhrase?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger-solid',
  confirmationPhrase,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('');

  // Closing always clears the typed phrase so reopening starts fresh.
  const handleClose = () => {
    setTyped('');
    onCancel();
  };

  const ready = !confirmationPhrase || typed.trim() === confirmationPhrase;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={title}
      description={message}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={tone} onClick={onConfirm} disabled={!ready || busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {confirmationPhrase ? (
        <div className="flex flex-col gap-1.5">
          <label className="label" htmlFor="confirm-phrase">
            Type {confirmationPhrase} to continue
          </label>
          <input
            id="confirm-phrase"
            className="input"
            value={typed}
            autoComplete="off"
            onChange={(event) => setTyped(event.target.value)}
          />
        </div>
      ) : null}
    </Dialog>
  );
}
