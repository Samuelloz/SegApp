import { useEffect, useRef } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { contractFormSchema, type ContractFormValues } from '@segapp/contracts';

import Input from '@/components/ui/Input';
import DatePickerHeader from '@/components/ui/DatePickerHeader';
import DatePicker from 'react-datepicker';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';

import styles from './ContractForm.module.css';

import { hasContractAddress } from '../contract.utils';

const MIN_CONTRACT_DATE = new Date(1900, 0, 1);
const MAX_CONTRACT_DATE = new Date(2100, 11, 31);

type ContractFormProps = {
  formId: string;
  initialValues: ContractFormValues;
  onSubmit: (values: ContractFormValues) => Promise<boolean>;
  onDirtyChange: (isDirty: boolean) => void;
};

export default function ContractForm({
  formId,
  initialValues,
  onSubmit,
  onDirtyChange,
}: ContractFormProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: initialValues,
  });

  const addressDetailRef = useRef<HTMLDetailsElement>(null);

  const startDate = useWatch({
    control,
    name: 'startDate',
  });

  const selectedStartDate = startDate
    ? parse(startDate, 'yyyy-MM-dd', new Date())
    : MIN_CONTRACT_DATE;

  useEffect(() => {
    reset(initialValues);

    if (addressDetailRef.current) {
      addressDetailRef.current.open = hasContractAddress(initialValues);
    }
  }, [initialValues, reset]);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  async function handleFormSubmit(values: ContractFormValues) {
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
        <label className={styles.fieldLabel}>Nombre del Contrato *</label>

        <Input
          {...register('name')}
          aria-invalid={Boolean(errors.name)}
          placeholder="Ej. Servicio de vigilancia Plaza del Sol"
        />

        {errors.name && (
          <div className={styles.fieldError}>{errors.name.message}</div>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>Nombre del cliente *</label>

        <Input
          {...register('clientLegalName')}
          aria-invalid={Boolean(errors.clientLegalName)}
          placeholder="Ej. Comercializadora del Norte, S.A. de C.V."
        />

        {errors.clientLegalName && (
          <div className={styles.fieldError}>
            {errors.clientLegalName.message}
          </div>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>RFC del cliente *</label>

        <Input
          {...register('clientRfc')}
          aria-invalid={Boolean(errors.clientRfc)}
          placeholder="Ej. CDN260315AB1"
        />

        {errors.clientRfc && (
          <div className={styles.fieldError}>{errors.clientRfc.message}</div>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>Fecha de inicio *</label>

        <Controller
          name="startDate"
          control={control}
          render={({ field }) => (
            <DatePicker
              id="contract-start-date"
              name="contract-start-date"
              minDate={MIN_CONTRACT_DATE}
              maxDate={MAX_CONTRACT_DATE}
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
                  minDate={MIN_CONTRACT_DATE}
                  maxDate={MAX_CONTRACT_DATE}
                />
              )}
              placeholderText="Selecciona la fecha de inicio"
              isClearable
              showPopperArrow={false}
              wrapperClassName={styles.datePickerWrapper}
              className={styles.datePickerInput}
              calendarClassName={styles.datePickerCalendar}
              popperClassName={styles.datePickerPopper}
              aria-invalid={errors.startDate ? 'true' : undefined}
            />
          )}
        />

        {errors.startDate && (
          <div className={styles.fieldError}>{errors.startDate.message}</div>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>Fecha de finalización</label>

        <Controller
          name="endDate"
          control={control}
          render={({ field }) => (
            <DatePicker
              id="contract-end-date"
              name="contract-end-date"
              minDate={selectedStartDate}
              maxDate={MAX_CONTRACT_DATE}
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
                  minDate={selectedStartDate}
                  maxDate={MAX_CONTRACT_DATE}
                />
              )}
              placeholderText="Selecciona la fecha de finalización"
              isClearable
              showPopperArrow={false}
              wrapperClassName={styles.datePickerWrapper}
              className={styles.datePickerInput}
              calendarClassName={styles.datePickerCalendar}
              popperClassName={styles.datePickerPopper}
              aria-invalid={errors.endDate ? 'true' : undefined}
            />
          )}
        />

        {errors.endDate && (
          <div className={styles.fieldError}>{errors.endDate.message}</div>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>Nombre del contacto *</label>

        <Input
          {...register('contactName')}
          aria-invalid={Boolean(errors.contactName)}
          placeholder="Ej. Mariana Torres Salazar"
        />

        {errors.contactName && (
          <div className={styles.fieldError}>{errors.contactName.message}</div>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>Teléfono del contacto *</label>

        <Input
          {...register('contactPhone')}
          aria-invalid={Boolean(errors.contactPhone)}
          placeholder="Ej. 871 456 7820"
        />

        {errors.contactPhone && (
          <div className={styles.fieldError}>{errors.contactPhone.message}</div>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>Correo electrónico</label>

        <Input
          {...register('contactEmail')}
          aria-invalid={Boolean(errors.contactEmail)}
          placeholder="Ej. mariana.torres@cliente.mx"
        />

        {errors.contactEmail && (
          <div className={styles.fieldError}>{errors.contactEmail.message}</div>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>
          Número de guardias en el contrato *
        </label>

        <Input
          type="number"
          className={styles.numberInput}
          min={1}
          step={1}
          {...register('requiredGuardCount', {
            valueAsNumber: true,
          })}
          aria-invalid={Boolean(errors.requiredGuardCount)}
          placeholder="Ej. 12"
        />

        {errors.requiredGuardCount && (
          <div className={styles.fieldError}>
            {errors.requiredGuardCount.message}
          </div>
        )}
      </div>

      <details className={styles.addressDetails} ref={addressDetailRef}>
        <summary className={styles.addressSummary}>Agregar Dirección</summary>
        <div className={styles.addressGrid}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Calle</label>

            <Input
              {...register('street')}
              aria-invalid={Boolean(errors.street)}
              placeholder="Ej. Av. Independencia"
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
              placeholder="Ej. 245"
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
              placeholder="Ej. Local 4"
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
              placeholder="Ej. Centro"
            />

            {errors.neighborhood && (
              <div className={styles.fieldError}>
                {errors.neighborhood.message}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Código postal</label>

            <Input
              {...register('postalCode')}
              aria-invalid={Boolean(errors.postalCode)}
              placeholder="Ej. 27000"
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
              placeholder="Ej. Coahuila de Zaragoza"
            />

            {errors.state && (
              <div className={styles.fieldError}>{errors.state.message}</div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>País</label>

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
