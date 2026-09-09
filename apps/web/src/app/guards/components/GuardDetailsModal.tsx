'use client';
import type { Guard } from '@segapp/contracts';

import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

import {
  formatGuardDate,
  calculateGuardAge,
  getGuardAddress,
} from '../guard.utils';

import styles from './GuardDetailsModal.module.css';

type GuardDetailsModalProps = {
  guard: Guard | null;
  open: boolean;
  onClose: () => void;
};

export default function GuardDetailsModal({
  guard,
  open,
  onClose,
}: GuardDetailsModalProps) {
  if (!guard) return null;

  const age = calculateGuardAge(guard.birthDate);
  const address = getGuardAddress(guard);

  function handleClose() {
    onClose();
  }

  return (
    <Modal open={open} title="Detalles del guardia" onClose={onClose}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.guardName}>{guard.fullName}</h3>
            <div className={styles.employeeNumber}>
              No. de empleado: {guard.employeeNumber}
            </div>
          </div>

          <Badge tone={guard.active ? 'ok' : 'warn'}>
            {guard.active ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>

        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Información personal</h4>

          <dl className={styles.detailsGrid}>
            <div className={styles.detail}>
              <dt className={styles.label}>Nombre del padre</dt>
              <dd className={styles.value}>{guard.fatherFullName}</dd>
            </div>

            <div className={styles.detail}>
              <dt className={styles.label}>Nombre de la madre</dt>
              <dd className={styles.value}>{guard.motherFullName}</dd>
            </div>

            <div className={styles.detail}>
              <dt className={styles.label}>Fecha de nacimiento</dt>
              <dd className={styles.value}>
                {formatGuardDate(guard.birthDate)}
              </dd>
            </div>

            <div className={styles.detail}>
              <dt className={styles.label}>Edad</dt>
              <dd className={styles.value}>
                {age !== null ? `${age} años` : '-'}
              </dd>
            </div>

            <div className={styles.detail}>
              <dt className={styles.label}>Lugar de nacimiento</dt>
              <dd className={styles.value}>{guard.birthPlace}</dd>
            </div>

            <div className={styles.detail}>
              <dt className={styles.label}>Fecha de contratación</dt>
              <dd className={styles.value}>{formatGuardDate(guard.hiredAt)}</dd>
            </div>
          </dl>
        </section>

        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Identificación y contacto</h4>

          <dl className={styles.detailsGrid}>
            <div className={styles.detail}>
              <dt className={styles.label}>Teléfono</dt>
              <dd className={styles.value}>{guard.phone || '-'}</dd>
            </div>

            <div className={styles.detail}>
              <dt className={styles.label}>RFC</dt>
              <dd className={styles.value}>{guard.rfc}</dd>
            </div>

            <div className={styles.detail}>
              <dt className={styles.label}>CURP</dt>
              <dd className={styles.value}>{guard.curp}</dd>
            </div>

            <div className={styles.detail}>
              <dt className={styles.label}>NSS</dt>
              <dd className={styles.value}>{guard.nss}</dd>
            </div>
          </dl>
        </section>

        {address && (
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Dirección</h4>
            <p className={styles.address}>{address}</p>
          </section>
        )}

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
