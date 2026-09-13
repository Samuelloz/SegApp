'use client';

import { type ReactNode, useEffect, useState } from 'react';

import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';

import styles from './AppShell.module.css';

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] =
    useState(false);

  function handleOpenMobileSidebar() {
    setIsMobileSidebarOpen(true);
  }

  function handleCloseMobileSidebar() {
    setIsMobileSidebarOpen(false);
  }

  function handleToggleDesktopSidebar() {
    setIsDesktopSidebarCollapsed((currentValue) => !currentValue);
  }

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMobileSidebarOpen(false);
      }
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    const desktopMediaQuery = window.matchMedia('(min-width: 981px)');

    function handleBreakpointChange(event: MediaQueryListEvent) {
      if (event.matches) {
        setIsMobileSidebarOpen(false);
      }
    }

    desktopMediaQuery.addEventListener('change', handleBreakpointChange);

    return () => {
      desktopMediaQuery.removeEventListener('change', handleBreakpointChange);
    };
  }, []);

  return (
    <div className={styles.shell}>
      <Sidebar
        open={isMobileSidebarOpen}
        collapsed={isDesktopSidebarCollapsed}
        onClose={handleCloseMobileSidebar}
        onToggleCollapse={handleToggleDesktopSidebar}
      />

      {isMobileSidebarOpen && (
        <button
          type="button"
          className={styles.backdrop}
          onClick={handleCloseMobileSidebar}
          aria-label="Cerrar menú"
        />
      )}

      <div className={styles.mainArea}>
        <MobileHeader
          open={isMobileSidebarOpen}
          onOpen={handleOpenMobileSidebar}
        />

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
