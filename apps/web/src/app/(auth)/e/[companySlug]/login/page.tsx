'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  companySlugSchema,
  loginSchema,
  type LoginInput,
} from '@segapp/contracts';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import InternationalPhoneField from '@/components/ui/InternationalPhoneField';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
import { saveLastCompanySlug } from '@/lib/last-company-slug';
import { isValidE164PhoneNumber } from '@/lib/phone-number';
import { useGetCurrentSessionQuery, useLoginMutation } from '@/store/api';

import styles from './login.module.css';

export default function LoginPage() {
  const params = useParams<{ companySlug: string }>();
  const companySlugResult = companySlugSchema.safeParse(params.companySlug);
  const companySlug = companySlugResult.success ? companySlugResult.data : '';
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');

  const { data: session, isLoading: isCheckingSession } =
    useGetCurrentSessionQuery(undefined, {
      refetchOnMountOrArgChange: true,
    });

  const [login, { isLoading }] = useLoginMutation();

  const {
    clearErrors,
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      companySlug,
      identifier: '',
      password: '',
    },
  });

  useEffect(() => {
    if (session) {
      router.replace('/');
    }
  }, [router, session]);

  async function onSubmit(values: LoginInput): Promise<void> {
    if (loginMethod === 'phone' && !isValidE164PhoneNumber(values.identifier)) {
      setError('identifier', {
        type: 'validate',
        message: 'Ingresa un número válido para el país seleccionado.',
      });
      return;
    }

    const toastId = toast.loading('Iniciando sesión...');

    try {
      await login(values).unwrap();

      saveLastCompanySlug(values.companySlug);

      toast.success('Sesión iniciada correctamente.', {
        id: toastId,
      });

      router.replace('/');
      router.refresh();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'No fue posible iniciar sesión.'), {
        id: toastId,
      });
    }
  }

  function changeLoginMethod(nextMethod: 'email' | 'phone'): void {
    if (nextMethod === loginMethod) {
      return;
    }

    setLoginMethod(nextMethod);
    setValue('identifier', '', {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
    clearErrors('identifier');
  }

  if (isCheckingSession || session) {
    return (
      <main className={styles.page}>
        <p className={styles.status}>
          {session ? 'Redirigiendo al panel...' : 'Verificando sesión...'}
        </p>
      </main>
    );
  }

  if (!companySlugResult.success) {
    return (
      <main className={styles.page}>
        <p className={styles.status}>
          El enlace de inicio de sesión no es válido. Solicita el enlace
          correcto a tu administrador.
        </p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="login-title">
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true" />
          <span className={styles.brandName}>SegApp</span>
        </div>

        <div className={styles.header}>
          <h1 id="login-title" className={styles.title}>
            Iniciar sesión
          </h1>

          <p className={styles.description}>
            Accede al panel operativo de tu empresa.
          </p>
        </div>

        <form
          className={styles.form}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <fieldset className={styles.methodFieldset}>
            <legend className={styles.label}>Iniciar sesión con</legend>

            <div className={styles.methodOptions}>
              <button
                className={styles.methodButton}
                data-active={loginMethod === 'email'}
                type="button"
                aria-pressed={loginMethod === 'email'}
                onClick={() => changeLoginMethod('email')}
              >
                Correo electrónico
              </button>

              <button
                className={styles.methodButton}
                data-active={loginMethod === 'phone'}
                type="button"
                aria-pressed={loginMethod === 'phone'}
                onClick={() => changeLoginMethod('phone')}
              >
                Teléfono
              </button>
            </div>
          </fieldset>

          {loginMethod === 'email' ? (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="login-identifier">
                Correo electrónico
              </label>

              <Input
                id="login-identifier"
                type="email"
                autoComplete="username"
                autoFocus
                placeholder="nombre@empresa.com"
                {...register('identifier')}
                aria-invalid={Boolean(errors.identifier)}
                aria-describedby={
                  errors.identifier ? 'login-identifier-error' : undefined
                }
              />

              {errors.identifier && (
                <p
                  id="login-identifier-error"
                  className={styles.fieldError}
                  role="alert"
                >
                  {errors.identifier.message}
                </p>
              )}
            </div>
          ) : (
            <Controller
              control={control}
              name="identifier"
              render={({ field }) => (
                <InternationalPhoneField
                  inputId="login-identifier"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.identifier?.message}
                />
              )}
            />
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-password">
              Contraseña
            </label>

            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Ingresa tu contraseña"
              {...register('password')}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? 'login-password-error' : undefined
              }
            />

            {errors.password && (
              <p
                id="login-password-error"
                className={styles.fieldError}
                role="alert"
              >
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            className={styles.submitButton}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Button>
        </form>

        <p className={styles.footer}>
          Acceso exclusivo para usuarios autorizados.
        </p>
      </section>
    </main>
  );
}
