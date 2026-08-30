'use client';

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

import { useGetCurrentCompanyQuery, useUpdateCurrentCompanyMutation } from "@/store/api";
import { companySchema, type CompanyFormValues } from "./company.schema";
import styles from './settings.module.css';
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

export default function SettingsPage() {
  const {
    data: company,
    isLoading,
    error,
  } = useGetCurrentCompanyQuery();

  const [
    updateCurrentCompany,
    { isLoading: isUpdating },
  ] = useUpdateCurrentCompanyMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
      isDirty,
    },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      legalName: '',
      rfc: '',
      address: '',
      timezone: 'America/Mexico_City',
    },
  });

  useEffect(() => {
    if (!company) {
      return;
    }

    reset({
      name: company.name,
      legalName: company.legalName ?? '',
      rfc: company.rfc ?? '',
      address: company.address ?? '',
      timezone: company.timezone,
    });
  }, [company, reset]);

  async function onSave(values: CompanyFormValues) {
    const toastId = toast.loading(
      'Guardando configuración...',
    );

    try {
      const updateCompany = await updateCurrentCompany(values).unwrap();

      reset({
        name: updateCompany.name,
        legalName: updateCompany.legalName ?? '',
        rfc: updateCompany.rfc ?? '',
        address: updateCompany.address ?? '',
        timezone: updateCompany.timezone,
      });

      toast.success('Configuración actualizada.', {
        id: toastId,
      });
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(
          error,
          'No fue posible actualizar la configuración.',
        ),
        {
          id: toastId,
        },
      );
    }
  }

  if (isLoading) {
    return (
      <div className={styles.status}>
        Cargando configuración...
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className={styles.error}>
        No fue posible cargar la configuración de la empresa.
      </div>
    )
  }

  return (
    <>
      <div className="pageHead">
        <div>
          <h1 className="h1">Configuración</h1>

          <p className="pMuted">
            Información general de la empresa
          </p>
        </div>
      </div>

      <section className="panel">
        <form
          className={styles.form}
          onSubmit={handleSubmit(onSave)}
          noValidate
        >
          <div className={styles.grid}>
            <div className={styles.field}>
              <label
                className={styles.label}
                htmlFor="company-name"
              >
                Nombre de la empresa *
              </label>

              <Input
                id="company-name"
                {...register('name')}
                aria-invalid={Boolean(errors.name)}
                placeholder="Ej. LozCorp"
              />

              {errors.name && (
                <div className={styles.fieldError}>
                  {errors.name.message}
                </div>
              )}
            </div>

            <div className={styles.field}>
              <label
                className={styles.label}
                htmlFor="company-legal-name"
              >
                Razón Social
              </label>

              <Input
                id="company-legal-name"
                {...register('legalName')}
                aria-invalid={Boolean(errors.legalName)}
                placeholder="Ej. LozCorp Seguridad Privada"
              />

              {errors.legalName && (
                <div className={styles.fieldError}>
                  {errors.legalName.message}
                </div>
              )}
            </div>

            <div className={styles.field}>
              <label
                className={styles.label}
                htmlFor="company-rfc"
              >
                RFC
              </label>

              <Input
                id="company-rfc"
                {...register('rfc')}
                aria-invalid={Boolean(errors.rfc)}
                placeholder="EJ. LOC010101ABC"
              />

              {errors.rfc && (
                <div className={styles.fieldError}>
                  {errors.rfc.message}
                </div>
              )}
            </div>

            <div className={styles.field}>
              <label
                className={styles.label}
                htmlFor="company-timezone"
              >
                Zona horaria *
              </label>

              <Input
                id="company-timezone"
                {...register('timezone')}
                aria-invalid={Boolean(errors.timezone)}
                placeholder="America/Mexico_City"
              />

              {errors.timezone && (
                <div className={styles.fieldError}>
                  {errors.timezone.message}
                </div>
              )}
            </div>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label
                className={styles.label}
                htmlFor="company-address"
              >
                Dirección
              </label>

              <textarea
                id="company-address"
                {...register('address')}
                className={styles.textarea}
                aria-invalid={Boolean(errors.address)}
                placeholder="Dirección general de la empresa"
                rows={4}
              />

              {errors.address && (
                <div className={styles.fieldError}>
                  {errors.address.message}
                </div>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <Button
              type="button"
              variant="ghost"
              disabled={!isDirty || isUpdating}
              onClick={() => {
                if (!company) {
                  return
                }

                reset({
                  name: company.name,
                  legalName: company.legalName ?? '',
                  rfc: company.rfc ?? '',
                  address: company.address ?? '',
                  timezone: company.timezone,
                })
              }}
            >
              Descartar cambios
            </Button>

            <Button
              type="submit"
              disabled={!isDirty || isUpdating}
            >
              {isUpdating ?
                'Guardando...' :
                'Guardar Cambios'
              }
            </Button>
          </div>
        </form>
      </section>
    </>
  )
}