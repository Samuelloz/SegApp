import type { Contract } from '@segapp/contracts';

import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

import { formatContractDate } from '../contract.utils';

import styles from './ContractCard.module.css';

type ContractCardProps = {
  contract: Contract;
  isUpdatingStatus: boolean;
  canChangeStatus: boolean;
  onView: (contract: Contract) => void;
  onEdit: (contract: Contract) => void;
  onToggleActive: (contract: Contract) => void;
};

export default function ContractCard({
  contract,
  isUpdatingStatus,
  canChangeStatus,
  onView,
  onEdit,
  onToggleActive,
}: ContractCardProps) {
  function handleView() {
    onView(contract);
  }

  function handleEdit() {
    onEdit(contract);
  }

  function handleToggleActive() {
    if (isUpdatingStatus) return;

    onToggleActive(contract);
  }

  return (
    <Card>
      <div className={styles.cardTop}>
        <div>
          <div className={styles.cardTitle}>{contract.name}</div>

          <div className={styles.cardSub}>
            Cliente:{' '}
            <span className={styles.clientLegalName}>
              {contract.clientLegalName}
            </span>
          </div>

          <div className={styles.cardSub}>RFC: {contract.clientRfc}</div>
        </div>

        <Badge
          tone={contract.active ? 'ok' : 'warn'}
          onClick={canChangeStatus ? handleToggleActive : undefined}
          className={canChangeStatus ? styles.badgeBtn : undefined}
          aria-disabled={canChangeStatus && isUpdatingStatus}
          title={canChangeStatus ? 'Clic para cambiar estatus' : undefined}
        >
          {contract.active ? 'Activo' : 'Inactivo'}
        </Badge>
      </div>

      <div className={styles.metaRow}>
        <div>
          <div className={styles.metaLabel}>Fecha inicio:</div>
          <div className={styles.metaValue}>
            {formatContractDate(contract.startDate)}
          </div>
        </div>

        <div>
          <div className={styles.metaLabel}>Fecha finalización:</div>
          <div className={styles.metaValue}>
            {contract.endDate
              ? formatContractDate(contract.endDate)
              : 'Sin fecha definida'}
          </div>
        </div>

        <div>
          <div className={styles.metaLabel}>Guardias requeridos</div>
          <div className={styles.metaValue}>{contract.requiredGuardCount}</div>
        </div>
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={handleView}>
          Ver Detalles
        </Button>

        <Button type="button" onClick={handleEdit}>
          Editar
        </Button>
      </div>
    </Card>
  );
}
