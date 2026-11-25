import type { HTMLAttributes } from 'react';
import { Icon } from './Icon';
import type { IconName } from '../../lib/icons';
import {
  buttonClass,
  type ButtonSize,
  type ButtonVariant,
} from '../../lib/ui/button';

type ButtonType = 'button' | 'submit' | 'reset';

interface SharedProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconOnly?: boolean;
  iconStart?: IconName;
  iconEnd?: IconName;
  disabled?: boolean;
  className?: string;
}

type IconOnlyProps =
  | { iconOnly: true; 'aria-label': string }
  | { iconOnly?: false; 'aria-label'?: string };

type Props = SharedProps &
  IconOnlyProps &
  Omit<
    HTMLAttributes<HTMLElement>,
    keyof SharedProps | 'className' | 'aria-label'
  > &
  (
    | {
        href: string;
        rel?: string;
        target?: string;
        download?: boolean | string;
        type?: never;
      }
    | {
        href?: undefined;
        type?: ButtonType;
        name?: string;
        value?: string | number;
        form?: string;
      }
  );

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  iconOnly = false,
  iconStart,
  iconEnd,
  disabled = false,
  className,
  href,
  type = 'button',
  children,
  ...attributes
}: Props) {
  if (iconOnly && !attributes['aria-label']) {
    throw new Error('Button: iconOnly requires an aria-label.');
  }

  const classes = [
    buttonClass({ variant, size, fullWidth, iconOnly }),
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const icons = {
    start: iconStart && (
      <Icon name={iconStart} size={size === 'sm' ? 'sm' : 'md'} />
    ),
    end: iconEnd && <Icon name={iconEnd} size={size === 'sm' ? 'sm' : 'md'} />,
  };

  if (href !== undefined) {
    return (
      <a
        {...attributes}
        href={disabled ? undefined : href}
        aria-disabled={disabled ? 'true' : undefined}
        tabIndex={disabled ? -1 : undefined}
        className={classes}
      >
        {icons.start}
        {children}
        {icons.end}
      </a>
    );
  }

  return (
    <button {...attributes} type={type} disabled={disabled} className={classes}>
      {icons.start}
      {children}
      {icons.end}
    </button>
  );
}
