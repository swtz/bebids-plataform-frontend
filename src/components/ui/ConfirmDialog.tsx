import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Substitui `window.confirm()` nos fluxos que passam a rodar no shell
 * mobile (o navegador nem sempre estiliza `confirm()` de forma decente em
 * apps instalados/PWA). Reutilizável para excluir entrega, cliente, caixa
 * etc. — um componente só, chamado com mensagem + callback, não copiado
 * por tela.
 */
export function ConfirmDialog({
  open,
  title = 'Confirmar exclusão',
  message,
  confirmLabel = 'Excluir',
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      <div className="dialog" style={{ maxWidth: 340 }} onClick={e => e.stopPropagation()}>
        <div className="dialog-title">{title}</div>
        <div className="dialog-body">
          <p style={{ margin: 0 }}>{message}</p>
        </div>
        <div className="dialog-actions">
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
