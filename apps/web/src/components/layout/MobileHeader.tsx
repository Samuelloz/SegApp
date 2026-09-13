'use client';

import Link from 'next/link';

import { useGetCurrentCompanyQuery } from '@/store/api';
import { Menu } from 'lucide-react';

import styles from './MobileHeader.module.css';

type MobileHeaderProps = {
  open: boolean;
  onOpen: () => void;
};

export default function MobileHeader({ open, onOpen }: MobileHeaderProps) {
  const { data: company } = useGetCurrentCompanyQuery();

  function handleOpen() {
    onOpen();
  }

  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.burger}
        onClick={handleOpen}
        aria-label="Abrir menú"
        aria-expanded={open}
        aria-controls="app-sidebar"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      <Link href="/" className={styles.brand}>
        <span className={styles.logo} />
        <div className={styles.brandText}>
          <div className={styles.brandName}>{company?.name ?? 'SegApp'}</div>
        </div>
      </Link>
    </header>
  );
}
