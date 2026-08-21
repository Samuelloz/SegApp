'use client';

import { ReactNode, useEffect } from 'react';
import styles from './gloablUiCss/Modal.module.css';

type Props = {
    open: boolean;
    title?: string;
    children: ReactNode;
    onClose: () => void;
};

export default function Modal({ open, title, children, onClose }: Props) {
    useEffect(() => {
        if (!open) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        }

        document.addEventListener('keydown', onKeyDown);

        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.title}>{title ?? 'Editar'}</div>
                    <button className={styles.close} onClick={onClose}>X</button>
                </div>

                <div className={styles.content}>
                    {children}
                </div>
            </div>
        </div>
    )
}