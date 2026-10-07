import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog, Dialog } from './Dialog';
import { useState } from 'react';
import { Button } from './Button';

function DialogHarness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Rename set"
        description="Choose a new name."
        footer={<Button onClick={() => setOpen(false)}>Save name</Button>}
      >
        <label htmlFor="name">Name</label>
        <input id="name" className="input" />
      </Dialog>
    </div>
  );
}

describe('Dialog', () => {
  it('is hidden until opened and traps focus when open', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const opener = screen.getByRole('button', { name: 'Open dialog' });
    await user.click(opener);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    // Focus moves into the dialog (the close button comes first in the DOM).
    expect(dialog.contains(document.activeElement)).toBe(true);

    await user.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('closes on Escape and returns focus to the opener', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    const opener = screen.getByRole('button', { name: 'Open dialog' });
    await user.click(opener);
    await screen.findByRole('dialog');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(opener);
  });
});

describe('ConfirmDialog', () => {
  it('requires the confirmation phrase before enabling the action', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Clear all local data?"
        message="This cannot be undone."
        confirmLabel="Delete everything"
        confirmationPhrase="DELETE"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    );

    const confirm = screen.getByRole('button', { name: 'Delete everything' });
    expect(confirm).toBeDisabled();

    await user.type(
      screen.getByLabelText(/Type DELETE to continue/i),
      'delete',
    );
    expect(confirm).toBeDisabled();

    await user.clear(screen.getByLabelText(/Type DELETE to continue/i));
    await user.type(
      screen.getByLabelText(/Type DELETE to continue/i),
      'DELETE',
    );
    expect(confirm).toBeEnabled();

    await user.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('can be cancelled without confirming', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Delete question?"
        message="You can undo this right after deleting."
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
