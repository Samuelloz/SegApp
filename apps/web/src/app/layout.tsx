import './globals.css';
import 'react-datepicker/dist/react-datepicker.css';

import Providers from './providers';
import AppToaster from '@/components/ui/AppToaster';

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
