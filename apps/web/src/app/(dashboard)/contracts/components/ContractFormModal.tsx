import { useId, useState } from 'react';
import type { ContractFormValues } from '@segapp/contracts';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

import ContractForm from './ContractForm';
import styles from './ContractForm.module.css';

type ContractFormModalProps = {
  open: boolean;
  title: string;
  initialValues: ContractFormValues;
  isSubmitting: boolean;
  submitLabel: string;
  disabledWhenPristine: boolean;
  onSubmit: (values: ContractFormValues) => Promise<boolean>;
  onClose: () => void;
};

export default function ContractFormModal({
  open,
  title,
  initialValues,
  isSubmitting,
  submitLabel,
  disabledWhenPristine,
  onSubmit,
  onClose,
}: ContractFormModalProps) {
  const formId = useId();
  const [isDirty, setIsDirty] = useState(false);

  function handleIsDirtyChange(nextIsDirty: boolean) {
    setIsDirty(nextIsDirty);
  }

  function handleClose() {
    if (isSubmitting) return;

    setIsDirty(false);
    onClose();
  }

  const footer = (
    <div className={styles.actions}>
      <Button
        type="button"
        variant="ghost"
        className={styles.actionBtn}
        onClick={handleClose}
        disabled={isSubmitting}
      >
        Cancelar
      </Button>

      <Button
        type="submit"
        form={formId}
        className={styles.actionBtn}
        disabled={isSubmitting || (disabledWhenPristine && !isDirty)}
      >
        {isSubmitting ? 'Guardando...' : submitLabel}
      </Button>
    </div>
  );

  return (
    <Modal open={open} title={title} footer={footer} onClose={handleClose}>
      <ContractForm
        formId={formId}
        initialValues={initialValues}
        onSubmit={onSubmit}
        onDirtyChange={handleIsDirtyChange}
      />
    </Modal>
  );
}
