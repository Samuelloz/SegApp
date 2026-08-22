'use client';

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import styles from './contracts.module.css';
import { toast } from 'sonner';

import {
    contractSchema,
    type ContractFormValues
} from './contract.schema';

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";

import {
    type Contract,
    useGetContractsQuery,
    useCreateContractMutation,
    useUpdateContractMutation,
    useToggleContractMutation
} from "@/store/api";

function getApiErrorMessage(error: unknown, fallback: string): string {
    if (typeof error !== 'object' || error === null || !('data' in error)) {
        return fallback;
    }

    const data = error.data;

    if (
        typeof data !== 'object' ||
        data === null ||
        !('message' in data) ||
        typeof data.message !== 'string'
    ) {
        return fallback;
    }

    return data.message;
}

export default function ContractsPage() {
    const { data, isLoading, error } = useGetContractsQuery();
    const [createContract, { isLoading: isCreating }] = useCreateContractMutation();
    const [updateContract, { isLoading: isUpdating }] = useUpdateContractMutation();
    const [toggleContract] = useToggleContractMutation();

    const {
        register: registerCreate,
        handleSubmit: handleCreateSubmit,
        reset: resetCreate,
        formState: { errors: createErrors },
    } = useForm<ContractFormValues>({
        resolver: zodResolver(contractSchema),
        defaultValues: {
            name: '',
        }
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
    } = useForm<ContractFormValues>({
        resolver: zodResolver(contractSchema),
        mode: 'onChange',
        defaultValues: {
            name: ''
        },
    });

    const editValues = useWatch({
        control: editControl,
    });

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [editOriginal, setEditOriginal] = useState<Contract | null>(null);

    const [q, setQ] = useState('');

    const filtered = useMemo(() => {
        const list = data ?? [];
        const s = q.trim().toLowerCase();

        if (!s) return list;

        return list.filter(c => c.name?.toLowerCase().includes(s));
    }, [data, q])

    async function onCreate(values: ContractFormValues) {
        const toastId = toast.loading('Creando contrato...');

        try {
            await createContract({
                name: values.name
            }).unwrap();

            toast.success('Contrato creado', { id: toastId });
            resetCreate();
        } catch (error: unknown) {
            toast.error(
                getApiErrorMessage(
                    error,
                    'Error al crear contrato'
                ),
                { id: toastId }
            );
        }
    }

    async function onToggle(id: string) {
        const toastId = toast.loading('Actualizando estatus...');

        try {
            await toggleContract(id).unwrap();
            toast.success('Estatus actualizado', { id: toastId });
        } catch (err: unknown) {
            toast.error(
                getApiErrorMessage(
                    err,
                    'Error al actualizar el contrato'
                ),
                { id: toastId }
            )
        }
    }

    function openEdit(contract: Contract) {
        setEditId(contract.id);
        setEditOriginal(contract);

        resetEdit({
            name: contract.name
        });

        setIsEditOpen(true);
    }

    const hasEditChanges = useMemo(() => {
        if (!editOriginal || !isEditDirty) return false;

        const parsed = contractSchema.safeParse(editValues);

        if (!parsed.success) return false;

        return (
            parsed.data.name !== editOriginal.name.trim()
        );
    }, [editOriginal, editValues, isEditDirty]);

    function closeEdit() {
        setIsEditOpen(false);
        setEditId(null);
        setEditOriginal(null);

        resetEdit({
            name: ''
        });
    }

    async function onSaveEdit(values: ContractFormValues) {
        if (!editId) return;

        const toastId = toast.loading('Guardando cambios...');

        try {
            await updateContract({
                id: editId,
                body: {
                    name: values.name
                },
            }).unwrap();

            toast.success('Contrato actualizado', {
                id: toastId
            });

            closeEdit();
        } catch (err: unknown) {
            toast.error(
                getApiErrorMessage(
                    err,
                    'Error al actualizar el contrato.',
                ),
                { id: toastId }
            );
        }
    }

    return (
        <>
            <div className="pageHead">
                <div>
                    <h1 className="h1">Contratos</h1>
                    <p className="pMuted">Gestión de contratos y estatus operativo en LozCorp.</p>
                </div>
                <Badge tone="info">{filtered.length} registros</Badge>
            </div>

            <section className="panel">
                <div className="toolbar">
                    <div className={styles.toolbarGrid} style={{ width: '100%' }}>
                        <form
                            className={styles.createRow}
                            onSubmit={handleCreateSubmit(onCreate)}
                            noValidate>
                            <div>
                                <div className={styles.fieldLabel}>
                                    Nombre Contrato *
                                </div>

                                <Input
                                    {...registerCreate('name')}
                                    aria-invalid={Boolean(createErrors.name)}
                                    placeholder="Ej. Hacienda del Rosario"
                                />

                                {createErrors.name && (
                                    <div className={styles.fieldError}>
                                        {createErrors.name.message}
                                    </div>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className={styles.addBtn}
                                disabled={isCreating}>
                                {isCreating ? 'Guardando...' : 'Agregar'}
                            </Button>
                        </form>

                        <div className={styles.searchRow}>
                            <div>
                                <div className={styles.fieldLabel}>
                                    Buscar
                                </div>
                                <Input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Buscar por Nombre"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gridCards">
                    {isLoading && <div className={styles.textMuted}> Cargando Contratos... </div>}
                    {error && <div className={styles.textDanger}> Error al cargar contratos. </div>}

                    {filtered.map((c) => (
                        <Card key={c.id}>
                            <div className={styles.cardTop}>
                                <div>
                                    <div className={styles.cardTitle}> {c.name}</div>
                                    <div className={styles.cardSub}>
                                        ID: {c.id}
                                    </div>
                                </div>
                                <Badge tone={c.active === false ? 'warn' : 'ok'}
                                    onClick={() => onToggle(c.id)}
                                    className={styles.badgeBtn}
                                    title="Click para cambiar status">
                                    {c.active === false ? 'Inactivo' : 'Activo'}
                                </Badge>
                            </div>

                            <div className={styles.metaRow}>
                                <div>
                                    <div className={styles.metaLabel}>Alta</div>
                                    <div className={styles.metaValue}>
                                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}
                                    </div>
                                </div>

                                <div className={styles.metaRight}>
                                    <div className={styles.metaLabel}>Actualización</div>
                                    <div className={styles.metaValue}>
                                        {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : '-'}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.actions}>
                                <Button variant="ghost">Ver</Button>
                                <Button onClick={() => openEdit(c)}>
                                    Editar
                                </Button>
                            </div>
                        </Card>
                    ))}

                    {!isLoading && !error && filtered.length === 0 && (
                        <div className={styles.textMuted}>No hay resultados.</div>
                    )}
                </div>
            </section>
            <Modal
                open={isEditOpen}
                title="Editar Contrato"
                onClose={closeEdit}>
                <form
                    className={styles.formContract}
                    onSubmit={handleEditSubmit(onSaveEdit)}
                    noValidate>
                    <div>
                        <div className={styles.fieldLabel}>
                            Nombre del Contrato *
                        </div>

                        <Input
                            {...registerEdit('name')}
                            aria-invalid={Boolean(editErrors.name)}
                        />

                        {editErrors.name && (
                            <div className={styles.fieldError}>
                                {editErrors.name.message}
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
                            }>
                            {isUpdating ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </div>
                </form>

            </Modal>
        </>
    );
}
