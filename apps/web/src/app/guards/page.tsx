'use client';

import { useMemo, useState } from "react";
import styles from './guards.module.css';
import { toast } from 'sonner';

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

import { useCreateGuardMutation, useGetGuardsQuery, useToggleGuardMutation } from "@/store/api";

export default function GuardsPage() {
    const { data, isLoading, error} = useGetGuardsQuery();
    const [createGuard, { isLoading: isCreating }] = useCreateGuardMutation();
    const [toggleGuard, { isLoading: isToggling }] = useToggleGuardMutation();

    const [fullname, setFullName] = useState('');
    const [employeeNumber, setEmployeeNumber] =  useState('');
    const [phone, setPhone] = useState('');
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

    async function onCreate() {
        const f = fullname.trim();
        const e = employeeNumber.trim();
        const p = phone.trim();

        if (!f || !e) {
            toast.error('Nombre y número de empleado son requeridos');
            return;
        }

        const toastId = toast.loading('Creando guardia...');

        try {
            await createGuard({
                fullname: f,
                employeeNumber: e,
                phone: p || undefined,
            }).unwrap();

            toast.success('Guardia creado', { id: toastId });
            
            setFullName('');
            setEmployeeNumber('');
            setPhone('');
        } catch (err: any) {
            toast.error('Error al crear guardia', { id: toastId });
        }
    }

    async function onToggle(id: string) {
        const toastId = toast.loading('Actualizando status...');

        try {
            await toggleGuard(id).unwrap();
            toast.success('Estatus actualizado', { id: toastId });
        } catch (err: any) {
            toast.error(err?.data?.message ?? 'Error al actualizar guardia', { id: toastId });
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
                    <div className={styles.createRow}>
                        <div>
                            <div className={styles.fieldLabel}>Nombre Completo *</div>
                            <Input 
                                value={ fullname }
                                onChange={ (e) => {
                                    setFullName(e.target.value)
                                }}
                                placeholder="Ej. José Antonio Ramírez"
                            />
                        </div>

                        <div>
                            <div className={styles.fieldLabel}>No. Empleado *</div>
                            <Input 
                                value={ employeeNumber }
                                onChange={(e) => setEmployeeNumber(e.target.value)}
                                placeholder="Ej. 000123"
                            />
                        </div>

                        <div>
                            <div className={styles.fieldLabel}>Teléfono</div>
                            <Input 
                                value={ phone }
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Ej. 8712456535"
                            />
                        </div>

                        <Button className={styles.addBtn} 
                                onClick={onCreate} 
                                disabled={isCreating}>
                            {isCreating ? 'Guardando...' : 'Agregar'}
                        </Button>
                    </div>

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

                {( filtered ?? []).map((g) => (
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
                            <Button>Editar</Button>
                        </div>
                    </Card>
                ))}

                {!isLoading && !error && filtered.length === 0 && (
                    <div className={styles.textMuted}> No hay resultados</div>
                )}
            </div>
        </section>
        </>
    )
}