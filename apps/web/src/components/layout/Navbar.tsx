'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import styles from './navbar.module.css';

export default function Navbar() {
    const pathName = usePathname();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';

        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    useEffect(() => {
        const desktopMedia = window.matchMedia('(min-width: 981px)');

        function closeOnDesktop(event: MediaQueryListEvent) {
            if (event.matches) {
                setOpen(false);
            }
        }

        desktopMedia.addEventListener('change', closeOnDesktop);

        return () => {
            desktopMedia.removeEventListener('change', closeOnDesktop);
        }
    }, []);

    const isContracts = pathName?.startsWith('/contracts');
    const isGuards = pathName?.startsWith('/guards');
    const isAssignments = pathName?.startsWith('/assignments');

    return (
        <header className={styles.header}>
            <div className={styles.inner}>
                <Link href="/" className={styles.brand}>
                    <span className={styles.logo} />
                    <div className={styles.brandText}>
                        <div className={styles.brandName}> LozCorp </div>
                        <div className={styles.brandSub}> Security Management </div>
                    </div>
                </Link>

                <nav className={styles.navDesktop}>
                    <Link className={`${styles.link} ${isContracts ? styles.active : ''}`} href="/contracts">Contratos</Link>
                    <Link className={`${styles.link} ${isGuards ? styles.active : ''}`} href="/guards">Guardias</Link>
                    <Link className={`${styles.link} ${isAssignments ? styles.active : ''}`} href="/assignments">Asignaciones</Link>
                </nav>

                <button
                    type="button"
                    className={styles.burger}
                    onClick={() => { setOpen(v => !v) }}
                    aria-label='Abrir menú'
                    aria-expanded={open}>
                    <span />
                    <span />
                    <span />
                </button>
            </div>

            <div className={`${styles.backdrop} ${open ? styles.backdropOpen : ''}`}
                onClick={() => setOpen(false)} />

            <aside className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}>
                <div className={styles.drawerTop}>
                    <div className={styles.drawerTitle}> Menú</div>
                    <button
                        type="button"
                        className={styles.closeBtn}
                        onClick={() => setOpen(false)}
                        aria-label='Cerrar Menú'>
                        X
                    </button>
                </div>

                <nav className={styles.drawerNav}>
                    <Link
                        className={`${styles.drawerLink} ${isContracts ? styles.drawerActive : ''}`}
                        href="/contracts"
                        onClick={() => setOpen(false)}>
                        Contratos
                    </Link>

                    <Link
                        className={`${styles.drawerLink} ${isGuards ? styles.drawerActive : ''}`}
                        href="/guards"
                        onClick={() => setOpen(false)}
                    >
                        Guardias
                    </Link>

                    <Link
                        className={`${styles.drawerLink} ${isAssignments ? styles.drawerActive : ''}`}
                        href="/assignments"
                        onClick={() => setOpen(false)}
                    >
                        Asignaciones
                    </Link>
                </nav>
            </aside>
        </header>
    )
}