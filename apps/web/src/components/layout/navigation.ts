import {
  BriefcaseBusiness,
  ClipboardCheck,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

type NavigationItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

export const MAIN_NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: 'Contratos',
    href: '/contracts',
    icon: BriefcaseBusiness,
  },
  {
    label: 'Guardias',
    href: '/guards',
    icon: ShieldCheck,
  },
  {
    label: 'Asignaciones',
    href: '/assignments',
    icon: ClipboardCheck,
  },
];

export const SETTINGS_NAVIGATION_ITEM: NavigationItem = {
  label: 'Configuración',
  href: '/settings',
  icon: Settings,
};
