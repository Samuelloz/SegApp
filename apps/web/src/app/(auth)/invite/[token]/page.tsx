'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
import {
  useAcceptInvitationMutation,
  useGetInvitationPreviewQuery,
} from '@/store/api';

import {
  invitationRegistrationSchema,
  type InvitationRegistrationInput,
} from './invitation-registration.schema';
import styles from './invite.module.css';

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [verificationToken, setVerificationToken] = useState<string | null>(
    null,
  );

  const {
    data: invitation,
    isLoading,
    isError,
  } = useGetInvitationPreviewQuery(token, {
    skip: !token,
    refetchOnMountOrArgChange: true,
  });

  const [acceptInvitation, { isLoading: isAccepting }] =
    useAcceptInvitationMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InvitationRegistrationInput>({
    resolver: zodResolver(invitationRegistrationSchema),
    defaultValues: {
      name: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: InvitationRegistrationInput): Promise<void> {
    const toastId = toast.loading('Aceptando invitación...');

    try {
      const acceptedInvitation = await acceptInvitation({
        token,
        name: values.name,
        password: values.password,
      }).unwrap();

      setVerificationToken(acceptedInvitation.verificationToken);

      toast.success('Invitación aceptada correctamente.', {
        id: toastId,
      });
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(error, 'No fue posible aceptar la invitación.'),
        {
          id: toastId,
        },
      );
    }
  }

  if (isLoading) {
    return (
      <main className={styles.page}>
        <section className={styles.card} aria-live="polite">
          <p className={styles.status}>Consultando invitación...</p>
        </section>
      </main>
    );
  }

  if (isError || !invitation) {
    return (
      <main className={styles.page}>
        <section className={styles.card} aria-labelledby="invitation-title">
          <div className={styles.brand}>
            <span className={styles.logo} aria-hidden="true" />
            <span>SegApp</span>
          </div>
          <h1 id="invitation-title" className={styles.title}>
            Invitación no disponible
          </h1>
          <p className={styles.description}>
            La invitación no es válida o ha vencido. Solicita una nueva a la
            persona que te invitó.
          </p>
        </section>
      </main>
    );
  }

  if (verificationToken) {
    return (
      <main className={styles.page}>
        <section className={styles.card} aria-labelledby="invitation-title">
          <div className={styles.brand}>
            <span className={styles.logo} aria-hidden="true" />
            <span>SegApp</span>
          </div>

          <p className={styles.eyebrow}>Invitación aceptada</p>

          <h1 id="invitation-title" className={styles.title}>
            Tu cuenta fue registrada.
          </h1>

          <p className={styles.success}>
            Tu cuenta fue registrada. Ahora debes verificar tu contacto para
            activar el acceso a {invitation.companyName}.
          </p>

          <Button
            className={styles.submit}
            type="button"
            onClick={() =>
              router.push(`/verify/${encodeURIComponent(verificationToken)}`)
            }
          >
            Continuar con la verificación
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="invitation-title">
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true" />
          <span>SegApp</span>
        </div>

        <p className={styles.eyebrow}>Invitación a una empresa</p>

        <h1 id="invitation-title" className={styles.title}>
          Te invitaron a {invitation.companyName}
        </h1>

        <p className={styles.description}>
          Esta invitación está asociada a los siguientes datos de contacto:
        </p>

        <dl className={styles.details}>
          {invitation.email && (
            <div className={styles.detail}>
              <dt>Correo electrónico</dt>
              <dd>{invitation.email}</dd>
            </div>
          )}

          {invitation.phoneE164 && (
            <div className={styles.detail}>
              <dt>Teléfono</dt>
              <dd>{invitation.phoneE164}</dd>
            </div>
          )}

          <div className={styles.detail}>
            <dt>Válida hasta</dt>
            <dd>
              {new Date(invitation.expiresAt).toLocaleString('es-MX', {
                dateStyle: 'long',
                timeStyle: 'short',
              })}
            </dd>
          </div>
        </dl>

        <form
          className={styles.form}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className={styles.field}>
            <label className={styles.label} htmlFor="invitation-name">
              Nombre completo
            </label>

            <Input
              id="invitation-name"
              type="text"
              autoComplete="name"
              autoFocus
              {...register('name')}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={
                errors.name ? 'invitation-name-error' : undefined
              }
            />

            {errors.name && (
              <p
                id="invitation-name-error"
                className={styles.fieldError}
                role="alert"
              >
                {errors.name.message}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="invitation-password">
              Contraseña
            </label>

            <Input
              id="invitation-password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? 'invitation-password-error' : undefined
              }
            />

            {errors.password && (
              <p
                id="invitation-password-error"
                className={styles.fieldError}
                role="alert"
              >
                {errors.password.message}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label
              className={styles.label}
              htmlFor="invitation-confirm-password"
            >
              Confirmar contraseña
            </label>

            <Input
              id="invitation-confirm-password"
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={
                errors.confirmPassword
                  ? 'invitation-confirm-password-error'
                  : undefined
              }
            />

            {errors.confirmPassword && (
              <p
                id="invitation-confirm-password-error"
                className={styles.fieldError}
                role="alert"
              >
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            className={styles.submit}
            type="submit"
            disabled={isAccepting}
          >
            {isAccepting ? 'Aceptando invitación...' : 'Crear cuenta y aceptar'}
          </Button>
        </form>
      </section>
    </main>
  );
}
