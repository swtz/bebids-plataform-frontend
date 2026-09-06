import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getStoredToken, setStoredToken, clearStoredToken } from '@/lib/authStorage';
import { useLogin } from '@/hooks/useAuthQueries';
import type { LoginPayload } from '@/schemas/auth.schema';

interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  loginError: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Nenhum `useEffect` aqui de propósito. O `apiClient` lê o token direto do
 * cookie a cada requisição (ver `apiClient.ts`), então este contexto só
 * precisa: (1) escrever/apagar o cookie e (2) guardar `token` em estado do
 * React só para re-renderizar a UI (ex.: `ProtectedRoute`, o botão de
 * logout). Não existe uma "cópia" do token que precise ficar sincronizada
 * com o cookie — cada função aqui já escreve o cookie e atualiza o estado
 * na mesma chamada, sem depender de um efeito rodar depois.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const loginMutation = useLogin();

  const login = async (payload: LoginPayload) => {
    const { accessToken } = await loginMutation.mutateAsync(payload);
    setStoredToken(accessToken);
    setToken(accessToken);
  };

  const logout = () => {
    clearStoredToken();
    setToken(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      isLoggingIn: loginMutation.isPending,
      loginError: loginMutation.error?.message ?? null,
      login,
      logout,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, loginMutation.isPending, loginMutation.error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}
