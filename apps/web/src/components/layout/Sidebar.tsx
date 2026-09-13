'use client';

import Link from 'next/link';

import { usePathname } from 'next/navigation';
import { useGetCurrentCompanyQuery } from '@/store/api';

import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';

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
  const { data: company } = useGetCurrentCompanyQuery();
  const SettingsIcon = SETTINGS_NAVIGATION_ITEM.icon;
  const CollapseIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  function handleNavigationClick() {
    onClose();
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
            <div className={styles.brandName}>{company?.name ?? 'SegApp'}</div>
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
        {MAIN_NAVIGATION_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              className={`${styles.link} ${isHrefActive(item.href) ? styles.active : ''}`}
              key={item.href}
              onClick={handleNavigationClick}
              href={item.href}
              aria-label={collapsed ? item.label : undefined}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={styles.linkIcon} aria-hidden="true" />
              <span className={styles.linkLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <nav className={styles.settingsNavigation} aria-label="Configuración">
        <Link
          className={`${styles.link} ${isHrefActive(SETTINGS_NAVIGATION_ITEM.href) ? styles.active : ''}`}
          onClick={handleNavigationClick}
          href={SETTINGS_NAVIGATION_ITEM.href}
          aria-label={collapsed ? SETTINGS_NAVIGATION_ITEM.label : undefined}
          title={collapsed ? SETTINGS_NAVIGATION_ITEM.label : undefined}
        >
          <SettingsIcon className={styles.linkIcon} aria-hidden="true" />
          <span className={styles.linkLabel}>
            {SETTINGS_NAVIGATION_ITEM.label}
          </span>
        </Link>
      </nav>
    </aside>
  );
}
