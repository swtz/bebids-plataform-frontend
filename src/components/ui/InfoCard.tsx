import type { CSSProperties, ReactNode } from 'react';

interface InfoCardProps {
  /** Rótulo curto, em maiúsculas (ex.: "Meu horário atual"). */
  label: string;
  children: ReactNode;
  style?: CSSProperties;
}

/**
 * Variante do Card para informação de leitura ("isto é um resumo", não uma
 * ação) — usa o acento secundário (sage) do tema "Organic" pra se
 * diferenciar visualmente dos cards de formulário/ação, que ficam na cor
 * neutra padrão.
 */
export function InfoCard({ label, children, style }: InfoCardProps) {
  return (
    <div
      style={{
        background: 'var(--color-accent-2-100)',
        border: '1px solid color-mix(in srgb, var(--color-accent-2) 25%, transparent)',
        borderLeft: '4px solid var(--color-accent-2)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 18px',
        marginBottom: 24,
        ...style,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--color-accent-2-800)',
        }}
      >
        {label}
      </p>
      <div style={{ marginTop: 6, fontSize: 14, color: 'var(--color-text)' }}>{children}</div>
    </div>
  );
}
