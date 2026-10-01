'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import Button from '@/components/ui/Button';
import { useGetCurrentSessionQuery } from '@/store/api';

import styles from './RequireSession.module.css';

type RequireSessionProps = {
  children: ReactNode;
};

function isUnauthorizedError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    error.status === 401
  );
}

export default function RequireSession({ children }: RequireSessionProps) {
  const router = useRouter();

  const {
    data: session,
    error,
    isLoading,
    refetch,
  } = useGetCurrentSessionQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const isUnauthorized = isUnauthorizedError(error);

  useEffect(() => {
    if (isUnauthorized) {
      router.replace('/login');
    }
  }, [isUnauthorized, router]);

  if (isLoading) {
    return (
      <main className={styles.screen}>
        <p className={styles.message}>Verificando sesión...</p>
      </main>
    );
  }

  if (isUnauthorized) {
    return (
      <main className={styles.screen}>
        <p className={styles.message}>Redirigiendo al inicio de sesión...</p>
      </main>
    );
  }

  if (error || !session) {
    return (
      <main className={styles.screen}>
        <section className={styles.errorPanel}>
          <h1 className={styles.title}>No fue posible verificar tu sesión</h1>

          <p className={styles.message}>
            Revisa tu conexión e inténtalo nuevamente.
          </p>

          <Button type="button" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </section>
      </main>
    );
  }

  return children;
}
