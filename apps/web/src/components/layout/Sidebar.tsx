'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ChevronDown,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { hasPermission } from '@segapp/contracts';

import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
import { api, useGetCurrentSessionQuery, useLogoutMutation } from '@/store/api';
import { useAppDispatch } from '@/store/hooks';

import { MAIN_NAVIGATION_ITEMS, SETTINGS_NAVIGATION_ITEM } from './navigation';

import styles from './Sidebar.module.css';

type SidebarProps = {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
};

export default function Sidebar({
  open,
  collapsed,
  onClose,
  onToggleCollapse,
}: SidebarProps) {
  const pathName = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [usersExpanded, setUsersExpanded] = useState(false);

  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const { data: session } = useGetCurrentSessionQuery();
  const roles = session?.membership.roles ?? [];
  const mainItems = MAIN_NAVIGATION_ITEMS.filter((item) =>
    hasPermission(roles, item.permission),
  );
  const canManageCompany = hasPermission(roles, 'company:manage');
  const SettingsIcon = SETTINGS_NAVIGATION_ITEM.icon;
  const CollapseIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  useEffect(() => {
    if (pathName.startsWith('/settings')) {
      setExpandedGroup('/settings');
      setUsersExpanded(pathName.startsWith('/settings/users'));
      return;
    }

    const activeItem = MAIN_NAVIGATION_ITEMS.find((item) =>
      pathName.startsWith(item.href),
    );
    if (activeItem) setExpandedGroup(activeItem.href);
  }, [pathName]);

  function toggleGroup(href: string) {
    if (collapsed) {
      onToggleCollapse();
      setExpandedGroup(href);
      return;
    }
    setExpandedGroup((current) => (current === href ? null : href));
  }

  function handleNavigationClick() {
    onClose();
  }

  async function handleLogout(): Promise<void> {
    const toastId = toast.loading('Cerrando sesión...');

    try {
      await logout().unwrap();

      dispatch(api.util.resetApiState());
      onClose();

      toast.success('Sesión cerrada correctamente.', {
        id: toastId,
      });

      router.replace('/login');
      router.refresh();
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(error, 'No fue posible cerrar la sesión.'),
        {
          id: toastId,
        },
      );
    }
  }

  function isHrefActive(href: string): boolean {
    return pathName === href || pathName.startsWith(href + '/');
  }

  return (
    <aside
      id="app-sidebar"
      className={`${styles.sidebar} ${open ? styles.open : ''} ${collapsed ? styles.collapsed : ''}`}
    >
      <div className={styles.sidebarHeader}>
        <Link className={styles.brand} onClick={handleNavigationClick} href="/">
          <span className={styles.logo} />
          <div className={styles.brandText}>
            <div className={styles.brandName}>
              {session?.membership.company.name ?? 'SegApp'}
            </div>
          </div>
        </Link>

        <button
          type="button"
          className={styles.collapseButton}
          onClick={onToggleCollapse}
          aria-label={
            collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'
          }
          aria-expanded={!collapsed}
        >
          <CollapseIcon size={18} aria-hidden="true" />
        </button>

        <button
          type="button"
          className={styles.closeButton}
          onClick={handleNavigationClick}
          aria-label="Cerrar menú"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <nav className={styles.mainNavigation} aria-label="Navegación principal">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isExpanded = expandedGroup === item.href;

          return (
            <div key={item.href}>
              <button
                type="button"
                className={`${styles.link} ${styles.menuButton} ${isHrefActive(item.href) ? styles.active : ''}`}
                onClick={() => toggleGroup(item.href)}
                aria-expanded={isExpanded}
                aria-controls={`submenu-${item.label.toLowerCase()}`}
                aria-label={collapsed ? item.label : undefined}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={styles.linkIcon} aria-hidden="true" />
                <span className={styles.linkLabel}>{item.label}</span>
                <ChevronDown
                  className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`}
                  aria-hidden="true"
                />
              </button>
              {isExpanded && (
                <div
                  className={styles.subNavigation}
                  id={`submenu-${item.label.toLowerCase()}`}
                >
                  <Link
                    className={`${styles.subLink} ${pathName === item.href ? styles.active : ''}`}
                    href={item.href}
                    onClick={handleNavigationClick}
                  >
                    Listado de {item.label.toLowerCase()}
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <nav
        className={styles.settingsNavigation}
        aria-label="Configuración y sesión"
      >
        {canManageCompany && (
          <div>
            <button
              type="button"
              className={`${styles.link} ${styles.menuButton} ${isHrefActive('/settings') ? styles.active : ''}`}
              onClick={() => toggleGroup('/settings')}
              aria-expanded={expandedGroup === '/settings'}
              aria-controls="submenu-settings"
              aria-label={collapsed ? 'Configuración' : undefined}
              title={collapsed ? 'Configuración' : undefined}
            >
              <SettingsIcon className={styles.linkIcon} aria-hidden="true" />
              <span className={styles.linkLabel}>Configuración</span>
              <ChevronDown
                className={`${styles.chevron} ${expandedGroup === '/settings' ? styles.chevronOpen : ''}`}
                aria-hidden="true"
              />
            </button>
            {expandedGroup === '/settings' && (
              <div className={styles.subNavigation} id="submenu-settings">
                <Link
                  className={`${styles.subLink} ${pathName === '/settings' ? styles.active : ''}`}
                  href="/settings"
                  onClick={handleNavigationClick}
                >
                  Empresa
                </Link>
                <button
                  type="button"
                  className={`${styles.subLink} ${styles.menuButton} ${pathName.startsWith('/settings/users') ? styles.active : ''}`}
                  onClick={() => setUsersExpanded((value) => !value)}
                  aria-expanded={usersExpanded}
                  aria-controls="submenu-users"
                >
                  Usuarios
                  <ChevronDown
                    className={`${styles.chevron} ${usersExpanded ? styles.chevronOpen : ''}`}
                    aria-hidden="true"
                  />
                </button>
                {usersExpanded && (
                  <div className={styles.nestedNavigation} id="submenu-users">
                    <Link
                      className={`${styles.subLink} ${pathName === '/settings/users' ? styles.active : ''}`}
                      href="/settings/users"
                      onClick={handleNavigationClick}
                    >
                      Gestión de usuarios
                    </Link>

                    <Link
                      className={`${styles.subLink} ${pathName === '/settings/users/invitations' ? styles.active : ''}`}
                      href="/settings/users/invitations"
                      onClick={handleNavigationClick}
                    >
                      Invitar usuarios
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          className={`${styles.link} ${styles.logoutButton}`}
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className={styles.linkIcon} aria-hidden="true" />

          <span className={styles.linkLabel}>
            {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
          </span>
        </button>
      </nav>
    </aside>
  );
}
