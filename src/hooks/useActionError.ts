import { useCallback, useState } from 'react';

/**
 * Ações rápidas (excluir, alternar um campo) não têm um `<DynamicForm>` por
 * perto pra mostrar `serverError` — sem isso, uma falha só aparecia como
 * rejeição de promise não tratada no console do navegador, nunca na tela.
 * `run()` captura qualquer erro da ação e guarda a mensagem em `error`.
 */
export function useActionError() {
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.');
    }
  }, []);

  return { error, run, clearError: () => setError(null) };
}
