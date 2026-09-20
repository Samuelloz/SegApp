import type { Contract } from '@segapp/contracts';

import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

import { formatContractDate, getContractAddress } from '../contract.utils';

import styles from './ContractDetailsModal.module.css';

type ContractDetailsModalProps = {
  contract: Contract | null;
  open: boolean;
  onClose: () => void;
};

export default function ContractDetailsModal({
  contract,
  open,
  onClose,
}: ContractDetailsModalProps) {
  if (!contract) return null;

  const address = getContractAddress(contract);

  function handleClose() {
    onClose();
  }

  return (
    <Modal open={open} title="Detalles del contrato" onClose={onClose}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.contractName}>{contract.name}</h3>
            <div className={styles.clientLegalName}>
              Cliente: {contract.clientLegalName}
            </div>
          </div>

          <Badge tone={contract.active ? 'ok' : 'warn'}>
            {contract.active ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>

        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Información de contrato</h4>

          <dl className={styles.detailsGrid}>
            <div className={styles.detail}>
              <dt className={styles.label}>RFC</dt>
              <dd className={styles.value}>{contract.clientRfc}</dd>
            </div>

            <div className={styles.detail}>
              <dt className={styles.label}>Fecha inicio</dt>
              <dd className={styles.value}>
                {formatContractDate(contract.startDate)}
              </dd>
            </div>

            <div className={styles.detail}>
              <dt className={styles.label}>Fecha finalización</dt>
              <dd className={styles.value}>
                {contract.endDate
                  ? formatContractDate(contract.endDate)
                  : 'Sin fecha definida'}
              </dd>
            </div>

            <div className={styles.detail}>
              <dt className={styles.label}>Guardias requeridos</dt>
              <dd className={styles.value}>{contract.requiredGuardCount}</dd>
            </div>
          </dl>
        </section>

        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Información del contacto</h4>

          <dl className={styles.detailsGrid}>
            <div className={styles.detail}>
              <dt className={styles.label}>Nombre</dt>
              <dd className={styles.value}>{contract.contactName}</dd>
            </div>

            <div className={styles.detail}>
              <dt className={styles.label}>Teléfono</dt>
              <dd className={styles.value}>{contract.contactPhone}</dd>
            </div>

            <div className={styles.detail}>
              <dt className={styles.label}>Correo electrónico</dt>
              <dd className={styles.value}>{contract.contactEmail || '-'}</dd>
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
