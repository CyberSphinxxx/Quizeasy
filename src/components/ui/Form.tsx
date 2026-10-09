import { useId, type ReactNode, type TextareaHTMLAttributes } from 'react';
import type { InputHTMLAttributes } from 'react';

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (props: {
    id: string;
    'aria-describedby': string | undefined;
    'aria-invalid': boolean | undefined;
  }) => ReactNode;
  htmlFor?: string;
}) {
  const generatedId = useId();
  const id = htmlFor ?? generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="label" htmlFor={id}>
        {label}
      </label>
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 text-caption text-incorrect"
        >
          {error}
        </p>
      ) : null}
      {hint ? (
        <p id={hintId} className="hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  label,
  hint,
  error,
  ...rest
}: {
  label: string;
  hint?: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(props) => <input className="input" {...props} {...rest} />}
    </Field>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  ...rest
}: {
  label: string;
  hint?: string;
  error?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(props) => (
        <textarea
          className="input input-mono min-h-32 resize-y"
          {...props}
          {...rest}
        />
      )}
    </Field>
  );
}

export function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="flex flex-col gap-0.5">
        <label className="label" htmlFor={id}>
          {label}
        </label>
        {description ? <span className="hint">{description}</span> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition disabled:opacity-50 ${
          checked
            ? 'border-accent bg-accent'
            : 'border-line bg-raised hover:border-line-strong'
        }`}
      >
        <span
          aria-hidden="true"
          className={`size-3.5 rounded-full transition-transform ${
            checked ? 'translate-x-4.5 bg-canvas' : 'translate-x-0.5 bg-surface'
          }`}
        />
      </button>
    </div>
  );
}

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

/**
 * A visible track holding content-sized segments. Segments never stretch to
 * fill the row, and they wrap on narrow screens.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="label">{label}</legend>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex w-fit max-w-full flex-wrap gap-1 rounded-control border border-line bg-raised p-[3px]"
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={`h-7.5 rounded-control px-2.5 text-body font-medium transition ${
                selected
                  ? 'border border-line-strong bg-surface text-ink'
                  : 'border border-transparent text-muted hover:text-ink'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
