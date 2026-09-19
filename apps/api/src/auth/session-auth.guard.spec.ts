import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { INVALID_SESSION_MESSAGE, SESSION_COOKIE_NAME } from './auth.constants';
import { SessionAuthGuard } from './session-auth.guard';
import { SessionService } from './session.service';

describe('SessionAuthGuard', () => {
  let guard: SessionAuthGuard;

  const sessionServiceMock = {
    findValidByToken: jest.fn(),
  };

  const createContext = (request: object): ExecutionContext =>
    ({
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionAuthGuard,
        {
          provide: SessionService,
          useValue: sessionServiceMock,
        },
      ],
    }).compile();

    guard = module.get<SessionAuthGuard>(SessionAuthGuard);
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
  ])('rechaza una petición con %s', async (_scenario, request) => {
    const context = createContext(request);
    const activation = guard.canActivate(context);

    await expect(activation).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(activation).rejects.toThrow(INVALID_SESSION_MESSAGE);

    expect(sessionServiceMock.findValidByToken).not.toHaveBeenCalled();
  });

  it('valida el token, agrega la sesión a la petición y permite continuar', async () => {
    const currentSession = {
      id: 'session-1',
      tokenHash: 'hash-del-token',
      expiresAt: new Date('2026-09-19T20:00:00.000Z'),
      revokedAt: null,
      membership: {
        id: 'membership-1',
        status: 'ACTIVE',
        user: {
          id: 'user-1',
          active: true,
        },
        company: {
          id: 'company-1',
          active: true,
          deletedAt: null,
        },
      },
    };

    const request: {
      cookies: Record<string, unknown>;
      currentSession?: typeof currentSession;
    } = {
      cookies: {
        [SESSION_COOKIE_NAME]: 'token-original',
      },
    };

    sessionServiceMock.findValidByToken.mockResolvedValue(currentSession);

    const result = await guard.canActivate(createContext(request));

    expect(sessionServiceMock.findValidByToken).toHaveBeenCalledWith(
      'token-original',
    );
    expect(request.currentSession).toBe(currentSession);
    expect(result).toBe(true);
  });

  it('propaga el error cuando el token no corresponde a una sesión válida', async () => {
    const request: {
      cookies: Record<string, unknown>;
      currentSession?: unknown;
    } = {
      cookies: {
        [SESSION_COOKIE_NAME]: 'token-invalido',
      },
    };

    const error = new UnauthorizedException(INVALID_SESSION_MESSAGE);

    sessionServiceMock.findValidByToken.mockRejectedValue(error);

    await expect(guard.canActivate(createContext(request))).rejects.toBe(error);

    expect(sessionServiceMock.findValidByToken).toHaveBeenCalledWith(
      'token-invalido',
    );
    expect(request.currentSession).toBeUndefined();
  });
});
