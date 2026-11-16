import { createElement } from 'react';
import { icons, type IconName, type IconNode } from '../../lib/icons';

interface Props {
  name: IconName;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function Icon({ name, size = 'md', label, className }: Props) {
  const sizeMap = { sm: 16, md: 20, lg: 24 } as const;
  const px = sizeMap[size];
  const strokeWidth = size === 'lg' ? 1.75 : 2;
  const iconData: IconNode = icons[name];

  const a11y = label
    ? { role: 'img' as const, 'aria-label': label }
    : { 'aria-hidden': true as const, focusable: 'false' };

  return createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: strokeWidth,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      width: px,
      height: px,
      className: ['shrink-0', className].filter(Boolean).join(' '),
      ...a11y,
    },
    ...iconData.map(
      ([tag, attrs]: [string, Record<string, string | number>], i: number) =>
        createElement(tag, { key: i, ...attrs }),
    ),
  );
}
