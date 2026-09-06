import { useEffect, useState } from 'react';

/**
 * "Menor que um tablet" — mesmo breakpoint (768px) já usado nas media
 * queries de `index.css` para o drawer/stack de tabela, então JS e CSS
 * nunca discordam sobre o que conta como "mobile".
 */
const QUERY = '(max-width: 768px)';

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isMobile;
}
