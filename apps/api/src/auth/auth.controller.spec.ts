import {
  BadRequestException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { GUARDS_METADATA, HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Response } from 'express';

import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from './auth.constants';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  type AuthenticatedRequest,
  SessionAuthGuard,
} from './session-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    login: jest.fn(),
    logout: jest.fn(),
    toCurrentSessionResponse: jest.fn(),
  };

  const sessionAuthGuardMock = {
    canActivate: jest.fn(),
  };

  const responseMock = {
    clearCookie: jest.fn(),
    cookie: jest.fn(),
    setHeader: jest.fn(),
  };

  const currentSession = {
    user: {
      id: 'user-1',
      email: 'usuario@segapp.test',
      phoneE164: null,
      name: 'Rosario López',
      active: true,
      emailVerifiedAt: null,
      phoneVerifiedAt: null,
      createdAt: '2026-09-18T08:00:00.000Z',
      updatedAt: '2026-09-18T09:00:00.000Z',
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
    })
      .overrideGuard(SessionAuthGuard)
      .useValue(sessionAuthGuardMock)
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('rechaza datos de inicio de sesión inválidos', async () => {
    await expect(
      controller.login(
        {
          companySlug: 'seguridad-del-norte',
          identifier: 'correo-inválido',
          password: '',
        },
        responseMock as unknown as Response,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(authServiceMock.login).not.toHaveBeenCalled();
    expect(responseMock.cookie).not.toHaveBeenCalled();
    expect(responseMock.setHeader).not.toHaveBeenCalled();
  });

  it.each([
    ['sin empresa', undefined],
    ['con una empresa de formato inválido', 'seguridad del norte'],
  ])('rechaza un inicio de sesión %s', async (_case, companySlug) => {
    await expect(
      controller.login(
        {
          companySlug,
          identifier: 'usuario@segapp.test',
          password: 'una contraseña segura',
        },
        responseMock as unknown as Response,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(authServiceMock.login).not.toHaveBeenCalled();
    expect(responseMock.cookie).not.toHaveBeenCalled();
  });

  it('crea la cookie segura y devuelve la sesión actual', async () => {
    authServiceMock.login.mockResolvedValue({
      token: 'token-original',
      currentSession,
    });

    const result = await controller.login(
      {
        companySlug: ' Seguridad-Del-Norte ',
        identifier: ' USUARIO@SEGAPP.TEST ',
        password: 'una contraseña segura',
      },
      responseMock as unknown as Response,
    );

    expect(authServiceMock.login).toHaveBeenCalledWith({
      companySlug: 'seguridad-del-norte',
      identifier: 'usuario@segapp.test',
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

  it('acepta un teléfono y lo entrega normalizado al servicio', async () => {
    authServiceMock.login.mockResolvedValue({
      token: 'token-original',
      currentSession,
    });

    await controller.login(
      {
        companySlug: 'seguridad-del-norte',
        identifier: ' +528711234567 ',
        password: 'una contraseña segura',
      },
      responseMock as unknown as Response,
    );

    expect(authServiceMock.login).toHaveBeenCalledWith({
      companySlug: 'seguridad-del-norte',
      identifier: '+528711234567',
      password: 'una contraseña segura',
    });
  });

  it('no crea una cookie cuando las credenciales son rechazadas', async () => {
    authServiceMock.login.mockRejectedValue(
      new UnauthorizedException('Datos de acceso incorrectos.'),
    );

    await expect(
      controller.login(
        {
          companySlug: 'seguridad-del-norte',
          identifier: 'usuario@segapp.test',
          password: 'contraseña incorrecta',
        },
        responseMock as unknown as Response,
      ),
    ).rejects.toThrow(UnauthorizedException);

    expect(responseMock.cookie).not.toHaveBeenCalled();
    expect(responseMock.setHeader).not.toHaveBeenCalled();
  });

  it('protege la consulta de sesión con SessionAuthGuard', () => {
    const reflector = new Reflector();
    const guards = reflector.get<unknown[]>(
      GUARDS_METADATA,
      // Solo se usa la referencia del método para leer sus metadatos.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      AuthController.prototype.getCurrentSession,
    );

    expect(guards).toContain(SessionAuthGuard);
  });

  it('rechaza la consulta cuando la petición no contiene una sesión', () => {
    const request = {} as AuthenticatedRequest;

    expect(() =>
      controller.getCurrentSession(
        request,
        responseMock as unknown as Response,
      ),
    ).toThrow(UnauthorizedException);

    expect(authServiceMock.toCurrentSessionResponse).not.toHaveBeenCalled();
    expect(responseMock.setHeader).not.toHaveBeenCalled();
  });

  it('devuelve la sesión actual sin exponer datos sensibles', () => {
    const expiresAt = new Date('2026-09-19T20:00:00.000Z');
    const user = {
      id: 'user-1',
      email: 'usuario@segapp.test',
      name: 'Rosario López',
      active: true,
    };
    const membership = {
      id: 'membership-1',
      roles: ['ADMIN', 'CONTRACT_MANAGER'],
      status: 'ACTIVE',
      user,
      company: {
        id: 'company-1',
        name: 'Seguridad del Norte',
        slug: 'seguridad-del-norte',
      },
    };
    const request = {
      currentSession: {
        expiresAt,
        membership,
      },
    } as unknown as AuthenticatedRequest;

    authServiceMock.toCurrentSessionResponse.mockReturnValue(currentSession);

    const result = controller.getCurrentSession(
      request,
      responseMock as unknown as Response,
    );

    expect(authServiceMock.toCurrentSessionResponse).toHaveBeenCalledWith(
      user,
      membership,
      expiresAt,
    );
    expect(responseMock.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'no-store',
    );
    expect(result).toEqual(currentSession);
    expect(result).not.toHaveProperty('token');
    expect(result).not.toHaveProperty('tokenHash');
  });

  it('configura el cierre de sesión para responder sin contenido', () => {
    const reflector = new Reflector();
    const statusCode = reflector.get<number>(
      HTTP_CODE_METADATA,
      // Solo se usa la referencia del método para leer sus metadatos.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      AuthController.prototype.logout,
    );

    expect(statusCode).toBe(HttpStatus.NO_CONTENT);
  });

  it('revoca la sesión y elimina la cookie cuando recibe un token', async () => {
    const request = {
      cookies: {
        [SESSION_COOKIE_NAME]: 'token-original',
      },
    } as AuthenticatedRequest;

    authServiceMock.logout.mockResolvedValue(undefined);

    await controller.logout(request, responseMock as unknown as Response);

    expect(authServiceMock.logout).toHaveBeenCalledWith('token-original');
    expect(responseMock.clearCookie).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      SESSION_COOKIE_OPTIONS,
    );
    expect(responseMock.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'no-store',
    );
  });

  it.each([
    ['cookies ausentes', {}],
    ['cookie de sesión ausente', { cookies: {} }],
    [
      'cookie de sesión vacía',
      {
        cookies: {
          [SESSION_COOKIE_NAME]: '',
        },
      },
    ],
    [
      'cookie de sesión con un valor que no es texto',
      {
        cookies: {
          [SESSION_COOKIE_NAME]: 123,
        },
      },
    ],
  ])(
    'elimina la cookie aunque la petición tenga %s',
    async (_scenario, request) => {
      await controller.logout(
        request as AuthenticatedRequest,
        responseMock as unknown as Response,
      );

      expect(authServiceMock.logout).not.toHaveBeenCalled();
      expect(responseMock.clearCookie).toHaveBeenCalledWith(
        SESSION_COOKIE_NAME,
        SESSION_COOKIE_OPTIONS,
      );
      expect(responseMock.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'no-store',
      );
    },
  );
});
