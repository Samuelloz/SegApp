import type { ReactNode } from 'react';

import RequireSession from '@/components/auth/RequireSession';
import AppShell from '@/components/layout/AppShell';

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <RequireSession>
      <AppShell>{children}</AppShell>
    </RequireSession>
  );
}
