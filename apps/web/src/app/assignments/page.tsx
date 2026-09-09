'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/lib/getApiErrorMessage';

import styles from './assignments.module.css';

import {
  type AssignmentFormValues,
  type GuardAssignment,
} from '@segapp/contracts';

import { getAssignmentStatus, getCurrentTimestamp } from './assignment.utils';

import { type AssignmentSelectOption } from './assignment-select.styles';

import Badge from '@/components/ui/Badge';
import AssignmentCard from './components/AssignmentCard';
import EndAssignmentModal from './components/EndAssignmentModal';
import AssignmentForm from './components/AssignmentForm';

import {
  useCreateAssignmentMutation,
  useEndAssignmentMutation,
  useGetAssignmentsQuery,
  useGetContractsQuery,
  useGetGuardsQuery,
} from '@/store/api';

export default function AssignmentsPage() {
  const [assignmentToEnd, setAssignmentToEnd] =
    useState<GuardAssignment | null>(null);

  const [currentTimestamp, setCurrentTimestamp] = useState(() =>
    getCurrentTimestamp(),
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTimestamp(getCurrentTimestamp());
    }, 30_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const {
    data: assignments = [],
    isLoading: isLoadingAssignments,
    error: assignmentsError,
  } = useGetAssignmentsQuery();

  const { data: guards = [], isLoading: isLoadingGuards } = useGetGuardsQuery();

  const { data: contracts = [], isLoading: isLoadingContracts } =
    useGetContractsQuery();

  const [createAssignment, { isLoading: isCreating }] =
    useCreateAssignmentMutation();

  const [endAssignment, { isLoading: isEnding }] = useEndAssignmentMutation();

  const unfinishedAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.endedAt === null),
    [assignments],
  );

  const activeAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) =>
          getAssignmentStatus(assignment, currentTimestamp) === 'active',
      ),
    [assignments, currentTimestamp],
  );

  const scheduledAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) =>
          getAssignmentStatus(assignment, currentTimestamp) === 'scheduled',
      ),
    [assignments, currentTimestamp],
  );

  const assignedGuardIds = useMemo(
    () =>
      new Set(unfinishedAssignments.map((assignment) => assignment.guardId)),
    [unfinishedAssignments],
  );

  const availableGuards = useMemo(
    () =>
      guards.filter(
        (guard) => guard.active !== false && !assignedGuardIds.has(guard.id),
      ),
    [guards, assignedGuardIds],
  );

  const activeContracts = useMemo(
    () => contracts.filter((contract) => contract.active !== false),
    [contracts],
  );

  const guardOptions = useMemo<AssignmentSelectOption[]>(
    () =>
      availableGuards.map((guard) => ({
        value: guard.id,
        label: `${guard.fullName} - ${guard.employeeNumber}`,
      })),
    [availableGuards],
  );

  const contractOptions = useMemo<AssignmentSelectOption[]>(
    () =>
      activeContracts.map((contract) => ({
        value: contract.id,
        label: contract.name,
      })),
    [activeContracts],
  );

  async function handleCreateAssignment(
    values: AssignmentFormValues,
  ): Promise<boolean> {
    const toastId = toast.loading('Creando asignación...');

    try {
      await createAssignment({
        guardId: values.guardId,
        contractId: values.contractId,
        startedAt: values.startedAt
          ? new Date(values.startedAt).toISOString()
          : undefined,
      }).unwrap();

      setCurrentTimestamp(getCurrentTimestamp());

      toast.success('Asignación creada.', {
        id: toastId,
      });

      return true;
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Error al crear la asignación.'), {
        id: toastId,
      });

      return false;
    }
  }

  async function handleEndAssignment(assignmentId: string) {
    const toastId = toast.loading('Finalizando asignación...');

    try {
      await endAssignment({
        id: assignmentId,
      }).unwrap();

      toast.success('Asignación finalizada.', {
        id: toastId,
      });

      setAssignmentToEnd(null);
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(error, 'Error al finalizar la asignación.'),
        { id: toastId },
      );
    }
  }

  const isLoadingFormData = isLoadingGuards || isLoadingContracts;

  function handleOpenEndModal(assignment: GuardAssignment) {
    setAssignmentToEnd(assignment);
  }

  function handleCloseEndModal() {
    if (isEnding) return;

    setAssignmentToEnd(null);
  }

  return (
    <>
      <div className="pageHead">
        <div>
          <h1 className="h1">Asignaciones</h1>

          <p className="pMuted">Asignación de guardias a contratos.</p>
        </div>

        <Badge tone="info">
          {activeAssignments.length} vigentes
          {scheduledAssignments.length > 0 &&
            ` · ${scheduledAssignments.length} programadas`}
        </Badge>
      </div>

      <section className="panel">
        <div className="toolbar">
          <AssignmentForm
            guardOptions={guardOptions}
            contractOptions={contractOptions}
            isLoading={isLoadingFormData}
            isCreating={isCreating}
            onCreate={handleCreateAssignment}
          />
        </div>

        <div className="grid gridCards">
          {isLoadingAssignments && (
            <div className={styles.message}>Cargando asignaciones...</div>
          )}

          {assignmentsError && (
            <div className={styles.errorMessage}>
              Error al cargar las asignaciones
            </div>
          )}

          {assignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              currentTimestamp={currentTimestamp}
              isEnding={isEnding}
              onEnd={handleOpenEndModal}
            />
          ))}

          {!isLoadingAssignments &&
            !assignmentsError &&
            assignments.length === 0 && (
              <div className={styles.message}>
                No hay asignaciones registradas.
              </div>
            )}
        </div>
        {assignmentToEnd && (
          <EndAssignmentModal
            assignment={assignmentToEnd}
            isEnding={isEnding}
            onClose={handleCloseEndModal}
            onConfirm={handleEndAssignment}
          />
        )}
      </section>
    </>
  );
}
