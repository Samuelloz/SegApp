import './globals.css';
import 'react-datepicker/dist/react-datepicker.css';

import type { Metadata } from 'next';
import Providers from './providers';
import AppToaster from '@/components/ui/AppToaster';

export const metadata: Metadata = {
  title: {
    default: 'SegApp',
    template: '%s | SegApp',
  },
  description: 'Plataforma para la gestión de empresas de seguridad privada.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>

        <AppToaster />
      </body>
    </html>
  );
}
