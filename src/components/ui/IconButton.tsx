interface IconButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  title: string;
}

export function DeleteIconButton({ onClick, isLoading, title = 'Excluir' }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      title={title}
      aria-label={title}
      className="btn btn-icon btn-danger"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16ZM10 11v6M14 11v6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function EditIconButton({ onClick, isLoading, title = 'Editar' }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      title={title}
      aria-label={title}
      className="btn btn-icon btn-secondary"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
