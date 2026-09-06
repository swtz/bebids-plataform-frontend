import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMe } from '@/hooks/useUserQueries';
import { navGroups, canSeeNavLink } from './navConfig';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const { data: me } = useMe();
  const { logout } = useAuth();

  if (!isOpen) return null;

  const links = navGroups.flatMap(group => group.links);

  return (
    <>
      <div className="mobile-drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="mobile-drawer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--color-accent)',
              color: 'var(--color-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-heading)',
              fontSize: 15,
              flexShrink: 0,
            }}
          >
            G
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15 }}>Geladinha</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>Painel administrativo</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto' }}>
          {links.map(link => {
            const visible = canSeeNavLink(link, me?.roles ?? null);
            const Icon = link.icon;
            if (!visible) {
              return (
                <button key={link.to} type="button" disabled className="mobile-drawer-link">
                  <Icon size={17} strokeWidth={2.25} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{link.label}</span>
                  <span className="tag tag-neutral" style={{ fontSize: 9 }}>
                    em breve
                  </span>
                </button>
              );
            }
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={onClose}
                className={({ isActive }) => `mobile-drawer-link${isActive ? ' active' : ''}`}
              >
                <Icon size={17} strokeWidth={2.25} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{link.label}</span>
              </NavLink>
            );
          })}
        </div>

        <button
          type="button"
          onClick={logout}
          className="mobile-drawer-link"
          style={{ color: 'var(--status-danger)', marginTop: 10 }}
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </>
  );
}
