import './globals.css';
import 'react-datepicker/dist/react-datepicker.css';

import Providers from './providers';
import Navbar from '@/components/layout/Navbar';
import AppToaster from '@/components/ui/AppToaster';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='es'>
      <body>
        <Providers>
          <Navbar />
          <div className='container page'>
            {children}
          </div>
        </Providers>

        <AppToaster />
      </body>
    </html>
  )
}
