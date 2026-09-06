/**
 * Sessão guardada em cookie do navegador (não localStorage, a pedido).
 *
 * Importante: o backend devolve o JWT no CORPO da resposta de login
 * (`{ accessToken }`), não via header `Set-Cookie` — então é a própria SPA
 * quem precisa escrever o cookie via JavaScript. Isso significa que este
 * cookie NÃO é HttpOnly (não tem como ser, sem o backend definir o cookie
 * ele mesmo) — ou seja, contra um ataque XSS ele não é mais seguro que
 * localStorage. A troca aqui é só de onde o token fica guardado, não uma
 * mudança de modelo de ameaça; se no futuro o backend passar a setar o
 * cookie via `Set-Cookie: HttpOnly; Secure`, essa função de leitura para de
 * ser necessária (o navegador manda o cookie sozinho em toda requisição).
 *
 * A validade do cookie é sincronizada com o `exp` do próprio token (lido
 * sem verificar assinatura — só para saber quando expira), então o cookie
 * some sozinho exatamente quando o token pararia de ser aceito de qualquer
 * forma. Se não for possível ler o `exp` por algum motivo, cai para 1 dia.
 */

const COOKIE_NAME = 'geladinha_access_token';
const FALLBACK_MAX_AGE_SECONDS = 60 * 60 * 24; // 1 dia

function decodeJwtExpiryMs(token: string): number | null {
  try {
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) return null;
    const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  const value = match.slice(COOKIE_NAME.length + 1);
  return value ? decodeURIComponent(value) : null;
}

export function setStoredToken(token: string): void {
  const expiryMs = decodeJwtExpiryMs(token);
  const maxAgeSeconds = expiryMs
    ? Math.max(0, Math.floor((expiryMs - Date.now()) / 1000))
    : FALLBACK_MAX_AGE_SECONDS;

  // "Secure" exige HTTPS — em dev (http://localhost) o navegador descartaria
  // o cookie inteiro se essa flag fosse sempre enviada, por isso é condicional.
  const isHttps = window.location.protocol === 'https:';

  document.cookie = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'path=/',
    `max-age=${maxAgeSeconds}`,
    'SameSite=Lax',
    isHttps ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
}

export function clearStoredToken(): void {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
