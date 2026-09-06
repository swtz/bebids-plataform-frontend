import { NavLink } from 'react-router-dom';
import { Home, Truck, Wallet, Clock } from 'lucide-react';
import { useMe } from '@/hooks/useUserQueries';
import { Role } from '@/types/enums';

export function MobileBottomTabs() {
  const { data: me } = useMe();
  const canManageDeliveries = me?.roles?.some(r => r === Role.Admin || r === Role.Operator) ?? false;

  const tabs = [
    { to: '/', label: 'Início', icon: Home, end: true },
    { to: '/deliveries', label: 'Entregas', icon: Truck, end: false },
    {
      to: canManageDeliveries ? '/settlements' : '/payouts',
      label: canManageDeliveries ? 'Caixas' : 'Pagamentos',
      icon: Wallet,
      end: false,
    },
    { to: '/work-time', label: 'Horários', icon: Clock, end: false },
  ];

  return (
    <nav className="mobile-bottom-tabs">
      {tabs.map(tab => (
        <NavLink
          key={tab.label}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `mobile-tab-btn${isActive ? ' active' : ''}`}
        >
          <tab.icon size={19} strokeWidth={2.25} />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
