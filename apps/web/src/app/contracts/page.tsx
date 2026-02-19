'use client';

import { useMemo, useState } from "react";
import styles from './contracts.module.css';
import { toast } from 'sonner';

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

import { useGetContractsQuery, useCreateContractMutation, useToggleContractMutation } from "@/store/api";

export default function ContractsPage() {
    const { data, isLoading, error } = useGetContractsQuery();
    const [createContract, { isLoading: isCreating }] = useCreateContractMutation();
    const [toggleContract, { isLoading: isToggling }] = useToggleContractMutation();
    
    const [name, setName] = useState('');
    const [q, setQ] = useState('');

    const filtered = useMemo(() => {
        const list = data ?? [];
        const s = q.trim().toLowerCase();

        if (!s) return list;

        return list.filter(c => c.name?.toLowerCase().includes(s));
    }, [data, q])

    async function onCreate() {
        const v = name.trim();

        if (!v) return;

        try {
            await createContract({ name: v }).unwrap();
            setName('');
        } catch (err:any) {
            alert(err?.data?.message ?? 'Error al crear contrato');
        }
    }

    async function onToggle(id: string) {
        const toastId = toast.loading('Actualizando estatus...');

        try {
            await toggleContract(id).unwrap();
            toast.success('Estatus actualizado', { id: toastId });
        } catch (err:any) {
            toast.error(err?.data?.message ?? 'Error al actualizar estatus', { id: toastId });
        }
    }

    return (
        <>
        <div className="pageHead">
            <div>
                <h1 className="h1">Contratos</h1>
                <p className="pMuted">Gestion de contatos y estatus operativo en LozCorp.</p>
            </div>
            <Badge tone="info">{ filtered.length } registros</Badge>
        </div>

        <section className="panel">
            <div className="toolbar">
                <div className={styles.toolbarGrid} style={{ width: '100%'}}>
                    <div className={styles.createRow}>
                        <div>
                            <div className={styles.fieldLabel}>Nombre *</div>
                            <Input
                            value={ name }
                            onChange={(e) => 
                                setName(e.target.value)
                            }
                            placeholder="Ej. Hacienda del Rosario"
                            />
                        </div>
                        <Button 
                            className={styles.addBtn}
                            disabled={isCreating}
                            onClick={onCreate}>
                                {isCreating ? 'Guardando...' : 'Agregar'}
                        </Button>
                    </div>

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

                {filtered.map((c:any) => (
                    <Card key={c.id}>
                        <div className={styles.cardTop}>
                            <div>
                                <div className={styles.cardTitle}> { c.name }</div>
                                <div className={styles.cardSub}>
                                    ID: { c.id }
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
                            <Button>
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
        </>
    );
}