import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant =
  'primary' | 'outline' | 'ghost' | 'danger' | 'danger-solid';

// `.btn` provides the shared base; the variant class only adds colors.
// Exactly one `primary` button belongs on a screen; everything else is
// `outline` or `ghost`.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  'danger-solid': 'btn-danger-solid',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`btn ${VARIANT_CLASSES[variant]} ${size === 'sm' ? 'btn-sm' : ''} ${className}`.trim()}
      {...rest}
    />
  );
}
