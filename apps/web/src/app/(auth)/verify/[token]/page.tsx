'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import Button from '@/components/ui/Button';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
import { useVerifyContactMutation } from '@/store/api';

import styles from '../../invite/[token]/invite.module.css';

export default function ContactVerificationPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  const [verifyContact, { isLoading }] = useVerifyContactMutation();

  async function handleVerification(): Promise<void> {
    const toastId = toast.loading('Verificando contacto...');

    try {
      await verifyContact({ token }).unwrap();

      setVerified(true);

      toast.success('Tu contacto fue verificado correctamente.', {
        id: toastId,
      });
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(error, 'No fue posible verificar el contacto.'),
        {
          id: toastId,
        },
      );
    }
  }

  if (verified) {
    return (
      <main className={styles.page}>
        <section className={styles.card} aria-labelledby="verification-title">
          <div className={styles.brand}>
            <span className={styles.logo} aria-hidden="true" />
            <span>SegApp</span>
          </div>

          <p className={styles.eyebrow}>Verificación completada</p>

          <h1 id="verification-title" className={styles.title}>
            Tu cuenta está activa.
          </h1>

          <p className={styles.success}>
            Tu contacto fue verificado y ya puedes iniciar sesión.
          </p>

          <Button
            className={styles.submit}
            type="button"
            onClick={() => router.push('/login')}
          >
            Ir a iniciar sesión
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="verification-title">
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true" />
          <span>SegApp</span>
        </div>

        <p className={styles.eyebrow}>Verificación de contacto</p>

        <h1 id="verification-title" className={styles.title}>
          Confirma tu contacto
        </h1>

        <p className={styles.description}>
          Confirma la verificación para activar tu acceso a la empresa.
        </p>

        <Button
          className={styles.submit}
          type="button"
          disabled={isLoading || !token}
          onClick={handleVerification}
        >
          {isLoading ? 'Verificando...' : 'Verificar contacto'}
        </Button>
      </section>
    </main>
  );
}
