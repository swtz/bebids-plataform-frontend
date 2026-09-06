import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileTopBar } from './MobileTopBar';
import { MobileBottomTabs } from './MobileBottomTabs';
import { MobileDrawer } from './MobileDrawer';
import { useIsMobile } from '@/hooks/useIsMobile';

export function AppLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <MobileTopBar onMenuClick={() => setIsDrawerOpen(true)} />
        <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
        <main key={location.pathname} className="app-content mobile-screen" style={{ flex: 1, padding: '16px' }}>
          <Outlet />
        </main>
        <MobileBottomTabs />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar isOpen={isDrawerOpen} onNavigate={() => setIsDrawerOpen(false)} />

      <div
        className={`sidebar-backdrop${isDrawerOpen ? ' is-visible' : ''}`}
        onClick={() => setIsDrawerOpen(false)}
        aria-hidden="true"
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar onMenuClick={() => setIsDrawerOpen(true)} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
