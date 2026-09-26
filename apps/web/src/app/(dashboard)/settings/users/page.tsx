'use client';

import { hasPermission, type MembershipRole } from '@segapp/contracts';

import Card from '@/components/ui/Card';
import {
  useGetCompanyUsersQuery,
  useGetCurrentSessionQuery,
} from '@/store/api';

const roleLabels: Record<MembershipRole, string> = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  SALES: 'Ventas',
  CONTRACT_MANAGER: 'Contratos',
  GUARD_MANAGER: 'Guardias',
  SUPERVISOR: 'Supervisor',
  VIEWER: 'Consulta',
};

export default function UsersPage() {
  const { data: session } = useGetCurrentSessionQuery();

  const canManageUsers = hasPermission(
    session?.membership.roles ?? [],
    'users:manage',
  );

  const {
    data: users,
    isLoading,
    isError,
  } = useGetCompanyUsersQuery(undefined, {
    skip: !canManageUsers,
    refetchOnMountOrArgChange: true,
  });

  if (!session) {
    return <p className="pMuted">Verificando sesión...</p>;
  }

  if (!canManageUsers) {
    return (
      <section className="panel">
        <div className="grid">
          <p>No tienes permiso para gestionar usuarios.</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="pageHead">
        <div>
          <h1 className="h1">Gestión de usuarios</h1>
          <p className="pMuted">Personas con acceso a esta empresa.</p>
        </div>
      </div>

      <section className="panel">
        {isLoading ? (
          <div className="grid">Cargando usuarios...</div>
        ) : isError ? (
          <div className="grid">No fue posible cargar los usuarios.</div>
        ) : !users?.length ? (
          <div className="grid">Todavía no hay usuarios en esta empresa...</div>
        ) : (
          <div className="grid gridCards">
            {users.map((membership) => (
              <Card key={membership.id}>
                <h2>{membership.user.name}</h2>

                <p className="pMuted">
                  {membership.user.email ??
                    membership.user.phoneE164 ??
                    'Sin contacto'}
                </p>

                <p>
                  Roles:{' '}
                  {membership.roles.map((role) => roleLabels[role]).join(', ')}
                </p>

                <p>
                  Estado:{' '}
                  {membership.user.active && membership.status === 'ACTIVE'
                    ? 'Activo'
                    : 'Sin acceso'}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
