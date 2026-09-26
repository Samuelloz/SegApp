'use client';

import { hasPermission } from '@segapp/contracts';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useGetCurrentSessionQuery } from '@/store/api';

export default function Home() {
  const router = useRouter();
  const { data: session } = useGetCurrentSessionQuery();

  const roles = session?.membership.roles ?? [];
  const destination = hasPermission(roles, 'contracts:list')
    ? '/contracts'
    : hasPermission(roles, 'guards:list')
      ? '/guards'
      : hasPermission(roles, 'assignments:list')
        ? '/assignments'
        : hasPermission(roles, 'company:manage')
          ? '/settings'
          : null;

  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination, router]);

  return (
    <main className="page">
      <p className="pMuted">
        {destination
          ? 'Abriendo tu panel...'
          : 'No tienes módulos disponibles.'}
      </p>
    </main>
  );
}
