'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import Select from 'react-select';
import { toast } from 'sonner';

import {
  type CreateInvitationInput,
  type CreateInvitationResponse,
  createInvitationSchema,
  hasPermission,
} from '@segapp/contracts';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import InternationalPhoneField from '@/components/ui/InternationalPhoneField';
import {
  type AppSelectOption,
  getSelectStyles,
} from '@/components/ui/select.styles';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
import { isValidE164PhoneNumber } from '@/lib/phone-number';
import {
  useCreateInvitationMutation,
  useGetCurrentSessionQuery,
} from '@/store/api';

import styles from './invitations.module.css';

const roleOptions: Array<{
  value: CreateInvitationInput['roles'][number];
  label: string;
}> = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'SALES', label: 'Ventas' },
  { value: 'CONTRACT_MANAGER', label: 'Gestión de contratos' },
  { value: 'GUARD_MANAGER', label: 'Gestión de guardias' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'VIEWER', label: 'Consulta' },
];

type DeliveryChannel = CreateInvitationInput['deliveryChannel'];

const deliveryChannelOptions: AppSelectOption<DeliveryChannel>[] = [
  { value: 'EMAIL', label: 'Correo electrónico' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
];

export default function InvitationPage() {
  const { data: session } = useGetCurrentSessionQuery();

  const canManageUser = hasPermission(
    session?.membership.roles ?? [],
    'users:manage',
  );

  const [createdInvitation, setCreatedInvitation] =
    useState<CreateInvitationResponse | null>(null);

  const [createInvitation, { isLoading: isCreating }] =
    useCreateInvitationMutation();

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    unregister,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm<CreateInvitationInput>({
    resolver: zodResolver(createInvitationSchema),
    shouldUnregister: true,
    defaultValues: {
      deliveryChannel: 'EMAIL',
      roles: [],
    },
  });

  const deliveryChannel = watch('deliveryChannel');

  const invitationUrl =
    createdInvitation && typeof window !== 'undefined'
      ? `${window.location.origin}/invite/${createdInvitation.token}`
      : '';

  async function onSubmit(values: CreateInvitationInput): Promise<void> {
    setCreatedInvitation(null);

    if (
      values.deliveryChannel === 'WHATSAPP' &&
      (!values.phoneE164 || !isValidE164PhoneNumber(values.phoneE164))
    ) {
      setError('phoneE164', {
        type: 'validate',
        message: 'Ingresa un número válido para el país seleccionado.',
      });
      return;
    }

    const toastId = toast.loading('Creando invitación...');

    try {
      const invitation = await createInvitation(values).unwrap();

      setCreatedInvitation(invitation);

      reset(
        values.deliveryChannel === 'EMAIL'
          ? {
              deliveryChannel: 'EMAIL',
              email: '',
              roles: [],
            }
          : {
              deliveryChannel: 'WHATSAPP',
              phoneE164: '',
              roles: [],
            },
      );

      toast.success('Invitación creada correctamente.', {
        id: toastId,
      });
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(error, 'No fue posible crear la invitación.'),
        {
          id: toastId,
        },
      );
    }
  }

  async function copyInvitationLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(invitationUrl);
      toast.success('Enlace de invitación copiado.');
    } catch {
      toast.error('No fue posible copiar el enlace.');
    }
  }

  if (!session) {
    return <p className="pMuted">Verificando sesión...</p>;
  }

  if (!canManageUser) {
    return (
      <section className="panel">
        <div className="grid">
          <p>No tienes permiso para invitar usuarios.</p>
        </div>
      </section>
    );
  }

  const invitationMessage = createdInvitation
    ? `Te invito a unirte a ${session.membership.company.name} en SegApp: ${invitationUrl}`
    : '';

  const whatsappUrl =
    createdInvitation?.deliveryChannel === 'WHATSAPP' &&
    createdInvitation.phoneE164
      ? `https://wa.me/${createdInvitation.phoneE164.replace(/\D/g, '')}?text=${encodeURIComponent(
          invitationMessage,
        )}`
      : null;

  const emailUrl =
    createdInvitation?.deliveryChannel === 'EMAIL' && createdInvitation.email
      ? `mailto:${createdInvitation.email}?subject=${encodeURIComponent(
          `Invitación a ${session.membership.company.name}`,
        )}&body=${encodeURIComponent(invitationMessage)}`
      : null;

  return (
    <>
      <div className="pageHead">
        <div>
          <h1 className="h1">Invitar usuarios</h1>
          <p className="pMuted">
            Crea una invitación para que una persona acceda a esta empresa.
          </p>
        </div>
      </div>

      <section className="panel">
        <form
          className={styles.form}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className={styles.grid}>
            <div className={styles.field}>
              <label
                className={styles.label}
                htmlFor="invitation-delivery-channel"
              >
                Medio de envío
              </label>

              <Controller
                name="deliveryChannel"
                control={control}
                render={({ field }) => (
                  <Select<AppSelectOption<DeliveryChannel>, false>
                    instanceId="invitation-delivery-channel"
                    inputId="invitation-delivery-channel"
                    name={field.name}
                    value={
                      deliveryChannelOptions.find(
                        (option) => option.value === field.value,
                      ) ?? null
                    }
                    onChange={(option) => {
                      const nextChannel = option?.value ?? 'EMAIL';

                      unregister(['email', 'phoneE164']);
                      setValue('roles', [], {
                        shouldDirty: true,
                        shouldValidate: false,
                      });
                      clearErrors(['email', 'phoneE164', 'roles']);
                      setCreatedInvitation(null);
                      field.onChange(nextChannel);
                    }}
                    onBlur={field.onBlur}
                    options={deliveryChannelOptions}
                    isSearchable={false}
                    styles={getSelectStyles<DeliveryChannel>(
                      Boolean(errors.deliveryChannel),
                    )}
                  />
                )}
              />

              {errors.deliveryChannel && (
                <p className={styles.fieldError} role="alert">
                  {errors.deliveryChannel.message}
                </p>
              )}
            </div>

            {deliveryChannel === 'EMAIL' ? (
              <div className={styles.field} key="invitation-email-field">
                <label className={styles.label} htmlFor="invitation-email">
                  Correo electrónico
                </label>

                <Input
                  id="invitation-email"
                  type="email"
                  autoComplete="email"
                  placeholder="persona@empresa.com"
                  {...register('email')}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={
                    errors.email ? 'invitation-email-error' : undefined
                  }
                />

                {errors.email && (
                  <p
                    id="invitation-email-error"
                    className={styles.fieldError}
                    role="alert"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>
            ) : (
              <div className={styles.field} key="invitation-phone-field">
                <Controller
                  name="phoneE164"
                  control={control}
                  render={({ field }) => (
                    <InternationalPhoneField
                      inputId="invitation-phone"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.phoneE164?.message}
                    />
                  )}
                />
              </div>
            )}

            <fieldset className={styles.roles}>
              <legend className={styles.legend}>Roles permitidos</legend>

              <Controller
                name="roles"
                control={control}
                render={({ field }) => {
                  const selectedRoles = field.value ?? [];
                  const isAdminSelected = selectedRoles.includes('ADMIN');

                  return (
                    <div className={styles.roleGrid}>
                      {roleOptions.map((role, index) => {
                        const isAdmin = role.value === 'ADMIN';
                        const isDisabled = !isAdmin && isAdminSelected;

                        return (
                          <label
                            className={`${styles.roleOption} ${
                              isDisabled ? styles.roleOptionDisabled : ''
                            }`}
                            key={role.value}
                          >
                            <input
                              ref={index === 0 ? field.ref : undefined}
                              name={field.name}
                              type="checkbox"
                              value={role.value}
                              checked={selectedRoles.includes(role.value)}
                              disabled={isDisabled}
                              onBlur={field.onBlur}
                              onChange={(event) => {
                                if (isAdmin) {
                                  field.onChange(
                                    event.target.checked ? ['ADMIN'] : [],
                                  );
                                  return;
                                }

                                field.onChange(
                                  event.target.checked
                                    ? [
                                        ...selectedRoles.filter(
                                          (selectedRole) =>
                                            selectedRole !== 'ADMIN',
                                        ),
                                        role.value,
                                      ]
                                    : selectedRoles.filter(
                                        (selectedRole) =>
                                          selectedRole !== role.value,
                                      ),
                                );
                              }}
                            />

                            <span>{role.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  );
                }}
              />

              {errors.roles && (
                <p className={styles.fieldError} role="alert">
                  {errors.roles.message}
                </p>
              )}
            </fieldset>
          </div>

          <div className={styles.actions}>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creando invitación...' : 'Crear invitación'}
            </Button>
          </div>
        </form>
      </section>

      {createdInvitation && (
        <section className={`panel ${styles.result}`}>
          <div>
            <h2 className={styles.resultTitle}>Invitación creada</h2>

            <p className="pMuted">
              Comparte este enlace únicamente con la persona invitada.
            </p>
          </div>

          <div className={styles.linkRow}>
            <Input
              value={invitationUrl}
              readOnly
              aria-label="Enlace de invitación"
            />

            <Button type="button" onClick={copyInvitationLink}>
              Copiar enlace
            </Button>
          </div>

          <div className={styles.deliveryActions}>
            {whatsappUrl && (
              <a
                className={styles.deliveryLink}
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
              >
                Abrir WhatsApp
              </a>
            )}

            {emailUrl && (
              <a className={styles.deliveryLink} href={emailUrl}>
                Abrir correo
              </a>
            )}
          </div>

          <p className={styles.expiration}>
            Válida hasta:{' '}
            {new Date(createdInvitation.expiresAt).toLocaleString('es-MX', {
              dateStyle: 'long',
              timeStyle: 'short',
            })}
          </p>
        </section>
      )}
    </>
  );
}
