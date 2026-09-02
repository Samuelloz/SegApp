import type { GuardAssignment } from '@segapp/contracts';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

import {
  formatAssignmentDate,
  getAssignmentStatus,
  getAssignmentStatusLabel,
  getAssignmentStatusTone,
} from '../assignment.utils';

import styles from './AssignmentCard.module.css';

type AssignmentCardProps = {
  assignment: GuardAssignment;
  currentTimestamp: number;
  isEnding: boolean;
  onEnd: (assignment: GuardAssignment) => void;
};

export default function AssignmentCard({
  assignment,
  currentTimestamp,
  isEnding,
  onEnd,
}: AssignmentCardProps) {
  const status = getAssignmentStatus(assignment, currentTimestamp);

  function handleEndClick() {
    onEnd(assignment);
  }

  return (
    <Card>
      <div className={styles.cardTop}>
        <div>
          <div className={styles.guardName}>{assignment.guard.fullname}</div>

          <div className={styles.employeeNumber}>
            No. de empleado: {assignment.guard.employeeNumber}
          </div>
        </div>

        <Badge tone={getAssignmentStatusTone(status)}>
          {getAssignmentStatusLabel(status)}
        </Badge>
      </div>

      <div className={styles.contractName}>{assignment.contract.name}</div>

      <div className={styles.metaGrid}>
        <div>
          <div className={styles.metaLabel}>Inicio</div>

          <div className={styles.metaValue}>
            {formatAssignmentDate(assignment.startedAt)}
          </div>
        </div>

        <div>
          <div className={styles.metaLabel}>Finalización</div>

          <div className={styles.metaValue}>
            {assignment.endedAt
              ? formatAssignmentDate(assignment.endedAt)
              : '-'}
          </div>
        </div>
      </div>

      {status === 'active' && (
        <div className={styles.actions}>
          <Button
            type="button"
            variant="danger"
            disabled={isEnding}
            onClick={handleEndClick}
          >
            {isEnding ? 'Finalizando...' : 'Finalizar'}
          </Button>
        </div>
      )}
    </Card>
  );
}
