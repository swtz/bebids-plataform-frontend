import { QueryClient } from '@tanstack/react-query';

/**
 * O React Query é a camada de cache "para React" usada neste projeto: cada
 * resposta da API fica guardada em memória por resource (chave = nome da
 * rota), evitando refetch desnecessário e dando estados de loading/error
 * prontos para qualquer tela que use o mesmo hook.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30s: dado considerado "fresco" sem refetch automático
      gcTime: 5 * 60_000, // 5min: tempo que o cache fica vivo sem observadores
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
