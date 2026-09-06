import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useMe } from '@/hooks/useUserQueries';
import { roleLabels } from '@/types/enums';
import { flatNavLinks } from './navConfig';

export function MobileTopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { data: me } = useMe();
  const location = useLocation();

  const currentTitle =
    flatNavLinks.find(link =>
      link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to),
    )?.label ?? 'Geladinha';

  const roleLabel = me?.roles?.[0] ? roleLabels[me.roles[0]] ?? me.roles[0] : null;

  return (
    <div className="mobile-topbar">
      <button
        type="button"
        className="btn btn-icon"
        style={{ background: 'transparent', color: 'var(--color-neutral-100)' }}
        onClick={onMenuClick}
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      <span style={{ fontFamily: 'var(--font-heading)', fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {currentTitle}
      </span>

      {roleLabel ? (
        <span className="tag tag-accent" style={{ fontSize: 10, flexShrink: 0 }}>
          {roleLabel}
        </span>
      ) : (
        <span style={{ width: 36 }} />
      )}
    </div>
  );
}
