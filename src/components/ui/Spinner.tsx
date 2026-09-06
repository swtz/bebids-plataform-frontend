export function Spinner({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div style={{ padding: 24, color: 'var(--color-text-muted)', fontSize: 14 }}>
      {label}
    </div>
  );
}
