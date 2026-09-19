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
    },
  };

  const sessionTokenServiceMock = {
    generate: jest.fn(),
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
});
