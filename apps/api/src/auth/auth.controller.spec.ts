import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import type { Response } from 'express';

import { SESSION_COOKIE_NAME } from './auth.constants';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    login: jest.fn(),
  };

  const responseMock = {
    cookie: jest.fn(),
    setHeader: jest.fn(),
  };

  const currentSession = {
    user: {
      id: 'user-1',
      email: 'usuario@segapp.test',
      name: 'Rosario López',
      active: true,
      emailVerifiedAt: null,
      createdAt: '2026-09-18T08:00:00.000Z',
      updatedAt: '2026-09-18T09:00:00.000Z',
    },
    membership: {
      id: 'membership-1',
      role: 'ADMIN',
      status: 'ACTIVE',
      company: {
        id: 'company-1',
        name: 'Seguridad del Norte',
        slug: 'seguridad-del-norte',
      },
      createdAt: '2026-09-18T10:00:00.000Z',
      updatedAt: '2026-09-18T11:00:00.000Z',
    },
    expiresAt: '2026-09-19T00:00:00.000Z',
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('rechaza datos de inicio de sesión inválidos', async () => {
    await expect(
      controller.login(
        {
          email: 'correo-inválido',
          password: '',
        },
        responseMock as unknown as Response,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(authServiceMock.login).not.toHaveBeenCalled();
    expect(responseMock.cookie).not.toHaveBeenCalled();
    expect(responseMock.setHeader).not.toHaveBeenCalled();
  });

  it('crea la cookie segura y devuelve la sesión actual', async () => {
    authServiceMock.login.mockResolvedValue({
      token: 'token-original',
      currentSession,
    });

    const result = await controller.login(
      {
        email: ' USUARIO@SEGAPP.TEST ',
        password: 'una contraseña segura',
      },
      responseMock as unknown as Response,
    );

    expect(authServiceMock.login).toHaveBeenCalledWith({
      email: 'usuario@segapp.test',
      password: 'una contraseña segura',
    });
    expect(responseMock.cookie).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      'token-original',
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: new Date(currentSession.expiresAt),
      },
    );
    expect(responseMock.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'no-store',
    );
    expect(result).toEqual(currentSession);
    expect(result).not.toHaveProperty('token');
  });

  it('no crea una cookie cuando las credenciales son rechazadas', async () => {
    authServiceMock.login.mockRejectedValue(
      new UnauthorizedException('Correo electrónico o contraseña incorrectos.'),
    );

    await expect(
      controller.login(
        {
          email: 'usuario@segapp.test',
          password: 'contraseña incorrecta',
        },
        responseMock as unknown as Response,
      ),
    ).rejects.toThrow(UnauthorizedException);

    expect(responseMock.cookie).not.toHaveBeenCalled();
    expect(responseMock.setHeader).not.toHaveBeenCalled();
  });
});
