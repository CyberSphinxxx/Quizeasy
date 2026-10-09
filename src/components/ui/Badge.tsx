import type { ReactNode } from 'react';

export type BadgeTone =
  'neutral' | 'accent' | 'correct' | 'warning' | 'incorrect';

/*
 * Status is never carried by color alone: every tone is paired with an icon
 * and a word wherever it reports a result.
 */
const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: '',
  accent: 'chip-accent',
  correct: 'text-correct',
  warning: 'text-warning',
  incorrect: 'text-incorrect',
};

export function Badge({
  tone = 'neutral',
  icon,
  children,
  className = '',
}: {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`chip ${TONE_CLASSES[tone]} ${className}`.trim()}>
      {icon}
      {children}
    </span>
  );
}

/** A keyboard hint. Only ever rendered for keys the app actually listens for. */
export function Keycap({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <kbd className={`keycap ${className}`.trim()}>{children}</kbd>;
}
