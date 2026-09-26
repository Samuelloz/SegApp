import type { MembershipRole } from './membership';

export type AppPermission =
  | 'contracts:list'
  | 'contracts:manage'
  | 'contracts:status'
  | 'guards:list'
  | 'guards:manage'
  | 'assignments:list'
  | 'assignments:manage'
  | 'company:manage'
  | 'users:manage';

const permissionRoles: Record<AppPermission, readonly MembershipRole[]> = {
  'contracts:list': ['OWNER', 'ADMIN', 'SALES', 'CONTRACT_MANAGER', 'VIEWER'],
  'contracts:manage': ['OWNER', 'ADMIN', 'SALES', 'CONTRACT_MANAGER'],
  'contracts:status': ['OWNER', 'ADMIN', 'CONTRACT_MANAGER'],
  'guards:list': ['OWNER', 'ADMIN', 'GUARD_MANAGER', 'VIEWER'],
  'guards:manage': ['OWNER', 'ADMIN', 'GUARD_MANAGER'],
  'assignments:list': [
    'OWNER',
    'ADMIN',
    'GUARD_MANAGER',
    'SUPERVISOR',
    'VIEWER',
  ],
  'assignments:manage': ['OWNER', 'ADMIN', 'GUARD_MANAGER', 'SUPERVISOR'],
  'company:manage': ['OWNER', 'ADMIN'],
  'users:manage': ['OWNER', 'ADMIN'],
};

export function rolesFor(permission: AppPermission): MembershipRole[] {
  return [...permissionRoles[permission]];
}

export function hasPermission(
  roles: readonly MembershipRole[],
  permission: AppPermission,
): boolean {
  return roles.some((role) => permissionRoles[permission].includes(role));
}
