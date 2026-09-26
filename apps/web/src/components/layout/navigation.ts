import {
  BriefcaseBusiness,
  ClipboardCheck,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import type { AppPermission } from '@segapp/contracts';

type NavigationItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  permission: AppPermission;
};

export const MAIN_NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: 'Contratos',
    href: '/contracts',
    icon: BriefcaseBusiness,
    permission: 'contracts:list',
  },
  {
    label: 'Guardias',
    href: '/guards',
    icon: ShieldCheck,
    permission: 'guards:list',
  },
  {
    label: 'Asignaciones',
    href: '/assignments',
    icon: ClipboardCheck,
    permission: 'assignments:list',
  },
];

export const SETTINGS_NAVIGATION_ITEM: NavigationItem = {
  label: 'Configuración',
  href: '/settings',
  icon: Settings,
  permission: 'company:manage',
};
