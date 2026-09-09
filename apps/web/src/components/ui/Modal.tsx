'use client';

import { type MouseEvent, type ReactNode, useEffect, useId } from 'react';

import styles from './gloablUiCss/Modal.module.css';

type Props = {
  open: boolean;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
};

export default function Modal({
  open,
  title,
  children,
  footer,
  onClose,
}: Props) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const previousBodyOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  function handleModalClick(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={handleModalClick}
      >
        <div className={styles.header}>
          <div id={titleId} className={styles.title}>
            {title ?? 'Editar'}
          </div>

          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            X
          </button>
        </div>

        <div className={styles.content}>{children}</div>

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
