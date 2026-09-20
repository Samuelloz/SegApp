'use client';

import { type ChangeEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { Guard, GuardFormValues } from '@segapp/contracts';

import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
import {
  useGetGuardsQuery,
  useCreateGuardMutation,
  useUpdateGuardMutation,
  useUpdateGuardStatusMutation,
} from '@/store/api';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

import GuardCard from './components/GuardCard';
import GuardDetailsModal from './components/GuardDetailsModal';
import GuardFormModal from './components/GuardFormModal';

import {
  getEmptyGuardFormValues,
  guardToFormValues,
  matchesGuardSearch,
} from './guard.utils';

import styles from './guards.module.css';

const EMPTY_GUARD_FORM_VALUES = getEmptyGuardFormValues();

export default function GuardsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [guardToEdit, setGuardToEdit] = useState<Guard | null>(null);
  const [guardToView, setGuardToView] = useState<Guard | null>(null);
  const [searchValue, setSearchValue] = useState('');

  const {
    data: guards,
    isLoading: isLoadingGuards,
    error: guardsError,
  } = useGetGuardsQuery();
  const [createGuard, { isLoading: isCreating }] = useCreateGuardMutation();
  const [updateGuard, { isLoading: isUpdating }] = useUpdateGuardMutation();
  const [updateGuardStatus, { isLoading: isUpdatingStatus }] =
    useUpdateGuardStatusMutation();

  const editInitialValues = useMemo(
    () =>
      guardToEdit ? guardToFormValues(guardToEdit) : EMPTY_GUARD_FORM_VALUES,
    [guardToEdit],
  );

  const filteredGuards = useMemo(
    () =>
      (guards ?? []).filter((guard) => matchesGuardSearch(guard, searchValue)),
    [guards, searchValue],
  );

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    setSearchValue(event.target.value);
  }

  function handleOpenCreate() {
    setIsCreateOpen(true);
  }

  function handleCloseCreate() {
    if (isCreating) return;

    setIsCreateOpen(false);
  }

  function handleOpenEdit(guard: Guard) {
    setGuardToEdit(guard);
  }

  function handleCloseEdit() {
    if (isUpdating) return;

    setGuardToEdit(null);
  }

  function handleOpenDetails(guard: Guard) {
    setGuardToView(guard);
  }

  function handleCloseDetails() {
    setGuardToView(null);
  }

  async function handleCreateGuard(values: GuardFormValues): Promise<boolean> {
    const toastId = toast.loading('Creando guardia...');

    try {
      await createGuard(values).unwrap();

      toast.success('Guardia creado', { id: toastId });
      setIsCreateOpen(false);

      return true;
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Error al crear guardia'), {
        id: toastId,
      });

      return false;
    }
  }

  async function handleUpdateGuard(values: GuardFormValues): Promise<boolean> {
    if (!guardToEdit) return false;

    const toastId = toast.loading('Guardando cambios...');

    try {
      await updateGuard({
        id: guardToEdit.id,
        body: values,
      }).unwrap();

      toast.success('Guardia actualizado', {
        id: toastId,
      });

      setGuardToEdit(null);

      return true;
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Error al actualizar guardia'), {
        id: toastId,
      });

      return false;
    }
  }

  async function handleToggleActive(guard: Guard) {
    if (isUpdatingStatus) return;

    const toastId = toast.loading('Actualizando status...');

    const body = {
      id: guard.id,
      body: {
        active: !guard.active,
      },
    };

    try {
      await updateGuardStatus(body).unwrap();
      toast.success('Estatus actualizado', { id: toastId });
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Error al actualizar guardia'), {
        id: toastId,
      });
    }
  }

  return (
    <>
      <div className="pageHead">
        <div>
          <h1 className="h1">Guardias</h1>
          <p className="pMuted">
            Control del personal operativo de seguridad en LozCorp.
          </p>
        </div>
        <Badge tone="info">{filteredGuards.length} guardias</Badge>
      </div>

      <section className="panel">
        {/* Toolbar: buscar + crear */}
        <div className="toolbar">
          <div className={styles.toolbarGrid}>
            <div className={styles.searchRow}>
              <div>
                <div className={styles.fieldLabel}>Buscar</div>
                <Input
                  value={searchValue}
                  onChange={handleSearchChange}
                  placeholder="Buscar guardias..."
                />
              </div>
            </div>

            <Button type="button" onClick={handleOpenCreate}>
              Agregar guardia
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="grid gridCards">
          {isLoadingGuards && (
            <div className={styles.textMuted}>Cargando guardias...</div>
          )}

          {guardsError && (
            <div className={styles.textDanger}>Error al cargar guardias.</div>
          )}

          {filteredGuards.map((guard) => (
            <GuardCard
              key={guard.id}
              guard={guard}
              isUpdatingStatus={isUpdatingStatus}
              onView={handleOpenDetails}
              onEdit={handleOpenEdit}
              onToggleActive={handleToggleActive}
            />
          ))}

          {!isLoadingGuards && !guardsError && filteredGuards.length === 0 && (
            <div className={styles.textMuted}>No hay resultados</div>
          )}
        </div>
      </section>
      <GuardFormModal
        open={isCreateOpen}
        title="Agregar guardia"
        initialValues={EMPTY_GUARD_FORM_VALUES}
        isSubmitting={isCreating}
        submitLabel="Agregar"
        disabledWhenPristine={false}
        onSubmit={handleCreateGuard}
        onClose={handleCloseCreate}
      />

      <GuardFormModal
        open={guardToEdit !== null}
        title="Editar guardia"
        initialValues={editInitialValues}
        isSubmitting={isUpdating}
        submitLabel="Actualizar"
        disabledWhenPristine
        onSubmit={handleUpdateGuard}
        onClose={handleCloseEdit}
      />

      <GuardDetailsModal
        guard={guardToView}
        open={guardToView !== null}
        onClose={handleCloseDetails}
      />
    </>
  );
}
