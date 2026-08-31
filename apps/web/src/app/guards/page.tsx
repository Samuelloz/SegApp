'use client';

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from 'sonner';

import styles from './guards.module.css';
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

import {
  guardFormSchema,
  type Guard,
  type GuardFormValues,
} from '@segapp/contracts';

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";

import {
  useCreateGuardMutation,
  useGetGuardsQuery,
  useToggleGuardMutation,
  useUpdateGuardMutation
} from "@/store/api";

export default function GuardsPage() {
  const { data, isLoading, error } = useGetGuardsQuery();
  const [createGuard, { isLoading: isCreating }] = useCreateGuardMutation();
  const [toggleGuard] = useToggleGuardMutation();
  const [updateGuard, { isLoading: isUpdating }] = useUpdateGuardMutation();

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm<GuardFormValues>({
    resolver: zodResolver(guardFormSchema),
    defaultValues: {
      fullname: '',
      employeeNumber: '',
      phone: '',
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    control: editControl,
    formState: {
      errors: editErrors,
      isDirty: isEditDirty,
    },
  } = useForm<GuardFormValues>({
    resolver: zodResolver(guardFormSchema),
    mode: 'onChange',
    defaultValues: {
      fullname: '',
      employeeNumber: '',
      phone: '',
    },
  });

  const editValues = useWatch({
    control: editControl,
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editOriginal, setEditOriginal] = useState<Guard | null>(null);

  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const list = data ?? [];
    const s = q.trim().toLowerCase();
    if (!s) return list;

    return list.filter((g) => {
      return (
        g.fullname?.toLowerCase().includes(s) ||
        g.employeeNumber?.toLowerCase().includes(s) ||
        (g.phone ?? '').toLowerCase().includes(s)
      );
    });
  }, [data, q]);

  async function onCreate(values: GuardFormValues) {
    const toastId = toast.loading('Creando guardia...');

    try {
      await createGuard(values).unwrap();

      toast.success('Guardia creado', { id: toastId });
      resetCreate();
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(
          error,
          'Error al crear guardia'
        ),
        { id: toastId }
      );
    }
  }

  async function onToggle(id: string) {
    const toastId = toast.loading('Actualizando status...');

    try {
      await toggleGuard(id).unwrap();
      toast.success('Estatus actualizado', { id: toastId });
    } catch (err: unknown) {
      toast.error(
        getApiErrorMessage(
          err,
          'Error al actualizar guardia'
        ),
        { id: toastId }
      )
    }
  }

  function openEdit(guard: Guard) {
    setEditId(guard.id);
    setEditOriginal(guard);

    resetEdit({
      fullname: guard.fullname,
      employeeNumber: guard.employeeNumber,
      phone: guard.phone ?? '',
    })

    setIsEditOpen(true);
  }

  const hasEditChanges = useMemo(() => {
    if (!editOriginal || !isEditDirty) return false;

    const parsed = guardFormSchema.safeParse(editValues);

    if (!parsed.success) return false;

    return (
      parsed.data.fullname !== editOriginal.fullname.trim() ||
      parsed.data.employeeNumber !== editOriginal.employeeNumber.trim() ||
      parsed.data.phone !== (editOriginal.phone ?? '').trim()
    );
  }, [editOriginal, editValues, isEditDirty]);

  function closeEdit() {
    setIsEditOpen(false);
    setEditId(null);
    setEditOriginal(null);

    resetEdit({
      fullname: '',
      employeeNumber: '',
      phone: '',
    });
  }

  async function onSaveEdit(values: GuardFormValues) {
    if (!editId) return;

    const toastId = toast.loading('Guardando cambios...');

    try {
      await updateGuard({
        id: editId,
        body: values,
      }).unwrap();

      toast.success('Guardia actualizado', {
        id: toastId
      });

      closeEdit();
    } catch (err: unknown) {
      toast.error(
        getApiErrorMessage(
          err,
          'Error al actualizar guardia',
        ),
        { id: toastId }
      );
    }
  }

  return (
    <>
      <div className="pageHead">
        <div>
          <h1 className="h1">Guardias</h1>
          <p className="pMuted">Control del personal operativo de seguridad en LozCorp.</p>
        </div>
        <Badge tone="info">{filtered.length} guardias</Badge>
      </div>

      <section className="panel">
        {/* Toolbar: crear + buscar */}
        <div className="toolbar">
          <div className={styles.toolbarGrid}>
            <form
              className={styles.createRow}
              onSubmit={handleCreateSubmit(onCreate)}
              noValidate>
              <div>
                <div className={styles.fieldLabel}>
                  Nombre Completo *
                </div>

                <Input
                  {...registerCreate('fullname')}
                  aria-invalid={Boolean(createErrors.fullname)}
                  placeholder="Ej. José Antonio Ramírez"
                />

                {createErrors.fullname && (
                  <div className={styles.fieldError}>
                    {createErrors.fullname.message}
                  </div>
                )}
              </div>

              <div>
                <div className={styles.fieldLabel}>
                  No. de Empleado *
                </div>

                <Input
                  {...registerCreate('employeeNumber')}
                  aria-invalid={Boolean(createErrors.employeeNumber)}
                  placeholder="Ej. 123456"
                />

                {createErrors.employeeNumber && (
                  <div className={styles.fieldError}>
                    {createErrors.employeeNumber.message}
                  </div>
                )}
              </div>

              <div>
                <div className={styles.fieldLabel}>
                  Teléfono
                </div>

                <Input
                  {...registerCreate('phone')}
                  aria-invalid={Boolean(createErrors.phone)}
                  placeholder="Ej. 8711786592"
                />

                {createErrors.phone && (
                  <div className={styles.fieldError}>
                    {createErrors.phone.message}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className={styles.addBtn}
                disabled={isCreating}
              >
                {isCreating ? 'Guardando...' : 'Agregar'}
              </Button>
            </form>

            <div className={styles.searchRow}>
              <div>
                <div className={styles.fieldLabel}>Buscar</div>
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por nombre, número o telefono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid gridCards">
          {isLoading && (
            <div className={styles.textMuted}>
              Cargando Guardias...
            </div>
          )}

          {error && (
            <div className={styles.textDanger}>
              Error al cargar guardias.
            </div>
          )}

          {(filtered ?? []).map((g) => (
            <Card key={g.id}>
              <div className={styles.cardTop}>
                <div>
                  <div className={styles.cardTitle}>{g.fullname}</div>
                  <div className={styles.cardSub}>
                    No. empleado: <span className={styles.employeeNumber}> {" "}{g.employeeNumber}</span>
                  </div>
                </div>

                <Badge tone={g.active === false ? 'warn' : 'ok'}
                  onClick={() => onToggle(g.id)}
                  className={styles.badgeBtn}
                  title="Click para cambiar status">
                  {g.active === false ? 'Inactivo' : 'Activo'}
                </Badge>
              </div>

              <div className={styles.metaRow}>
                <div>
                  <div className={styles.metaLabel}>
                    Alta
                  </div>
                  <div className={styles.metaValue}>
                    {g.createdAt ? new Date(g.createdAt).toLocaleDateString() : '-'}
                  </div>
                </div>
              </div>

              <div className={styles.actions}>
                <Button variant="ghost">Ver</Button>
                <Button onClick={() => openEdit(g)}>
                  Editar
                </Button>
              </div>
            </Card>
          ))}

          {!isLoading && !error && filtered.length === 0 && (
            <div className={styles.textMuted}> No hay resultados</div>
          )}
        </div>
      </section>
      <Modal
        open={isEditOpen}
        title="Editar Guardia"
        onClose={closeEdit}>
        <form
          className={styles.formGrid}
          onSubmit={handleEditSubmit(onSaveEdit)}
          noValidate>
          <div>
            <div className={styles.fieldLabel}>
              Nombre Completo *
            </div>

            <Input
              {...registerEdit('fullname')}
              aria-invalid={Boolean(editErrors.fullname)}
            />

            {editErrors.fullname && (
              <div className={styles.fieldError}>
                {editErrors.fullname.message}
              </div>
            )}
          </div>

          <div>
            <div className={styles.fieldLabel}>
              No. Empleado *
            </div>

            <Input
              {...registerEdit('employeeNumber')}
              aria-invalid={Boolean(editErrors.employeeNumber)}
            />

            {editErrors.employeeNumber && (
              <div className={styles.fieldError}>
                {editErrors.employeeNumber.message}
              </div>
            )}
          </div>

          <div>
            <div className={styles.fieldLabel}>
              Teléfono
            </div>

            <Input
              {...registerEdit('phone')}
              aria-invalid={Boolean(editErrors.phone)}
            />

            {editErrors.phone && (
              <div className={styles.fieldError}>
                {editErrors.phone.message}
              </div>
            )}
          </div>

          <div className={styles.modalActions}>
            <Button
              type="button"
              variant="ghost"
              onClick={closeEdit}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={
                isUpdating ||
                !isEditDirty ||
                !hasEditChanges
              }
            >
              {isUpdating ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}