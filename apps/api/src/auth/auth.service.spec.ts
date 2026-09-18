import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';

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

  beforeEach(async () => {
    jest.clearAllMocks();

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
      memberships: [],
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
      memberships: [],
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
      memberships: [],
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
});
