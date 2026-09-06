import {
  Home,
  Truck,
  Bike,
  Gauge,
  Store,
  Users,
  MapPin,
  Clock,
  CalendarClock,
  CalendarCheck,
  Coffee,
  Ticket,
  Wallet,
  Landmark,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import { Role } from '@/types/enums';

export interface NavLink {
  to: string;
  label: string;
  icon: LucideIcon;
  /**
   * Visibilidade mínima (só consumida pelo drawer mobile por enquanto — a
   * Sidebar desktop continua mostrando tudo, sem gating, como sempre foi).
   * Ausente = visível pra qualquer papel autenticado, inclusive Motoboy.
   */
  minRole?: typeof Role.Operator | typeof Role.Admin;
}

export interface NavGroup {
  title: string;
  links: NavLink[];
}

export const navGroups: NavGroup[] = [
  {
    title: 'Visão geral',
    links: [{ to: '/', label: 'Início', icon: Home }],
  },
  {
    title: 'Operação',
    links: [
      { to: '/deliveries', label: 'Entregas', icon: Truck },
      { to: '/motoboys', label: 'Motoboys', icon: Bike, minRole: Role.Operator },
      { to: '/motorcycles', label: 'Motocicletas', icon: Gauge, minRole: Role.Admin },
      { to: '/places', label: 'Estabelecimentos', icon: Store, minRole: Role.Admin },
      { to: '/customers', label: 'Clientes', icon: Users, minRole: Role.Operator },
      { to: '/addresses', label: 'Endereços', icon: MapPin, minRole: Role.Operator },
    ],
  },
  {
    title: 'Escala',
    links: [
      { to: '/work-time', label: 'Horários de Serviço', icon: Clock },
      { to: '/work-time-place', label: 'Horário do Estabelecimento', icon: CalendarClock },
      { to: '/work-time-user', label: 'Horário do Usuário', icon: CalendarCheck },
      { to: '/interval-time', label: 'Intervalos', icon: Coffee },
    ],
  },
  {
    title: 'Financeiro',
    links: [
      { to: '/vouchers', label: 'Adiantamentos / Compras', icon: Ticket, minRole: Role.Admin },
      { to: '/payouts', label: 'Pagamentos', icon: Wallet },
      { to: '/settlements', label: 'Caixas', icon: Landmark, minRole: Role.Operator },
    ],
  },
  {
    title: 'Sistema',
    links: [{ to: '/users', label: 'Usuários', icon: UserCog, minRole: Role.Admin }],
  },
];

/** Lista achatada — usada pelo Topbar para descobrir o título da tela atual. */
export const flatNavLinks: NavLink[] = navGroups.flatMap(group => group.links);

/** Só usado pelo drawer mobile (ver nota em `NavLink.minRole`). */
export function canSeeNavLink(link: NavLink, roles: string[] | null | undefined): boolean {
  if (!link.minRole) return true;
  if (!roles) return false;
  if (link.minRole === Role.Admin) return roles.includes(Role.Admin);
  return roles.includes(Role.Admin) || roles.includes(Role.Operator);
}
