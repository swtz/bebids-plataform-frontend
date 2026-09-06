import type { CSSProperties, ReactNode } from 'react';

type Variant = 'accent' | 'accent-2' | 'neutral' | 'outline';

interface BadgeProps {
  children: ReactNode;
  style?: CSSProperties;
  /** @default 'accent-2' — usado pelo handoff para "ativo"/"pago"/"padrão". */
  variant?: Variant;
}

const variantClass: Record<Variant, string> = {
  accent: 'tag-accent',
  'accent-2': 'tag-accent-2',
  neutral: 'tag-neutral',
  outline: 'tag-outline',
};

export function Badge({ children, style, variant = 'accent-2' }: BadgeProps) {
  return (
    <span className={`tag ${variantClass[variant]}`} style={style}>
      {children}
    </span>
  );
}
