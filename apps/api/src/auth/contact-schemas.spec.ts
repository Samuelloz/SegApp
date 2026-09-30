import {
  createInvitationSchema,
  loginSchema,
  userResponseSchema,
} from '@segapp/contracts';

describe('Datos de contacto', () => {
  const roles = ['VIEWER'] as const;

  it('acepta una invitación por correo electrónico', () => {
    expect(
      createInvitationSchema.safeParse({
        email: 'usuario@segapp.test',
        deliveryChannel: 'EMAIL',
        roles,
      }).success,
    ).toBe(true);
  });

  it('acepta una invitación por teléfono en formato internacional', () => {
    expect(
      createInvitationSchema.safeParse({
        phoneE164: '+528711234567',
        deliveryChannel: 'WHATSAPP',
        roles,
      }).success,
    ).toBe(true);
  });

  it('acepta una invitación con ambos datos de contacto', () => {
    expect(
      createInvitationSchema.safeParse({
        email: 'usuario@segapp.test',
        phoneE164: '+528711234567',
        deliveryChannel: 'EMAIL',
        roles,
      }).success,
    ).toBe(true);
  });

  it('acepta el rol Administrador sin roles adicionales', () => {
    expect(
      createInvitationSchema.safeParse({
        email: 'administrador@segapp.test',
        deliveryChannel: 'EMAIL',
        roles: ['ADMIN'],
      }).success,
    ).toBe(true);
  });

  it('rechaza combinar Administrador con otros roles', () => {
    const result = createInvitationSchema.safeParse({
      email: 'administrador@segapp.test',
      deliveryChannel: 'EMAIL',
      roles: ['ADMIN', 'VIEWER'],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ['roles'],
          message: 'El rol Administrador no puede combinarse con otros roles.',
        }),
      );
    }
  });

  it('rechaza una invitación sin datos de contacto o con teléfono inválido', () => {
    expect(
      createInvitationSchema.safeParse({ deliveryChannel: 'EMAIL', roles })
        .success,
    ).toBe(false);
    expect(
      createInvitationSchema.safeParse({
        phoneE164: '8711234567',
        deliveryChannel: 'WHATSAPP',
        roles,
      }).success,
    ).toBe(false);
  });

  it('exige un correo cuando se elige EMAIL', () => {
    const result = createInvitationSchema.safeParse({
      phoneE164: '+528711234567',
      deliveryChannel: 'EMAIL',
      roles,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['email']);
    }
  });

  it('exige un teléfono cuando se elige WHATSAPP', () => {
    const result = createInvitationSchema.safeParse({
      email: 'usuario@segapp.test',
      deliveryChannel: 'WHATSAPP',
      roles,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['phoneE164']);
    }
  });

  it('rechaza una invitación sin canal de entrega', () => {
    expect(
      createInvitationSchema.safeParse({
        email: 'usuario@segapp.test',
        roles,
      }).success,
    ).toBe(false);
  });

  it('permite representar una cuenta con solo teléfono', () => {
    expect(
      userResponseSchema.safeParse({
        id: 'user-1',
        email: null,
        phoneE164: '+528711234567',
        name: 'Rosario López',
        active: true,
        emailVerifiedAt: null,
        phoneVerifiedAt: '2026-09-21T00:00:00.000Z',
        createdAt: '2026-09-21T00:00:00.000Z',
        updatedAt: '2026-09-21T00:00:00.000Z',
      }).success,
    ).toBe(true);
  });
});

describe('Empresa de inicio de sesión', () => {
  it('normaliza el slug de la empresa', () => {
    expect(
      loginSchema.parse({
        companySlug: ' Seguridad-Del-Norte ',
        identifier: 'usuario@segapp.test',
        password: 'una contraseña segura',
      }).companySlug,
    ).toBe('seguridad-del-norte');
  });

  it.each([
    ['vacío', ''],
    ['con espacios internos', 'seguridad del norte'],
    ['que empieza con guion', '-seguridad'],
    ['que termina con guion', 'seguridad-'],
    ['con caracteres no permitidos', 'seguridad_norte'],
    ['de más de 63 caracteres', 'a'.repeat(64)],
  ])('rechaza un slug %s', (_case, companySlug) => {
    expect(
      loginSchema.safeParse({
        companySlug,
        identifier: 'usuario@segapp.test',
        password: 'una contraseña segura',
      }).success,
    ).toBe(false);
  });
});

describe('Identificador de inicio de sesión', () => {
  it('normaliza un correo electrónico', () => {
    expect(
      loginSchema.parse({
        companySlug: 'seguridad-del-norte',
        identifier: ' USUARIO@SEGAPP.TEST ',
        password: 'una contraseña segura',
      }).identifier,
    ).toBe('usuario@segapp.test');
  });

  it('acepta un teléfono en formato internacional', () => {
    expect(
      loginSchema.parse({
        companySlug: 'seguridad-del-norte',
        identifier: ' +528711234567 ',
        password: 'una contraseña segura',
      }).identifier,
    ).toBe('+528711234567');
  });

  it('rechaza un teléfono sin prefijo internacional', () => {
    const result = loginSchema.safeParse({
      companySlug: 'seguridad-del-norte',
      identifier: '8711234567',
      password: 'una contraseña segura',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Ingresa un correo electrónico o teléfono válido.',
      );
    }
  });
});
