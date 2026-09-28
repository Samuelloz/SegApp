import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Iniciar sesión',
};

type CompanyLoginLayoutProps = {
  children: ReactNode;
};

export default function CompanyLoginLayout({
  children,
}: CompanyLoginLayoutProps) {
  return children;
}
