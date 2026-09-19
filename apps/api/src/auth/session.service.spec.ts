import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { SessionService } from './session.service';
import { SessionTokenService } from './session-token.service';

describe('SessionService', () => {
  let service: SessionService;

  const prismaMock = {
    companyMembership: {
      findUnique: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const sessionTokenServiceMock = {
    generate: jest.fn(),
    hash: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: SessionTokenService,
          useValue: sessionTokenServiceMock,
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('crea una sesión para una membresía activa', async () => {
    const currentDate = new Date('2026-09-19T08:00:00.000Z');
    const expectedExpiration = new Date(
      currentDate.getTime() + 12 * 60 * 60 * 1000,
    );

    jest.useFakeTimers();
    jest.setSystemTime(currentDate);

    prismaMock.companyMembership.findUnique.mockResolvedValue({
      id: 'membership-1',
      status: 'ACTIVE',
      company: {
        active: true,
        deletedAt: null,
      },
    });

    sessionTokenServiceMock.generate.mockReturnValue({
      token: 'token-original',
      tokenHash: 'hash-del-token',
    });

    const createdSession = {
      id: 'session-1',
      membershipId: 'membership-1',
      tokenHash: 'hash-del-token',
      expiresAt: expectedExpiration,
    };

    prismaMock.session.create.mockResolvedValue(createdSession);

    const result = await service.create('membership-1');

    expect(prismaMock.companyMembership.findUnique).toHaveBeenCalledWith({
      where: {
        id: 'membership-1',
      },
      include: {
        company: true,
      },
    });

    expect(sessionTokenServiceMock.generate).toHaveBeenCalledTimes(1);

    expect(prismaMock.session.create).toHaveBeenCalledWith({
      data: {
        membershipId: 'membership-1',
        tokenHash: 'hash-del-token',
        expiresAt: expectedExpiration,
      },
    });

    expect(result).toEqual({
      token: 'token-original',
      session: createdSession,
    });
  });

  it.each([
    ['una membresía inexistente', null],
    [
      'una membresía suspendida',
      {
        id: 'membership-1',
        status: 'SUSPENDED',
        company: {
          active: true,
          deletedAt: null,
        },
      },
    ],
    [
      'una empresa inactiva',
      {
        id: 'membership-1',
        status: 'ACTIVE',
        company: {
          active: false,
          deletedAt: null,
        },
      },
    ],
    [
      'una empresa eliminada',
      {
        id: 'membership-1',
        status: 'ACTIVE',
        company: {
          active: true,
          deletedAt: new Date('2026-09-18T00:00:00.000Z'),
        },
      },
    ],
  ])('rechaza %s', async (_scenario, membership) => {
    prismaMock.companyMembership.findUnique.mockResolvedValue(membership);

    await expect(service.create('membership-1')).rejects.toThrow(
      'La cuenta no tiene acceso a una empresa activa.',
    );

    expect(sessionTokenServiceMock.generate).not.toHaveBeenCalled();
    expect(prismaMock.session.create).not.toHaveBeenCalled();
  });

  describe('findValidByToken', () => {
    const currentDate = new Date('2026-09-19T08:00:00.000Z');

    const validSession = {
      id: 'session-1',
      membershipId: 'membership-1',
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

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(currentDate);

      sessionTokenServiceMock.hash.mockReturnValue('hash-del-token');
    });

    it('devuelve una sesión válida a partir del token original', async () => {
      prismaMock.session.findUnique.mockResolvedValue(validSession);

      const result = await service.findValidByToken('token-original');

      expect(sessionTokenServiceMock.hash).toHaveBeenCalledWith(
        'token-original',
      );

      expect(prismaMock.session.findUnique).toHaveBeenCalledWith({
        where: {
          tokenHash: 'hash-del-token',
        },
        include: {
          membership: {
            include: {
              user: true,
              company: true,
            },
          },
        },
      });

      expect(result).toEqual(validSession);
    });

    it.each([
      ['una sesión inexistente', null],
      [
        'una sesión revocada',
        {
          ...validSession,
          revokedAt: new Date('2026-09-19T07:00:00.000Z'),
        },
      ],
      [
        'una sesión vencida',
        {
          ...validSession,
          expiresAt: new Date('2026-09-19T08:00:00.000Z'),
        },
      ],
      [
        'un usuario inactivo',
        {
          ...validSession,
          membership: {
            ...validSession.membership,
            user: {
              ...validSession.membership.user,
              active: false,
            },
          },
        },
      ],
      [
        'una membresía suspendida',
        {
          ...validSession,
          membership: {
            ...validSession.membership,
            status: 'SUSPENDED',
          },
        },
      ],
      [
        'una empresa inactiva',
        {
          ...validSession,
          membership: {
            ...validSession.membership,
            company: {
              ...validSession.membership.company,
              active: false,
            },
          },
        },
      ],
      [
        'una empresa eliminada',
        {
          ...validSession,
          membership: {
            ...validSession.membership,
            company: {
              ...validSession.membership.company,
              deletedAt: new Date('2026-09-18T00:00:00.000Z'),
            },
          },
        },
      ],
    ])('rechaza %s', async (_scenario, session) => {
      prismaMock.session.findUnique.mockResolvedValue(session);

      await expect(service.findValidByToken('token-original')).rejects.toThrow(
        'La sesión no es válida o ha expirado.',
      );
    });
  });
});
