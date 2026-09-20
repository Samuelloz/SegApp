import type { MembershipRole } from '@segapp/contracts';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY, Roles } from './roles.decorator';

describe('Roles', () => {
  const reflector = new Reflector();

  it('guarda los roles permitidos como metadatos del método', () => {
    class TestController {
      @Roles('OWNER', 'ADMIN')
      protectedRoute(this: void) {}
    }

    const roles = reflector.get<MembershipRole[]>(
      ROLES_KEY,
      TestController.prototype.protectedRoute,
    );

    expect(roles).toEqual(['OWNER', 'ADMIN']);
  });

  it('guarda los roles permitidos como metadatos del controlador', () => {
    @Roles('SUPERVISOR', 'VIEWER')
    class TestController {}

    const roles = reflector.get<MembershipRole[]>(ROLES_KEY, TestController);

    expect(roles).toEqual(['SUPERVISOR', 'VIEWER']);
  });
});
