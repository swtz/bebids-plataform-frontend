/**
 * Cliente HTTP central da aplicação.
 *
 * Todas as chamadas à API do backend (NestJS) passam por aqui. O domínio/host
 * da API é controlado por uma única variável de ambiente (VITE_API_BASE_URL),
 * então trocar de ambiente (dev/homolog/produção) não exige tocar em nenhum
 * arquivo de feature.
 *
 * O sistema inteiro é bloqueado por login (só `/auth/login` é pública), então
 * o Bearer token é lido do cookie de sessão (`authStorage`) NA HORA de cada
 * requisição — de propósito, sem guardar uma cópia à parte em memória. Ter
 * uma cópia separada (uma variável de módulo, por exemplo) é exatamente o
 * tipo de coisa que dessincroniza: o React atualiza seu estado num horário,
 * a cópia em memória é atualizada por um efeito que roda depois, e uma
 * requisição pode sair no meio do caminho sem o header. Lendo sempre do
 * cookie, existe uma única fonte de verdade e nenhuma corrida possível.
 */
import { clearStoredToken, getStoredToken } from './authStorage';

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'
).replace(/\/$/, '');

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/**
 * Mensagem literal que o backend usa (jwt.strategy.ts / jwt-auth.guard.ts)
 * especificamente quando o token é inválido/expirado OU o usuário tem
 * `forceLogout = true` (setado automaticamente pelo backend ao trocar
 * nickname/telefone/e-mail/estabelecimento/senha via PATCH /user/:id). É
 * diferente de "Acesso negado" — também HTTP 401, mas por falta de papel
 * (role) para aquela ação específica; nesse caso a sessão continua válida e
 * NÃO devemos deslogar o usuário, só deixar o erro seguir para a tela.
 */
const SESSION_INVALID_MESSAGE = 'Você precisa fazer login';

function handleInvalidSession() {
  clearStoredToken();
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.assign('/login');
  }
}

export type QueryParams = Record<
  string,
  string | number | boolean | undefined | null
>;

function buildQueryString(params?: QueryParams): string {
  if (!params) return '';
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      usp.append(key, String(value));
    }
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  // Lido agora, sempre — nunca de uma cópia guardada antes. Único lugar do
  // app que anexa o Bearer token; todo o resto passa por aqui, então não há
  // como uma chamada "esquecer" o header.
  const token = getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar à API. Verifique se o backend está rodando e o CORS está liberado.');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json().catch(() => undefined) : undefined;

  if (!response.ok) {
    const rawMessage = (data as { message?: string | string[] })?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : rawMessage ?? response.statusText ?? 'Erro inesperado na API';

    if (response.status === 401 && message === SESSION_INVALID_MESSAGE) {
      handleInvalidSession();
    }

    throw new ApiError(response.status, message, data);
  }

  return data as T;
}

export const apiClient = {
  get: <T>(path: string, params?: QueryParams) =>
    request<T>(`${path}${buildQueryString(params)}`, { method: 'GET' }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown, params?: QueryParams) =>
    request<T>(`${path}${buildQueryString(params)}`, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
