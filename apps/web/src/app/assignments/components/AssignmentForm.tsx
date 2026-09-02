'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  assignmentFormSchema,
  type AssignmentFormValues,
} from '@segapp/contracts';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import Button from '@/components/ui/Button';

import {
  getAssignmentSelectStyles,
  type AssignmentSelectOption,
} from '../assignment-select.styles';

import datePickerStyles from '../assignments.module.css';
import styles from './AssignmentForm.module.css';

type AssignmentFormProps = {
  guardOptions: AssignmentSelectOption[];
  contractOptions: AssignmentSelectOption[];
  isLoading: boolean;
  isCreating: boolean;
  onCreate: (values: AssignmentFormValues) => Promise<boolean>;
};

export default function AssignmentForm({
  guardOptions,
  contractOptions,
  isLoading,
  isCreating,
  onCreate,
}: AssignmentFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      guardId: '',
      contractId: '',
      startedAt: '',
    },
  });

  async function handleCreate(values: AssignmentFormValues) {
    const wasCreated = await onCreate(values);

    if (wasCreated) {
      reset();
    }
  }
  return (
    <form
      className={styles.formGrid}
      onSubmit={handleSubmit(handleCreate)}
      autoComplete="off"
      noValidate
    >
      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="assignment-guard">
          Guardia *
        </label>

        <Controller
          name="guardId"
          control={control}
          render={({ field }) => (
            <Select<AssignmentSelectOption, false>
              instanceId="assignment-guard"
              inputId="assignment-guard"
              name={field.name}
              value={
                guardOptions.find((option) => option.value === field.value) ??
                null
              }
              onChange={(option) => field.onChange(option?.value ?? '')}
              onBlur={field.onBlur}
              options={guardOptions}
              placeholder="Selecciona un guardia"
              noOptionsMessage={() => 'No hay guardias disponibles'}
              isDisabled={isLoading}
              isSearchable
              isClearable
              styles={getAssignmentSelectStyles(Boolean(errors.guardId))}
            />
          )}
        />

        {errors.guardId && (
          <div className={styles.fieldError}>{errors.guardId.message}</div>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="assignment-contract">
          Contrato *
        </label>

        <Controller
          name="contractId"
          control={control}
          render={({ field }) => (
            <Select<AssignmentSelectOption, false>
              instanceId="assignment-contract"
              inputId="assignment-contract"
              name={field.name}
              value={
                contractOptions.find(
                  (option) => option.value === field.value,
                ) ?? null
              }
              onChange={(option) => field.onChange(option?.value ?? '')}
              onBlur={field.onBlur}
              options={contractOptions}
              placeholder="Selecciona un contrato"
              noOptionsMessage={() => 'No hay contratos disponibles'}
              isDisabled={isLoading}
              isSearchable
              isClearable
              styles={getAssignmentSelectStyles(Boolean(errors.contractId))}
            />
          )}
        />

        {errors.contractId && (
          <div className={styles.fieldError}>{errors.contractId.message}</div>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="assignment-started-at">
          Fecha de Inicio
        </label>

        <Controller
          name="startedAt"
          control={control}
          render={({ field }) => (
            <DatePicker
              id="assignment-started-at"
              name="assignment-started-at"
              autoComplete="off"
              selected={field.value ? new Date(field.value) : null}
              onChange={(date: Date | null) =>
                field.onChange(date ? format(date, "yyyy-MM-dd'T'HH:mm") : '')
              }
              onBlur={field.onBlur}
              locale={es}
              showTimeSelect
              timeIntervals={15}
              timeCaption="Hora"
              dateFormat="dd/MM/yyyy HH:mm"
              placeholderText="Selecciona fecha y hora"
              isClearable
              showPopperArrow={false}
              wrapperClassName={datePickerStyles.datePickerWrapper}
              className={datePickerStyles.datePickerInput}
              calendarClassName={datePickerStyles.datePickerCalendar}
              popperClassName={datePickerStyles.datePickerPopper}
              aria-invalid={errors.startedAt ? 'true' : undefined}
            />
          )}
        />

        {errors.startedAt && (
          <div className={styles.fieldError}>{errors.startedAt.message}</div>
        )}
      </div>

      <Button
        type="submit"
        className={styles.submitButton}
        disabled={
          isCreating ||
          isLoading ||
          guardOptions.length === 0 ||
          contractOptions.length === 0
        }
      >
        {isCreating ? 'Asignando...' : 'Asignar'}
      </Button>
    </form>
  );
}
