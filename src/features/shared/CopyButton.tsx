import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button, type ButtonVariant } from '@/components/ui/Button';
import { toast } from '@/app/store/appStore';

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the textarea fallback below.
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', 'true');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

export function CopyButton({
  text,
  label = 'Copy prompt',
  variant = 'primary',
}: {
  text: string;
  label?: string;
  variant?: ButtonVariant;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant={variant}
      onClick={() => {
        void copyText(text).then((ok) => {
          if (ok) {
            setCopied(true);
            toast('Prompt copied. Paste it into your AI tool.', 'success');
            window.setTimeout(() => setCopied(false), 1500);
          } else {
            toast(
              'Your browser blocked copying. Select the text and copy it manually.',
              'info',
            );
          }
        });
      }}
    >
      {copied ? (
        <Check aria-hidden="true" className="size-4" />
      ) : (
        <Copy aria-hidden="true" className="size-4" />
      )}
      {copied ? 'Copied' : label}
    </Button>
  );
}
