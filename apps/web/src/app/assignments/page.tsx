'use client';

import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Select, { type StylesConfig } from 'react-select';
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import DatePicker, { registerLocale } from "react-datepicker";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

import styles from './assignments.module.css';

import {
    assignmentSchema,
    type AssignmentFormValues,
} from './assignment.schema';

import Modal from "@/components/ui/Modal";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

import {
    useCreateAssignmentMutation,
    useEndAssignmentMutation,
    useGetAssignmentsQuery,
    useGetContractsQuery,
    useGetGuardsQuery,
} from "@/store/api";

type SelectOption = {
    value: string;
    label: string;
}

registerLocale('es', es);

function getSelectStyles(
    hasError: boolean,
): StylesConfig<SelectOption, false> {
    return {
        control: (base, state) => ({
            ...base,
            minHeight: '42px',
            borderRadius: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            borderColor: hasError
                ? 'var(--danger)'
                : state.isFocused
                    ? 'var(--brand)'
                    : 'var(--line)',
            boxShadow: state.isFocused
                ? '0 0 0 3px rgba(79, 124, 255, 0.15)'
                : 'none',
            cursor: 'pointer',
            transition: 'border-color 0.2s, box-shadow 0.2s',

            '&:hover': {
                borderColor: hasError
                    ? 'var(--danger)'
                    : 'var(--brand)',
            },
        }),

        valueContainer: (base) => ({
            ...base,
            padding: '2px 12px',
        }),

        input: (base) => ({
            ...base,
            color: 'var(--text)',
        }),

        singleValue: (base) => ({
            ...base,
            color: 'var(--text)',
        }),

        placeholder: (base) => ({
            ...base,
            color: 'var(--muted)',
        }),

        dropdownIndicator: (base, state) => ({
            ...base,
            color: state.isFocused
                ? 'var(--text)'
                : 'var(--muted)',

            '&:hover': {
                color: 'var(--text)',
            },
        }),

        indicatorSeparator: (base) => ({
            ...base,
            backgroundColor: 'var(--line)',
        }),

        menu: (base) => ({
            ...base,
            zIndex: 30,
            overflow: 'hidden',
            padding: '4px',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            backgroundColor: '#0b1020',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
        }),

        menuList: (base) => ({
            ...base,
            padding: 0,
        }),

        option: (base, state) => ({
            ...base,
            borderRadius: '8px',
            backgroundColor: state.isSelected
                ? 'rgba(79, 124, 255, 0.35)'
                : state.isFocused
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'transparent',
            color: 'var(--text)',
            cursor: 'pointer',

            '&:active': {
                backgroundColor: 'rgba(79, 124, 255, 0.25)',
            },
        }),

        noOptionsMessage: (base) => ({
            ...base,
            color: 'var(--muted)',
        }),
    };
}

function formatDate(value: string): string {
    return new Date(value).toLocaleString('es-MX');
}

export default function AssignmentsPage() {
    const [assignmentToEnd, setAssignmentToEnd] = useState<{
        id: string,
        guardName: string,
    } | null>(null);

    const {
        data: assignments = [],
        isLoading: isLoadingAssignments,
        error: assignmentsError,
    } = useGetAssignmentsQuery();

    const {
        data: guards = [],
        isLoading: isLoadingGuards,
    } = useGetGuardsQuery();

    const {
        data: contracts = [],
        isLoading: isLoadingContracts,
    } = useGetContractsQuery();

    const [
        createAssignment,
        { isLoading: isCreating },
    ] = useCreateAssignmentMutation();

    const [
        endAssignment,
        { isLoading: isEnding },
    ] = useEndAssignmentMutation();

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<AssignmentFormValues>({
        resolver: zodResolver(assignmentSchema),
        defaultValues: {
            guardId: '',
            contractId: '',
            startedAt: '',
        },
    });

    const activeAssignments = useMemo(
        () =>
            assignments.filter(
                (assignment) => assignment.endedAt === null,
            ),
        [assignments],
    );

    const assignedGuardIds = useMemo(
        () =>
            new Set(
                activeAssignments.map(
                    (assignment) => assignment.guardId,
                ),
            ),
        [activeAssignments],
    );

    const availableGuards = useMemo(
        () =>
            guards.filter(
                (guard) =>
                    guard.active !== false &&
                    !assignedGuardIds.has(guard.id),
            ),
        [guards, assignedGuardIds]
    );

    const activeContracts = useMemo(
        () =>
            contracts.filter(
                (contract) => contract.active !== false,
            ),
        [contracts],
    );

    const guardOptions = useMemo<SelectOption[]>(
        () =>
            availableGuards.map((guard) => ({
                value: guard.id,
                label: `${guard.fullname} - ${guard.employeeNumber}`,
            })),
        [availableGuards],
    );

    const contractOptions = useMemo<SelectOption[]>(
        () =>
            activeContracts.map((contract) => ({
                value: contract.id,
                label: contract.name,
            })),
        [activeContracts],
    );

    async function onCreate(
        values: AssignmentFormValues,
    ) {
        const toastId = toast.loading('Creando asignación...');

        try {
            await createAssignment({
                guardId: values.guardId,
                contractId: values.contractId,
                startedAt: values.startedAt ?
                    new Date(values.startedAt).toISOString() :
                    undefined,
            }).unwrap();

            toast.success('Asignación creada.', {
                id: toastId,
            });

            reset();
        } catch (error: unknown) {
            toast.error(
                getApiErrorMessage(
                    error,
                    'Error al crear la asignación.'
                ),
                { id: toastId },
            );
        }
    }

    async function onEndAssignment() {
        if (!assignmentToEnd) return;

        const toastId = toast.loading(
            'Finalizando asignación...',
        );

        try {
            await endAssignment({
                id: assignmentToEnd.id,
            }).unwrap();

            toast.success('Asignación finalizada.', {
                id: toastId,
            });

            setAssignmentToEnd(null);
        } catch (error: unknown) {
            toast.error(
                getApiErrorMessage(
                    error,
                    'Error al finalizar la asignación.'
                ),
                { id: toastId }
            );
        }
    }

    const isLoadingFormData = isLoadingGuards || isLoadingContracts;

    return (
        <>
            <div className="pageHead">
                <div>
                    <h1 className="h1">Asignaciones</h1>

                    <p className="pMuted">
                        Asignación de guardias a contratos.
                    </p>
                </div>

                <Badge tone="info">
                    {activeAssignments.length} vigentes
                </Badge>
            </div>

            <section className="panel">
                <div className="toolbar">
                    <form
                        className={styles.formGrid}
                        onSubmit={handleSubmit(onCreate)}
                        noValidate>
                        <div className={styles.field}>
                            <label
                                className={styles.fieldLabel}
                                htmlFor="assignment-guard"
                            >
                                Guardia *
                            </label>

                            <Controller
                                name="guardId"
                                control={control}
                                render={({ field }) => (
                                    <Select<SelectOption, false>
                                        instanceId="assignment-guard"
                                        inputId="assignment-guard"
                                        name={field.name}
                                        value={
                                            guardOptions.find(
                                                (option) => option.value === field.value
                                            ) ?? null
                                        }
                                        onChange={(option) =>
                                            field.onChange(option?.value ?? '')
                                        }
                                        onBlur={field.onBlur}
                                        options={guardOptions}
                                        placeholder="Selecciona un guardia"
                                        noOptionsMessage={() => 'No hay guardias disponibles'}
                                        isDisabled={isLoadingFormData}
                                        isSearchable
                                        isClearable
                                        styles={getSelectStyles(Boolean(errors.guardId))}
                                    />
                                )}
                            />

                            {errors.guardId && (
                                <div className={styles.fieldError}>
                                    {errors.guardId.message}
                                </div>
                            )}
                        </div>

                        <div className={styles.field}>
                            <label
                                className={styles.fieldLabel}
                                htmlFor="assignment-contract">
                                Contrato *
                            </label>

                            <Controller
                                name="contractId"
                                control={control}
                                render={({ field }) => (
                                    <Select<SelectOption, false>
                                        instanceId="assignment-contract"
                                        inputId="assignment-contract"
                                        name={field.name}
                                        value={
                                            contractOptions.find(
                                                (option) => option.value === field.value
                                            ) ?? null
                                        }
                                        onChange={(option) =>
                                            field.onChange(option?.value ?? '')
                                        }
                                        onBlur={field.onBlur}
                                        options={contractOptions}
                                        placeholder="Selecciona un contrato"
                                        noOptionsMessage={() => 'No hay contratos disponibles'}
                                        isDisabled={isLoadingFormData}
                                        isSearchable
                                        isClearable
                                        styles={getSelectStyles(Boolean(errors.contractId))}
                                    />
                                )}
                            />

                            {errors.contractId && (
                                <div className={styles.fieldError}>
                                    {errors.contractId.message}
                                </div>
                            )}
                        </div>

                        <div className={styles.field}>
                            <label
                                className={styles.fieldLabel}
                                htmlFor="assignment-started-at"
                            >
                                Fecha de Inicio
                            </label>

                            <Controller
                                name="startedAt"
                                control={control}
                                render={({ field }) => (
                                    <DatePicker
                                        id="assignment-started-at"
                                        selected={
                                            field.value ?
                                                new Date(field.value) :
                                                null
                                        }
                                        onChange={(date: Date | null) =>
                                            field.onChange(
                                                date ? format(date, "yyyy-MM-dd'T'HH:mm") : '',
                                            )
                                        }
                                        onBlur={field.onBlur}
                                        locale="es"
                                        showTimeSelect
                                        timeIntervals={15}
                                        timeCaption="Hora"
                                        dateFormat="dd/MM/yyyy HH:mm"
                                        placeholderText="Selecciona fecha y hora"
                                        isClearable
                                        showPopperArrow={false}
                                        wrapperClassName={styles.datePickerWrapper}
                                        className={styles.datePickerInput}
                                        calendarClassName={styles.datePickerCalendar}
                                        popperClassName={styles.datePickerPopper}
                                        ariaInvalid={
                                            errors.startedAt ? 'true' : undefined
                                        }
                                    />
                                )}
                            />

                            {errors.startedAt && (
                                <div className={styles.fieldError}>
                                    {errors.startedAt.message}
                                </div>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className={styles.submitButton}
                            disabled={
                                isCreating ||
                                isLoadingFormData ||
                                availableGuards.length === 0 ||
                                activeContracts.length === 0
                            }
                        >
                            {isCreating ?
                                'Asignando...' :
                                'Asignar'
                            }
                        </Button>
                    </form>
                </div>

                <div className="grid gridCards">
                    {isLoadingAssignments && (
                        <div className={styles.message}>
                            Cargando asignaciones...
                        </div>
                    )}

                    {assignmentsError && (
                        <div className={styles.errorMessage}>
                            Error al cargar las asignaciones
                        </div>
                    )}

                    {assignments.map((assignment) => (
                        <Card key={assignment.id}>
                            <div className={styles.cardTop}>
                                <div>
                                    <div className={styles.guardName}>
                                        {assignment.guard.fullname}
                                    </div>

                                    <div className={styles.employeeNumber}>
                                        No. de empleado:{' '}
                                        {
                                            assignment.guard.employeeNumber
                                        }
                                    </div>
                                </div>

                                <Badge
                                    tone={
                                        assignment.endedAt ?
                                            'warn' : 'ok'
                                    }
                                >
                                    {assignment.endedAt ?
                                        'Finalizada' : 'Vigente'
                                    }
                                </Badge>
                            </div>

                            <div className={styles.contractName}>
                                {assignment.contract.name}
                            </div>

                            <div className={styles.metaGrid}>
                                <div>
                                    <div className={styles.metaLabel}>
                                        Inicio
                                    </div>

                                    <div className={styles.metaValue}>
                                        {formatDate(
                                            assignment.startedAt
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <div className={styles.metaLabel}>
                                        Finalización
                                    </div>

                                    <div className={styles.metaValue}>
                                        {assignment.endedAt ?
                                            formatDate(assignment.endedAt) :
                                            '-'
                                        }
                                    </div>
                                </div>
                            </div>

                            {!assignment.endedAt && (
                                <div className={styles.actions}>
                                    <Button
                                        type="button"
                                        variant="danger"
                                        disabled={isEnding}
                                        onClick={() => {
                                            setAssignmentToEnd({
                                                id: assignment.id,
                                                guardName: assignment.guard.fullname,
                                            })
                                        }}
                                    >
                                        {isEnding ?
                                            'Finalizando...' : 'Finalizar'
                                        }
                                    </Button>
                                </div>
                            )}
                        </Card>
                    ))}

                    {!isLoadingAssignments &&
                        !assignmentsError &&
                        assignments.length === 0 && (
                            <div className={styles.message}>
                                No hay asignaciones registradas.
                            </div>
                        )
                    }
                </div>
                <Modal
                    open={assignmentToEnd !== null}
                    title="Finalizar asignación"
                    onClose={() => {
                        if (!isEnding) {
                            setAssignmentToEnd(null);
                        }
                    }}
                >
                    <p className={styles.confirmText}>
                        ¿Deseas finalizar la asignación de {' '}
                        <strong>{assignmentToEnd?.guardName}</strong>?
                    </p>

                    <p className={styles.confirmWarning}>
                        Se registrará la fecha y hora actuales como finalización.
                    </p>

                    <div className={styles.confirmActions}>
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={isEnding}
                            onClick={() => setAssignmentToEnd(null)}
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="button"
                            variant="danger"
                            disabled={isEnding}
                            onClick={onEndAssignment}
                        >
                            {isEnding ? 'Finalizando...' : 'Finalizar'}
                        </Button>
                    </div>
                </Modal>
            </section>
        </>
    )
}