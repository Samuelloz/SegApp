import { hasPermission, rolesFor } from '@segapp/contracts';

describe('Política de permisos', () => {
  it('permite a VIEWER consultar solo listados, sin datos completos ni configuración', () => {
    expect(hasPermission(['VIEWER'], 'contracts:list')).toBe(true);
    expect(hasPermission(['VIEWER'], 'guards:list')).toBe(true);
    expect(hasPermission(['VIEWER'], 'assignments:list')).toBe(true);
    expect(hasPermission(['VIEWER'], 'contracts:manage')).toBe(false);
    expect(hasPermission(['VIEWER'], 'guards:manage')).toBe(false);
    expect(hasPermission(['VIEWER'], 'assignments:manage')).toBe(false);
    expect(hasPermission(['VIEWER'], 'company:manage')).toBe(false);
    expect(hasPermission(['VIEWER'], 'users:manage')).toBe(false);
  });

  it('combina permisos de varios roles sin ampliar permisos de un rol aislado', () => {
    expect(hasPermission(['SALES'], 'contracts:manage')).toBe(true);
    expect(hasPermission(['SALES'], 'guards:manage')).toBe(false);
    expect(hasPermission(['SALES', 'GUARD_MANAGER'], 'guards:manage')).toBe(
      true,
    );
    expect(hasPermission(['SUPERVISOR'], 'assignments:manage')).toBe(true);
    expect(hasPermission(['SUPERVISOR'], 'guards:manage')).toBe(false);
  });

  it('mantiene los roles de la API alineados con la política común', () => {
    expect(rolesFor('contracts:list')).toContain('VIEWER');
    expect(rolesFor('contracts:manage')).not.toContain('VIEWER');
    expect(rolesFor('company:manage')).toEqual(['OWNER', 'ADMIN']);
  });
});
