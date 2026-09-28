'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import { useForm } from 'react-hook-form';

import { companySlugSchema } from '@segapp/contracts';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getLastCompanySlug } from '@/lib/last-company-slug';

import {
  companyLoginSchema,
  type CompanyLoginValues,
} from './company-login.schema';
import styles from '../e/[companySlug]/login/login.module.css';

// localStorage no emite cambios que necesitemos escuchar en esta página.
function subscribe(): () => void {
  return () => {};
}

export default function CompanyLoginPage() {
  const router = useRouter();

  // undefined en el servidor: todavía no sabemos si hay una empresa guardada.
  const storedCompanySlug = useSyncExternalStore(
    subscribe,
    getLastCompanySlug,
    () => undefined,
  );

  const storedSlugResult = companySlugSchema.safeParse(storedCompanySlug);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyLoginValues>({
    resolver: zodResolver(companyLoginSchema),
    defaultValues: { companySlug: '' },
  });

  useEffect(() => {
    if (storedSlugResult.success) {
      router.replace(`/e/${storedSlugResult.data}/login`);
    }
  }, [router, storedSlugResult.success, storedSlugResult.data]);

  function onSubmit(values: CompanyLoginValues): void {
    router.push(`/e/${values.companySlug}/login`);
  }

  if (storedCompanySlug === undefined || storedSlugResult.success) {
    return (
      <main className={styles.page}>
        <p className={styles.status}>Abriendo el inicio de sesión...</p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="company-login-title">
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true" />
          <span className={styles.brandName}>SegApp</span>
        </div>

        <div className={styles.header}>
          <h1 id="company-login-title" className={styles.title}>
            Iniciar sesión
          </h1>

          <p className={styles.description}>
            Indica el identificador de tu empresa. Aparece en el enlace de
            acceso que te compartió tu administrador.
          </p>
        </div>

        <form
          className={styles.form}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className={styles.field}>
            <label className={styles.label} htmlFor="company-slug">
              Identificador de la empresa
            </label>

            <Input
              id="company-slug"
              type="text"
              autoComplete="organization"
              autoFocus
              placeholder="mi-empresa"
              {...register('companySlug')}
              aria-invalid={Boolean(errors.companySlug)}
              aria-describedby={
                errors.companySlug ? 'company-slug-error' : undefined
              }
            />

            {errors.companySlug && (
              <p
                id="company-slug-error"
                className={styles.fieldError}
                role="alert"
              >
                {errors.companySlug.message}
              </p>
            )}
          </div>

          <Button className={styles.submitButton} type="submit">
            Continuar
          </Button>
        </form>
      </section>
    </main>
  );
}
