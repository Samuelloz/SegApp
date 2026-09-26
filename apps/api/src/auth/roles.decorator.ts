import type { MembershipRole } from '@segapp/contracts';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: MembershipRole[]) =>
  SetMetadata(ROLES_KEY, roles);
