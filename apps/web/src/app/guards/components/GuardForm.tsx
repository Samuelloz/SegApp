'use client';

import { useEffect, useRef } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { guardFormSchema, type GuardFormValues } from '@segapp/contracts';

import Input from '@/components/ui/Input';
import DatePickerHeader from '@/components/ui/DatePickerHeader';
import DatePicker from 'react-datepicker';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';

import styles from './GuardForm.module.css';

import { calculateGuardAge, hasGuardAddress } from '../guard.utils';

const MIN_GUARD_DATE = new Date(1900, 0, 1);

type GuardFormProps = {
  formId: string;
  initialValues: GuardFormValues;
  onSubmit: (values: GuardFormValues) => Promise<boolean>;
  onDirtyChange: (isDirty: boolean) => void;
};

export default function GuardForm({
  formId,
  initialValues,
  onSubmit,
  onDirtyChange,
}: GuardFormProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<GuardFormValues>({
    resolver: zodResolver(guardFormSchema),
    defaultValues: initialValues,
  });

  const addressDetailsRef = useRef<HTMLDetailsElement>(null);

  const birthDate = useWatch({
    control,
    name: 'birthDate',
  });

  const age = calculateGuardAge(birthDate);

  useEffect(() => {
    reset(initialValues);
    if (addressDetailsRef.current) {
      addressDetailsRef.current.open = hasGuardAddress(initialValues);
    }
  }, [initialValues, reset]);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  async function handleFormSubmit(values: GuardFormValues) {
    const wasSuccessful = await onSubmit(values);

    if (wasSuccessful) {
      onDirtyChange(false);
      reset();
    }
  }

  return (
    <form
      id={formId}
      className={styles.createRow}
      onSubmit={handleSubmit(handleFormSubmit)}
      noValidate
    >
      <div className={styles.field}>
        <label className={styles.fieldLabel}>Nombre completo *</label>

        <Input
          {...register('fullName')}
          aria-invalid={Boolean(errors.fullName)}
          placeholder="Ej. José Antonio Ramírez"
        />

        {errors.fullName && (
          <div className={styles.fieldError}>{errors.fullName.message}</div>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>Nombre del padre completo *</label>

        <Input
          {...register('fatherFullName')}
          aria-invalid={Boolean(errors.fatherFullName)}
          placeholder="Ej. José Antonio Ramírez"
        />

        {errors.fatherFullName && (
          <div className={styles.fieldError}>
            {errors.fatherFullName.message}
          </div>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>
          Nombre de la madre completo *
        </label>

        <Input
          {...register('motherFullName')}
          aria-invalid={Boolean(errors.motherFullName)}
          placeholder="Ej. José Antonio Ramírez"
        />

        {errors.motherFullName && (
          <div className={styles.fieldError}>
            {errors.motherFullName.message}
          </div>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>Fecha de Nacimiento *</label>

        <Controller
          name="birthDate"
          control={control}
          render={({ field }) => (
            <DatePicker
              id="guard-birth-date"
              name="guard-birth-date"
              minDate={MIN_GUARD_DATE}
              maxDate={new Date()}
              autoComplete="off"
              selected={
                field.value
                  ? parse(field.value, 'yyyy-MM-dd', new Date())
                  : null
              }
              onChange={(date: Date | null) =>
                field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
              }
              onBlur={field.onBlur}
              locale={es}
              dateFormat="dd/MM/yyyy"
              renderCustomHeader={(headerProps) => (
                <DatePickerHeader
                  {...headerProps}
                  minDate={MIN_GUARD_DATE}
                  maxDate={new Date()}
                />
              )}
              placeholderText="Selecciona fecha de nacimiento"
              isClearable
              showPopperArrow={false}
              wrapperClassName={styles.datePickerWrapper}
              className={styles.datePickerInput}
              calendarClassName={styles.datePickerCalendar}
              popperClassName={styles.datePickerPopper}
              aria-invalid={errors.birthDate ? 'true' : undefined}
            />
          )}
        />

        {errors.birthDate && (
          <div className={styles.fieldError}>{errors.birthDate.message}</div>
        )}

        {age !== null && <div>Edad: {age} años</div>}
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>Lugar de Nacimiento *</label>

        <Input
          {...register('birthPlace')}
          aria-invalid={Boolean(errors.birthPlace)}
          placeholder="Ej. Torreón Coahuila"
        />

        {errors.birthPlace && (
          <div className={styles.fieldError}>{errors.birthPlace.message}</div>
        )}
      </div>

      <div className={styles.field}>
        <div className={styles.fieldLabel}>No. de Empleado *</div>

        <Input
          {...register('employeeNumber')}
          aria-invalid={Boolean(errors.employeeNumber)}
          placeholder="Ej. 123456"
        />

        {errors.employeeNumber && (
          <div className={styles.fieldError}>
            {errors.employeeNumber.message}
          </div>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>Fecha de contratación *</label>

        <Controller
          name="hiredAt"
          control={control}
          render={({ field }) => (
            <DatePicker
              id="guard-hired-at"
              name="guard-hired-at"
              minDate={MIN_GUARD_DATE}
              maxDate={new Date()}
              autoComplete="off"
              selected={
                field.value
                  ? parse(field.value, 'yyyy-MM-dd', new Date())
                  : null
              }
              onChange={(date: Date | null) =>
                field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
              }
              onBlur={field.onBlur}
              locale={es}
              dateFormat="dd/MM/yyyy"
              renderCustomHeader={(headerProps) => (
                <DatePickerHeader
                  {...headerProps}
                  minDate={MIN_GUARD_DATE}
                  maxDate={new Date()}
                />
              )}
              placeholderText="Selecciona fecha de contratación"
              isClearable
              showPopperArrow={false}
              wrapperClassName={styles.datePickerWrapper}
              className={styles.datePickerInput}
              calendarClassName={styles.datePickerCalendar}
              popperClassName={styles.datePickerPopper}
              aria-invalid={errors.hiredAt ? 'true' : undefined}
            />
          )}
        />

        {errors.hiredAt && (
          <div className={styles.fieldError}>{errors.hiredAt.message}</div>
        )}
      </div>

      <div className={styles.field}>
        <div className={styles.fieldLabel}>Teléfono</div>

        <Input
          {...register('phone')}
          aria-invalid={Boolean(errors.phone)}
          placeholder="Ej. 8711786592"
        />

        {errors.phone && (
          <div className={styles.fieldError}>{errors.phone.message}</div>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>RFC *</label>

        <Input
          {...register('rfc')}
          aria-invalid={Boolean(errors.rfc)}
          placeholder="Ej. LOAS960510EJ7"
        />

        {errors.rfc && (
          <div className={styles.fieldError}>{errors.rfc.message}</div>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>CURP *</label>

        <Input
          {...register('curp')}
          aria-invalid={Boolean(errors.curp)}
          placeholder="Ej. "
        />

        {errors.curp && (
          <div className={styles.fieldError}>{errors.curp.message}</div>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>NSS *</label>

        <Input
          {...register('nss')}
          aria-invalid={Boolean(errors.nss)}
          placeholder="Ej. Torreón Coahuila"
        />

        {errors.nss && (
          <div className={styles.fieldError}>{errors.nss.message}</div>
        )}
      </div>

      <details className={styles.addressDetails} ref={addressDetailsRef}>
        <summary className={styles.addressSummary}>Agregar Dirección</summary>
        <div className={styles.addressGrid}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Calle</label>

            <Input
              {...register('street')}
              aria-invalid={Boolean(errors.street)}
              placeholder="Ej. José Maria Martinez"
            />

            {errors.street && (
              <div className={styles.fieldError}>{errors.street.message}</div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>No. Exterior</label>

            <Input
              {...register('exteriorNumber')}
              aria-invalid={Boolean(errors.exteriorNumber)}
              placeholder="Ej. 32"
            />

            {errors.exteriorNumber && (
              <div className={styles.fieldError}>
                {errors.exteriorNumber.message}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>No. Interior</label>

            <Input
              {...register('interiorNumber')}
              aria-invalid={Boolean(errors.interiorNumber)}
              placeholder="Ej. 2B"
            />

            {errors.interiorNumber && (
              <div className={styles.fieldError}>
                {errors.interiorNumber.message}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Colonia</label>

            <Input
              {...register('neighborhood')}
              aria-invalid={Boolean(errors.neighborhood)}
              placeholder="Ej. Fidel Velazquez"
            />

            {errors.neighborhood && (
              <div className={styles.fieldError}>
                {errors.neighborhood.message}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Codigo Postal</label>

            <Input
              {...register('postalCode')}
              aria-invalid={Boolean(errors.postalCode)}
              placeholder="Ej. 27019"
            />

            {errors.postalCode && (
              <div className={styles.fieldError}>
                {errors.postalCode.message}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Ciudad</label>

            <Input
              {...register('city')}
              aria-invalid={Boolean(errors.city)}
              placeholder="Ej. Torreón"
            />

            {errors.city && (
              <div className={styles.fieldError}>{errors.city.message}</div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Municipio</label>

            <Input
              {...register('municipality')}
              aria-invalid={Boolean(errors.municipality)}
              placeholder="Ej. Torreón"
            />

            {errors.municipality && (
              <div className={styles.fieldError}>
                {errors.municipality.message}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Estado</label>

            <Input
              {...register('state')}
              aria-invalid={Boolean(errors.state)}
              placeholder="Ej. Coahuila"
            />

            {errors.state && (
              <div className={styles.fieldError}>{errors.state.message}</div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Pais</label>

            <Input
              {...register('country')}
              aria-invalid={Boolean(errors.country)}
              placeholder="Ej. México"
            />

            {errors.country && (
              <div className={styles.fieldError}>{errors.country.message}</div>
            )}
          </div>
        </div>
      </details>
    </form>
  );
}
