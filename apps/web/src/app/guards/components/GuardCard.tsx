import type { Guard } from '@segapp/contracts';

import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

import { formatGuardDate } from '../guard.utils';

import styles from './GuardCard.module.css';

type GuardCardProps = {
  guard: Guard;
  isUpdatingStatus: boolean;
  onView: (guard: Guard) => void;
  onEdit: (guard: Guard) => void;
  onToggleActive: (guard: Guard) => void;
};

export default function GuardCard({
  guard,
  isUpdatingStatus,
  onView,
  onEdit,
  onToggleActive,
}: GuardCardProps) {
  function handleView() {
    onView(guard);
  }

  function handleEdit() {
    onEdit(guard);
  }

  function handleToggleActive() {
    if (isUpdatingStatus) return;

    onToggleActive(guard);
  }
  return (
    <Card>
      <div className={styles.cardTop}>
        <div>
          <div className={styles.cardTitle}>{guard.fullName}</div>
          <div className={styles.cardSub}>
            No. Empleado:{' '}
            <span className={styles.employeeNumber}>
              {guard.employeeNumber}
            </span>
          </div>
        </div>

        <Badge
          tone={guard.active ? 'ok' : 'warn'}
          onClick={handleToggleActive}
          className={styles.badgeBtn}
          aria-disabled={isUpdatingStatus}
          title="Click para cambiar status"
        >
          {guard.active ? 'Activo' : 'Inactivo'}
        </Badge>
      </div>

      <div className={styles.metaRow}>
        <div>
          <div className={styles.metaLabel}>Contratación</div>
          <div className={styles.metaValue}>
            {guard.hiredAt ? formatGuardDate(guard.hiredAt) : '-'}
          </div>
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
