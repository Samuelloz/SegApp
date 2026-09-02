'use client';

import type { GuardAssignment } from '@segapp/contracts';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

import styles from './EndAssignmentModal.module.css';

type EndAssignmentModalProps = {
  assignment: GuardAssignment;
  isEnding: boolean;
  onClose: () => void;
  onConfirm: (assignmentId: string) => Promise<void>;
};

export default function EndAssignmentModal({
  assignment,
  isEnding,
  onClose,
  onConfirm,
}: EndAssignmentModalProps) {
  function handleConfirm() {
    void onConfirm(assignment.id);
  }

  return (
    <Modal open title="Finalizar asignación" onClose={onClose}>
      <div className={styles.content}>
        <p className={styles.text}>
          ¿Deseas finalizar la asignación de{' '}
          <strong>{assignment.guard.fullname}</strong>?
        </p>

        <p className={styles.warning}>
          Se registrará la fecha y hora actuales como finalización.
        </p>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="ghost"
            disabled={isEnding}
            onClick={onClose}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="danger"
            disabled={isEnding}
            onClick={handleConfirm}
          >
            {isEnding ? 'Finalizando...' : 'Finalizar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
