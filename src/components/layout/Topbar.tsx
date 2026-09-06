import { useLocation } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMe } from '@/hooks/useUserQueries';
import { roleLabels } from '@/types/enums';
import { Button } from '@/components/ui/Button';
import { flatNavLinks } from './navConfig';

interface TopbarProps {
  onMenuClick: () => void;
}

function initialsOf(name: string, lastName: string) {
  return `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { logout } = useAuth();
  const { data: me } = useMe();
  const location = useLocation();

  const currentTitle =
    flatNavLinks.find(link => (link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to)))
      ?.label ?? 'Geladinha';

  const roleLabel = me?.roles?.[0] ? roleLabels[me.roles[0]] ?? me.roles[0] : null;

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '16px 32px',
        borderBottom: '1px solid var(--color-divider)',
        background: 'var(--color-surface)',
      }}
    >
      {/* Só fica visível abaixo do breakpoint mobile (ver .hamburger-button
          no index.css) — em desktop ocupa o espaço mas fica invisível, pra
          o resto do topbar não pular de lugar entre os dois layouts. */}
      <button
        type="button"
        className="btn btn-icon btn-secondary hamburger-button"
        onClick={onMenuClick}
        aria-label="Abrir menu"
        style={{ visibility: 'hidden', pointerEvents: 'none', flexShrink: 0 }}
      >
        <Menu size={18} />
      </button>

      <h4 style={{ margin: 0, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260 }}>
        {currentTitle}
      </h4>

      <div style={{ position: 'relative', flex: '0 1 200px', minWidth: 120 }}>
        <Search
          size={15}
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}
        />
        <input className="input" placeholder="Buscar…" style={{ paddingLeft: 34 }} />
      </div>

      <div style={{ flex: 1, minWidth: 12 }} />

      <span className="tag tag-accent-2" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span
          className="live-dot"
          style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent-2-700)', display: 'inline-block' }}
        />
        API conectada
      </span>

      {me && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 14, borderLeft: '1px solid var(--color-divider)' }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'var(--color-accent-200)',
              color: 'var(--color-accent-800)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-heading)',
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {initialsOf(me.name, me.lastName)}
          </div>
          <div style={{ lineHeight: 1.2, whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {me.name} {me.lastName}
            </div>
            {roleLabel && <div style={{ fontSize: 11, opacity: 0.6 }}>{roleLabel}</div>}
          </div>
        </div>
      )}

      <Button variant="secondary" onClick={logout}>
        Sair
      </Button>
    </header>
  );
}
