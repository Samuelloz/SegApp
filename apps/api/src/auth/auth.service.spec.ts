import { Test, type TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findFirst: jest.fn(),
    },
  };

  const passwordServiceMock = {
    hash: jest.fn(),
    verify: jest.fn(),
  };

  const sessionServiceMock = {
    create: jest.fn(),
    revokeByToken: jest.fn(),
  };

  const activeUser = {
    id: 'user-1',
    companyId: 'company-1',
    email: 'usuario@segapp.test',
    phoneE164: null,
    passwordHash: 'hash-guardado',
    name: 'Rosario López',
    active: true,
    emailVerifiedAt: null,
    phoneVerifiedAt: null,
    createdAt: new Date('2026-09-18T08:00:00.000Z'),
    updatedAt: new Date('2026-09-18T09:00:00.000Z'),
    membership: null,
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    passwordServiceMock.hash.mockResolvedValue('hash-ficticio');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: PasswordService,
          useValue: passwordServiceMock,
        },
        {
          provide: SessionService,
          useValue: sessionServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('authenticateCredentials', () => {
    it('busca el correo normalizado únicamente dentro de la empresa del slug', async () => {
      prismaMock.user.findFirst.mockResolvedValue(activeUser);
      passwordServiceMock.verify.mockResolvedValue(true);

      const result = await service.authenticateCredentials(
        'seguridad-del-norte',
        ' USUARIO@SEGAPP.TEST ',
        'una contraseña segura',
      );

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            email: 'usuario@segapp.test',
            company: { slug: 'seguridad-del-norte' },
          },
        }),
      );
      expect(passwordServiceMock.verify).toHaveBeenCalledWith(
        'hash-guardado',
        'una contraseña segura',
      );
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toEqual(
        expect.objectContaining({
          id: 'user-1',
          companyId: 'company-1',
          email: 'usuario@segapp.test',
          active: true,
        }),
      );
    });

    it('acepta un teléfono en formato internacional para una cuenta sin correo', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        ...activeUser,
        email: null,
        phoneE164: '+528711234567',
      });
      passwordServiceMock.verify.mockResolvedValue(true);

      const result = await service.authenticateCredentials(
        'seguridad-del-norte',
        ' +528711234567 ',
        'una contraseña segura',
      );

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            phoneE164: '+528711234567',
            company: { slug: 'seguridad-del-norte' },
          },
        }),
      );
      expect(result.email).toBeNull();
      expect(result.phoneE164).toBe('+528711234567');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('verifica contra un hash ficticio cuando la cuenta o la empresa no existen', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      passwordServiceMock.verify.mockResolvedValue(false);

      await expect(
        service.authenticateCredentials(
          'empresa-inexistente',
          'inexistente@segapp.test',
          'una contraseña segura',
        ),
      ).rejects.toThrow('Datos de acceso incorrectos.');

      expect(passwordServiceMock.verify).toHaveBeenCalledWith(
        'hash-ficticio',
        'una contraseña segura',
      );
    });

    it('genera el hash ficticio una sola vez', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      passwordServiceMock.verify.mockResolvedValue(false);

      for (let attempt = 0; attempt < 2; attempt++) {
        await expect(
          service.authenticateCredentials(
            'seguridad-del-norte',
            'inexistente@segapp.test',
            'una contraseña segura',
          ),
        ).rejects.toThrow('Datos de acceso incorrectos.');
      }

      expect(passwordServiceMock.hash).toHaveBeenCalledTimes(1);
      expect(passwordServiceMock.verify).toHaveBeenCalledTimes(2);
    });

    it('rechaza un usuario inactivo después de verificar la contraseña', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        ...activeUser,
        active: false,
      });
      passwordServiceMock.verify.mockResolvedValue(true);

      await expect(
        service.authenticateCredentials(
          'seguridad-del-norte',
          'usuario@segapp.test',
          'una contraseña segura',
        ),
      ).rejects.toThrow('Datos de acceso incorrectos.');

      expect(passwordServiceMock.verify).toHaveBeenCalledWith(
        'hash-guardado',
        'una contraseña segura',
      );
    });

    it('rechaza una contraseña incorrecta', async () => {
      prismaMock.user.findFirst.mockResolvedValue(activeUser);
      passwordServiceMock.verify.mockResolvedValue(false);

      await expect(
        service.authenticateCredentials(
          'seguridad-del-norte',
          'usuario@segapp.test',
          'contraseña incorrecta',
        ),
      ).rejects.toThrow('Datos de acceso incorrectos.');

      expect(passwordServiceMock.verify).toHaveBeenCalledWith(
        'hash-guardado',
        'contraseña incorrecta',
      );
    });
  });

  describe('login', () => {
    it('inicia sesión para un usuario con membresía', async () => {
      const emailVerifiedAt = new Date('2026-09-17T12:00:00.000Z');
      const membershipCreatedAt = new Date('2026-09-18T10:00:00.000Z');
      const membershipUpdatedAt = new Date('2026-09-18T11:00:00.000Z');
      const expiresAt = new Date('2026-09-19T00:00:00.000Z');

      prismaMock.user.findFirst.mockResolvedValue({
        ...activeUser,
        emailVerifiedAt,
        membership: {
          id: 'membership-1',
          roles: ['ADMIN', 'CONTRACT_MANAGER'],
          status: 'ACTIVE',
          createdAt: membershipCreatedAt,
          updatedAt: membershipUpdatedAt,
          company: {
            id: 'company-1',
            name: 'Seguridad del Norte',
            slug: 'seguridad-del-norte',
          },
        },
      });
      passwordServiceMock.verify.mockResolvedValue(true);
      sessionServiceMock.create.mockResolvedValue({
        token: 'token-original',
        session: { expiresAt },
      });

      const result = await service.login({
        companySlug: 'seguridad-del-norte',
        identifier: 'usuario@segapp.test',
        password: 'una contraseña segura',
      });

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            email: 'usuario@segapp.test',
            company: { slug: 'seguridad-del-norte' },
          },
        }),
      );
      expect(sessionServiceMock.create).toHaveBeenCalledWith('membership-1');
      expect(result).toEqual({
        token: 'token-original',
        currentSession: {
          user: {
            id: 'user-1',
            email: 'usuario@segapp.test',
            phoneE164: null,
            name: 'Rosario López',
            active: true,
            emailVerifiedAt: emailVerifiedAt.toISOString(),
            phoneVerifiedAt: null,
            createdAt: activeUser.createdAt.toISOString(),
            updatedAt: activeUser.updatedAt.toISOString(),
          },
          membership: {
            id: 'membership-1',
            roles: ['ADMIN', 'CONTRACT_MANAGER'],
            status: 'ACTIVE',
            company: {
              id: 'company-1',
              name: 'Seguridad del Norte',
              slug: 'seguridad-del-norte',
            },
            createdAt: membershipCreatedAt.toISOString(),
            updatedAt: membershipUpdatedAt.toISOString(),
          },
          expiresAt: expiresAt.toISOString(),
        },
      });
    });

    it('inicia sesión para una cuenta con solo teléfono', async () => {
      const phoneVerifiedAt = new Date('2026-09-17T12:00:00.000Z');
      const expiresAt = new Date('2026-09-19T00:00:00.000Z');

      prismaMock.user.findFirst.mockResolvedValue({
        ...activeUser,
        id: 'user-phone-1',
        email: null,
        phoneE164: '+528711234567',
        phoneVerifiedAt,
        membership: {
          id: 'membership-1',
          roles: ['VIEWER'],
          status: 'ACTIVE',
          createdAt: activeUser.createdAt,
          updatedAt: activeUser.updatedAt,
          company: {
            id: 'company-1',
            name: 'Seguridad del Norte',
            slug: 'seguridad-del-norte',
          },
        },
      });
      passwordServiceMock.verify.mockResolvedValue(true);
      sessionServiceMock.create.mockResolvedValue({
        token: 'token-original',
        session: { expiresAt },
      });

      const result = await service.login({
        companySlug: 'seguridad-del-norte',
        identifier: '+528711234567',
        password: 'una contraseña segura',
      });

      expect(sessionServiceMock.create).toHaveBeenCalledWith('membership-1');
      expect(result.currentSession.user).toEqual({
        id: 'user-phone-1',
        email: null,
        phoneE164: '+528711234567',
        name: 'Rosario López',
        active: true,
        emailVerifiedAt: null,
        phoneVerifiedAt: phoneVerifiedAt.toISOString(),
        createdAt: activeUser.createdAt.toISOString(),
        updatedAt: activeUser.updatedAt.toISOString(),
      });
    });

    it('rechaza el inicio de sesión de un usuario sin membresía', async () => {
      prismaMock.user.findFirst.mockResolvedValue(activeUser);
      passwordServiceMock.verify.mockResolvedValue(true);

      await expect(
        service.login({
          companySlug: 'seguridad-del-norte',
          identifier: 'usuario@segapp.test',
          password: 'una contraseña segura',
        }),
      ).rejects.toThrow('La cuenta no tiene acceso a una empresa activa.');

      expect(sessionServiceMock.create).not.toHaveBeenCalled();
    });
  });

  it('cierra la sesión revocando el token recibido', async () => {
    sessionServiceMock.revokeByToken.mockResolvedValue(undefined);

    await service.logout('token-original');

    expect(sessionServiceMock.revokeByToken).toHaveBeenCalledWith(
      'token-original',
    );
  });
});
