import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const passwordServiceMock = {
    verify: jest.fn(),
  };

  const sessionServiceMock = {
    create: jest.fn(),
    revokeByToken: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

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

  it('acepta credenciales correctas', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'usuario@segapp.test',
      passwordHash: 'hash-guardado',
      name: 'Rosario López',
      active: true,
      emailVerifiedAt: null,
      createdAt: new Date('2026-09-18T00:00:00.000Z'),
      updatedAt: new Date('2026-09-18T00:00:00.000Z'),
      membership: null,
    });

    passwordServiceMock.verify.mockResolvedValue(true);

    const result = await service.authenticateCredentials(
      ' USUARIO@SEGAPP.TEST ',
      'una contraseña segura',
    );

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          email: 'usuario@segapp.test',
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
        email: 'usuario@segapp.test',
        active: true,
      }),
    );
  });

  it('rechaza un correo electrónico inexistente', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      service.authenticateCredentials(
        'inexistente@segapp.test',
        'una contraseña segura',
      ),
    ).rejects.toThrow('Correo electrónico o contraseña incorrectos.');

    expect(passwordServiceMock.verify).not.toHaveBeenCalled();
  });

  it('rechaza un usuario inactivo', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'usuario@segapp.test',
      passwordHash: 'hash-guardado',
      name: 'Rosario López',
      active: false,
      emailVerifiedAt: null,
      createdAt: new Date('2026-09-18T00:00:00.000Z'),
      updatedAt: new Date('2026-09-18T00:00:00.000Z'),
      membership: null,
    });

    await expect(
      service.authenticateCredentials(
        'usuario@segapp.test',
        'una contraseña segura',
      ),
    ).rejects.toThrow('Correo electrónico o contraseña incorrectos.');

    expect(passwordServiceMock.verify).not.toHaveBeenCalled();
  });

  it('rechaza una contraseña incorrecta', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'usuario@segapp.test',
      passwordHash: 'hash-guardado',
      name: 'Rosario López',
      active: true,
      emailVerifiedAt: null,
      createdAt: new Date('2026-09-18T00:00:00.000Z'),
      updatedAt: new Date('2026-09-18T00:00:00.000Z'),
      membership: null,
    });

    passwordServiceMock.verify.mockResolvedValue(false);

    await expect(
      service.authenticateCredentials(
        'usuario@segapp.test',
        'contraseña incorrecta',
      ),
    ).rejects.toThrow('Correo electrónico o contraseña incorrectos.');

    expect(passwordServiceMock.verify).toHaveBeenCalledWith(
      'hash-guardado',
      'contraseña incorrecta',
    );
  });

  it('inicia sesión para un usuario con membresía', async () => {
    const emailVerifiedAt = new Date('2026-09-17T12:00:00.000Z');
    const userCreatedAt = new Date('2026-09-18T08:00:00.000Z');
    const userUpdatedAt = new Date('2026-09-18T09:00:00.000Z');
    const membershipCreatedAt = new Date('2026-09-18T10:00:00.000Z');
    const membershipUpdatedAt = new Date('2026-09-18T11:00:00.000Z');
    const expiresAt = new Date('2026-09-19T00:00:00.000Z');

    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'usuario@segapp.test',
      passwordHash: 'hash-guardado',
      name: 'Rosario López',
      active: true,
      emailVerifiedAt,
      createdAt: userCreatedAt,
      updatedAt: userUpdatedAt,
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
      session: {
        expiresAt,
      },
    });

    const result = await service.login({
      email: 'usuario@segapp.test',
      password: 'una contraseña segura',
    });

    expect(sessionServiceMock.create).toHaveBeenCalledWith('membership-1');
    expect(result).toEqual({
      token: 'token-original',
      currentSession: {
        user: {
          id: 'user-1',
          email: 'usuario@segapp.test',
          name: 'Rosario López',
          active: true,
          emailVerifiedAt: emailVerifiedAt.toISOString(),
          createdAt: userCreatedAt.toISOString(),
          updatedAt: userUpdatedAt.toISOString(),
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

  it('rechaza el inicio de sesión de un usuario sin membresía', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'usuario@segapp.test',
      passwordHash: 'hash-guardado',
      name: 'Rosario López',
      active: true,
      emailVerifiedAt: null,
      createdAt: new Date('2026-09-18T08:00:00.000Z'),
      updatedAt: new Date('2026-09-18T09:00:00.000Z'),
      membership: null,
    });

    passwordServiceMock.verify.mockResolvedValue(true);

    await expect(
      service.login({
        email: 'usuario@segapp.test',
        password: 'una contraseña segura',
      }),
    ).rejects.toThrow('La cuenta no tiene acceso a una empresa activa.');

    expect(sessionServiceMock.create).not.toHaveBeenCalled();
  });

  it('cierra la sesión revocando el token recibido', async () => {
    sessionServiceMock.revokeByToken.mockResolvedValue(undefined);

    await service.logout('token-original');

    expect(sessionServiceMock.revokeByToken).toHaveBeenCalledWith(
      'token-original',
    );
  });
});
