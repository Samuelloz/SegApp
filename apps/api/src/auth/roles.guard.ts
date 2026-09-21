import type { MembershipRole } from '@segapp/contracts';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  INSUFFICIENT_PERMISSIONS_MESSAGE,
  INVALID_SESSION_MESSAGE,
} from './auth.constants';
import { ROLES_KEY } from './roles.decorator';
import type { AuthenticatedRequest } from './session-auth.guard';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<MembershipRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const currentSession = request.currentSession;

    if (!currentSession) {
      throw new UnauthorizedException(INVALID_SESSION_MESSAGE);
    }

    const hasRequiredRole = currentSession.membership.roles.some((role) =>
      requiredRoles.includes(role),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException(INSUFFICIENT_PERMISSIONS_MESSAGE);
    }

    return true;
  }
}
