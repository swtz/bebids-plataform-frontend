import type { CSSProperties, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  /** @default 'sm' — sombra do card (ver .elev-sm/md/lg no design system). */
  elevation?: 'sm' | 'md' | 'lg';
  /** @default true — false remove o padding interno (ex.: card que só envolve uma tabela). */
  padded?: boolean;
}

export function Card({ children, style, className, elevation = 'sm', padded = true }: CardProps) {
  const classes = [
    'card',
    `elev-${elevation}`,
    !padded && 'card--no-padding',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} style={style}>
      {children}
    </div>
  );
}
