import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface ConfirmState {
  message: string;
  onConfirm: () => void | Promise<void>;
}

/**
 * `ask(message, onConfirm)` abre o `ConfirmDialog` compartilhado; renderize
 * `{dialog}` uma vez na página. Substitui `window.confirm()` (que não tem
 * estilo nenhum e trava a UI) nos fluxos de exclusão.
 */
export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const ask = (message: string, onConfirm: () => void | Promise<void>) => {
    setState({ message, onConfirm });
  };

  const handleConfirm = async () => {
    if (!state) return;
    setIsLoading(true);
    try {
      await state.onConfirm();
    } finally {
      setIsLoading(false);
      setState(null);
    }
  };

  const dialog = (
    <ConfirmDialog
      open={state !== null}
      message={state?.message ?? ''}
      isLoading={isLoading}
      onConfirm={handleConfirm}
      onCancel={() => setState(null)}
    />
  );

  return { ask, dialog };
}
