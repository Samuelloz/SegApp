import type { ReactNode } from 'react';

import AppShell from '@/components/layout/AppShell';

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
