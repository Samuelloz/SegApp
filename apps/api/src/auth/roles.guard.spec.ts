import {
  type ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { MembershipRole } from '@segapp/contracts';

import {
  INSUFFICIENT_PERMISSIONS_MESSAGE,
  INVALID_SESSION_MESSAGE,
} from './auth.constants';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import type { AuthenticatedRequest } from './session-auth.guard';

class PublicController {
  route(this: void) {}
}

@Roles('ADMIN')
class ProtectedController {
  route(this: void) {}

  @Roles('OWNER', 'ADMIN')
  ownerOrAdminRoute(this: void) {}

  @Roles('OWNER')
  ownerRoute(this: void) {}
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  const createRequest = (roles?: MembershipRole[]): AuthenticatedRequest =>
    (roles
      ? {
          currentSession: {
            membership: {
              roles,
            },
          },
        }
      : {}) as unknown as AuthenticatedRequest;

  const createContext = (
    request: AuthenticatedRequest,
    controller: object,
    handler: (...args: never[]) => unknown,
  ): ExecutionContext =>
    ({
      getClass: jest.fn().mockReturnValue(controller),
      getHandler: jest.fn().mockReturnValue(handler),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
    }) as unknown as ExecutionContext;

  it('permite continuar cuando no se configuraron roles', () => {
    const context = createContext(
      createRequest(),
      PublicController,
      PublicController.prototype.route,
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rechaza una petición protegida que no contiene una sesión', () => {
    const context = createContext(
      createRequest(),
      ProtectedController,
      ProtectedController.prototype.route,
    );

    const activation = () => guard.canActivate(context);

    expect(activation).toThrow(UnauthorizedException);
    expect(activation).toThrow(INVALID_SESSION_MESSAGE);
  });

  it('permite continuar cuando el rol está configurado en el controlador', () => {
    const context = createContext(
      createRequest(['ADMIN']),
      ProtectedController,
      ProtectedController.prototype.route,
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it.each<MembershipRole>(['OWNER', 'ADMIN'])(
    'permite continuar cuando %s es uno de los roles configurados en el método',
    (role) => {
      const context = createContext(
        createRequest([role]),
        ProtectedController,
        ProtectedController.prototype.ownerOrAdminRoute,
      );

      expect(guard.canActivate(context)).toBe(true);
    },
  );

  it('permite continuar cuando uno de los múltiples roles está permitido', () => {
    const context = createContext(
      createRequest(['VIEWER', 'ADMIN']),
      ProtectedController,
      ProtectedController.prototype.ownerOrAdminRoute,
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rechaza una sesión cuyo rol no está permitido', () => {
    const context = createContext(
      createRequest(['VIEWER', 'SALES']),
      ProtectedController,
      ProtectedController.prototype.ownerOrAdminRoute,
    );

    const activation = () => guard.canActivate(context);

    expect(activation).toThrow(ForbiddenException);
    expect(activation).toThrow(INSUFFICIENT_PERMISSIONS_MESSAGE);
  });

  it('da prioridad a los roles del método sobre los del controlador', () => {
    const context = createContext(
      createRequest(['ADMIN']),
      ProtectedController,
      ProtectedController.prototype.ownerRoute,
    );

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
