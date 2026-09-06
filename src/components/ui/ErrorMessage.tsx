export function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: '10px 14px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-danger-tint)',
        color: 'var(--color-danger)',
        fontSize: 14,
        marginBottom: 16,
      }}
    >
      {message}
    </div>
  );
}
