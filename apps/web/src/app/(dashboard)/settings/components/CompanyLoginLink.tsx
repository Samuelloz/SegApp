'use client';

import { toast } from 'sonner';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

import styles from './CompanyLoginLink.module.css';

type CompanyLoginLinkProps = {
  companySlug: string;
};

export default function CompanyLoginLink({
  companySlug,
}: CompanyLoginLinkProps) {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const loginUrl = `${origin}/e/${companySlug}/login`;

  async function copyLoginUrl(): Promise<void> {
    try {
      await navigator.clipboard.writeText(loginUrl);
      toast.success('Enlace de acceso copiado.');
    } catch {
      toast.error('No fue posible copiar el enlace.');
    }
  }

  return (
    <section className={`panel ${styles.card}`}>
      <div>
        <h2 className={styles.title}>Enlace de acceso</h2>

        <p className="pMuted">
          Comparte este enlace con las personas de tu empresa para que inicien
          sesión.
        </p>
      </div>

      <div className={styles.linkRow}>
        <Input
          value={loginUrl}
          readOnly
          aria-label="Enlace de acceso de la empresa"
        />

        <Button type="button" onClick={copyLoginUrl}>
          Copiar enlace
        </Button>
      </div>
    </section>
  );
}
