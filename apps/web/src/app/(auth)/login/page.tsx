'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@segapp/contracts';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
import { useLoginMutation } from '@/store/api';

import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginInput): Promise<void> {
    const toastId = toast.loading('Iniciando sesión...');

    try {
      await login(values).unwrap();

      toast.success('Sesión iniciada correctamente.', {
        id: toastId,
      });

      router.replace('/guards');
      router.refresh();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'No fue posible iniciar sesión.'), {
        id: toastId,
      });
    }
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
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-email">
              Correo electrónico
            </label>

            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="nombre@empresa.com"
              {...register('email')}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
            />

            {errors.email && (
              <p
                id="login-email-error"
                className={styles.fieldError}
                role="alert"
              >
                {errors.email.message}
              </p>
            )}
          </div>

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
