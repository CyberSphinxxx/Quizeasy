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
          className="text-xs font-medium text-rose-700 dark:text-rose-300"
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
        <textarea className="input min-h-24 resize-y" {...props} {...rest} />
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
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="flex flex-col">
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
        className={`mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50 ${
          checked
            ? 'bg-indigo-600 dark:bg-indigo-500'
            : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <span
          aria-hidden="true"
          className={`size-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
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
        className="flex flex-wrap gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-900"
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
              className={`min-h-9 flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                selected
                  ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-indigo-200'
                  : 'text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-800/60'
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
