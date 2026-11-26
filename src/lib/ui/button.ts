export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonClassOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconOnly?: boolean;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-body-sm gap-1.5',
  md: 'min-h-11 px-4 text-body gap-2',
  lg: 'min-h-13 px-5 text-body gap-2',
};

const iconOnlySizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-13 w-13',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-brand-fg hover:bg-brand-hover active:bg-brand-hover active:shadow-none',
  secondary:
    'border border-border-subtle bg-surface-raised text-fg shadow-sm hover:bg-surface-sunken active:bg-surface-sunken active:shadow-none',
  ghost:
    'text-fg-muted hover:bg-surface-sunken hover:text-fg active:bg-border-subtle',
  danger: 'bg-danger text-white hover:bg-danger/90',
};

export function buttonClass({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  iconOnly = false,
}: ButtonClassOptions = {}): string {
  return [
    `inline-flex items-center justify-center ${iconOnly ? 'rounded-full' : 'rounded-md'} font-semibold transition-colors`,
    'disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:opacity-50',
    variantClasses[variant],
    iconOnly ? `${iconOnlySizeClasses[size]} p-0` : sizeClasses[size],
    fullWidth && 'w-full',
  ]
    .filter(Boolean)
    .join(' ');
}
