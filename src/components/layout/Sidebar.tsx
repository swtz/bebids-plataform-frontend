import { NavLink } from 'react-router-dom';
import { navGroups } from './navConfig';

interface SidebarProps {
  /** Só tem efeito visual abaixo do breakpoint mobile (ver .sidebar.is-open no index.css). */
  isOpen: boolean;
  /** Chamado ao clicar num link — fecha o drawer no mobile; inofensivo no desktop. */
  onNavigate: () => void;
}

export function Sidebar({ isOpen, onNavigate }: SidebarProps) {
  return (
    <aside className={`sidebar${isOpen ? ' is-open' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 10px 22px' }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--color-accent)',
            color: 'var(--color-bg)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-heading)',
            fontSize: 16,
          }}
        >
          G
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, lineHeight: 1.1 }}>
            Geladinha
          </div>
          <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.55 }}>
            Delivery Admin
          </div>
        </div>
      </div>

      {navGroups.map(group => (
        <div key={group.title}>
          <div className="sidebar-section-title">{group.title}</div>
          {group.links.map(link => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={onNavigate}
                className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
              >
                <Icon size={17} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                {link.label}
              </NavLink>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
