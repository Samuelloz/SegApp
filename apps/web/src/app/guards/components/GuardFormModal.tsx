'use client';

import { useId, useState } from 'react';
import type { GuardFormValues } from '@segapp/contracts';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

import GuardForm from './GuardForm';
import styles from './GuardForm.module.css';

type GuardFormModalProps = {
  open: boolean;
  title: string;
  initialValues: GuardFormValues;
  isSubmitting: boolean;
  submitLabel: string;
  disabledWhenPristine: boolean;
  onSubmit: (values: GuardFormValues) => Promise<boolean>;
  onClose: () => void;
};

export default function GuardFormModal({
  open,
  title,
  initialValues,
  isSubmitting,
  submitLabel,
  disabledWhenPristine,
  onSubmit,
  onClose,
}: GuardFormModalProps) {
  const formId = useId();
  const [isDirty, setIsDirty] = useState(false);

  function handleDirtyChange(nextIsDirty: boolean) {
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
      <GuardForm
        formId={formId}
        initialValues={initialValues}
        onSubmit={onSubmit}
        onDirtyChange={handleDirtyChange}
      />
    </Modal>
  );
}
