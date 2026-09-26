import { createHash } from 'node:crypto';

import type { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { ContactVerificationsService } from './contact-verifications.service';

describe('ContactVerificationsService', () => {
  let service: ContactVerificationsService;

  const transactionMock = {
    $transaction: jest.fn(),
    contactVerification: {
      updateMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    companyMembership: {
      updateMany: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ContactVerificationsService(
      transactionMock as unknown as PrismaService,
    );

    transactionMock.contactVerification.updateMany.mockResolvedValue({
      count: 0,
    });
    transactionMock.contactVerification.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: 'verification-1', ...data }),
    );
    transactionMock.$transaction.mockImplementation(
      (callback: (transaction: typeof transactionMock) => Promise<unknown>) =>
        callback(transactionMock),
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('revoca las verificaciones pendientes del mismo usuario y canal', async () => {
    const now = new Date('2026-09-25T12:00:00.000Z');
    jest.useFakeTimers();
    jest.setSystemTime(now);

    await service.create(
      transactionMock as unknown as Prisma.TransactionClient,
      {
        userId: 'user-1',
        deliveryChannel: 'EMAIL',
        contactValue: 'persona@ejemplo.com',
      },
    );

    expect(transactionMock.contactVerification.updateMany).toHaveBeenCalledWith(
      {
        where: {
          userId: 'user-1',
          deliveryChannel: 'EMAIL',
          consumedAt: null,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
        },
      },
    );
  });

  it('crea una verificación por 24 horas y almacena únicamente el hash', async () => {
    const now = new Date('2026-09-25T12:00:00.000Z');
    jest.useFakeTimers();
    jest.setSystemTime(now);

    const result = await service.create(
      transactionMock as unknown as Prisma.TransactionClient,
      {
        userId: 'user-1',
        deliveryChannel: 'WHATSAPP',
        contactValue: '+528711440644',
      },
    );

    expect(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(result.verification).toEqual(
      expect.objectContaining({ id: 'verification-1' }),
    );
    expect(transactionMock.contactVerification.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        deliveryChannel: 'WHATSAPP',
        contactValue: '+528711440644',
        tokenHash: createHash('sha256').update(result.token).digest('hex'),
        expiresAt: new Date('2026-09-26T12:00:00.000Z'),
      },
    });

    const createInput = transactionMock.contactVerification.create.mock
      .calls[0]?.[0].data as Record<string, unknown>;
    expect(createInput).not.toHaveProperty('token');
  });

  it('genera un token diferente para cada verificación', async () => {
    const transaction = transactionMock as unknown as Prisma.TransactionClient;
    const input = {
      userId: 'user-1',
      deliveryChannel: 'EMAIL' as const,
      contactValue: 'persona@ejemplo.com',
    };

    const first = await service.create(transaction, input);
    const second = await service.create(transaction, input);

    expect(first.token).not.toBe(second.token);
  });

  describe('verify', () => {
    const token = 'a'.repeat(43);
    const now = new Date('2026-09-25T12:00:00.000Z');
    const validVerification = {
      id: 'verification-1',
      deliveryChannel: 'EMAIL',
      contactValue: 'persona@ejemplo.com',
      expiresAt: new Date('2026-09-26T12:00:00.000Z'),
      consumedAt: null,
      revokedAt: null,
      user: {
        id: 'user-1',
        active: true,
        email: 'persona@ejemplo.com',
        phoneE164: null,
        membership: {
          id: 'membership-1',
          status: 'PENDING',
          company: {
            name: 'LozCorp',
            active: true,
            deletedAt: null,
          },
        },
      },
    };

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(now);
      transactionMock.contactVerification.findUnique.mockResolvedValue(
        validVerification,
      );
      transactionMock.contactVerification.updateMany.mockResolvedValue({
        count: 1,
      });
      transactionMock.companyMembership.updateMany.mockResolvedValue({
        count: 1,
      });
      transactionMock.user.update.mockResolvedValue({ id: 'user-1' });
    });

    it('verifica el correo y activa la membresía dentro de una transacción', async () => {
      const result = await service.verify(token);

      expect(transactionMock.$transaction).toHaveBeenCalledTimes(1);
      expect(
        transactionMock.contactVerification.findUnique,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tokenHash: createHash('sha256').update(token).digest('hex'),
          },
        }),
      );
      expect(
        transactionMock.contactVerification.updateMany,
      ).toHaveBeenCalledWith({
        where: {
          id: 'verification-1',
          consumedAt: null,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { consumedAt: now },
      });
      expect(transactionMock.companyMembership.updateMany).toHaveBeenCalledWith(
        {
          where: {
            id: 'membership-1',
            status: 'PENDING',
          },
          data: { status: 'ACTIVE' },
        },
      );
      expect(transactionMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { emailVerifiedAt: now },
      });
      expect(result).toEqual({
        membershipId: 'membership-1',
        companyName: 'LozCorp',
        status: 'ACTIVE',
        deliveryChannel: 'EMAIL',
      });
    });

    it('verifica el teléfono cuando el canal es WhatsApp', async () => {
      transactionMock.contactVerification.findUnique.mockResolvedValue({
        ...validVerification,
        deliveryChannel: 'WHATSAPP',
        contactValue: '+528711440644',
        user: {
          ...validVerification.user,
          email: null,
          phoneE164: '+528711440644',
        },
      });

      const result = await service.verify(token);

      expect(transactionMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { phoneVerifiedAt: now },
      });
      expect(result.deliveryChannel).toBe('WHATSAPP');
    });

    it('rechaza un token mal formado antes de iniciar la transacción', async () => {
      await expect(service.verify('incorrecto')).rejects.toThrow(
        'La verificación no es válida o ha vencido.',
      );
      expect(transactionMock.$transaction).not.toHaveBeenCalled();
    });

    it.each([
      ['inexistente', null],
      ['consumida', { ...validVerification, consumedAt: now }],
      ['revocada', { ...validVerification, revokedAt: now }],
      ['vencida', { ...validVerification, expiresAt: now }],
      [
        'de usuario inactivo',
        {
          ...validVerification,
          user: { ...validVerification.user, active: false },
        },
      ],
      [
        'sin membresía',
        {
          ...validVerification,
          user: { ...validVerification.user, membership: null },
        },
      ],
      [
        'con membresía activa',
        {
          ...validVerification,
          user: {
            ...validVerification.user,
            membership: {
              ...validVerification.user.membership,
              status: 'ACTIVE',
            },
          },
        },
      ],
      [
        'de empresa inactiva',
        {
          ...validVerification,
          user: {
            ...validVerification.user,
            membership: {
              ...validVerification.user.membership,
              company: {
                ...validVerification.user.membership.company,
                active: false,
              },
            },
          },
        },
      ],
      [
        'de empresa eliminada',
        {
          ...validVerification,
          user: {
            ...validVerification.user,
            membership: {
              ...validVerification.user.membership,
              company: {
                ...validVerification.user.membership.company,
                deletedAt: now,
              },
            },
          },
        },
      ],
      [
        'con contacto diferente',
        { ...validVerification, contactValue: 'otra@ejemplo.com' },
      ],
    ])('rechaza una verificación %s sin consumirla', async (_case, value) => {
      transactionMock.contactVerification.findUnique.mockResolvedValue(value);

      await expect(service.verify(token)).rejects.toThrow(
        'La verificación no es válida o ha vencido.',
      );
      expect(
        transactionMock.contactVerification.updateMany,
      ).not.toHaveBeenCalled();
      expect(
        transactionMock.companyMembership.updateMany,
      ).not.toHaveBeenCalled();
      expect(transactionMock.user.update).not.toHaveBeenCalled();
    });

    it('rechaza el token si otra solicitud ya lo consumió', async () => {
      transactionMock.contactVerification.updateMany.mockResolvedValue({
        count: 0,
      });

      await expect(service.verify(token)).rejects.toThrow(
        'La verificación no es válida o ha vencido.',
      );
      expect(
        transactionMock.companyMembership.updateMany,
      ).not.toHaveBeenCalled();
      expect(transactionMock.user.update).not.toHaveBeenCalled();
    });

    it('permite que solo una solicitud simultánea consuma el token', async () => {
      transactionMock.contactVerification.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 0 });

      const attempts = await Promise.allSettled([
        service.verify(token),
        service.verify(token),
      ]);

      expect(
        attempts.filter((attempt) => attempt.status === 'fulfilled'),
      ).toHaveLength(1);
      expect(
        attempts.filter((attempt) => attempt.status === 'rejected'),
      ).toHaveLength(1);
      expect(
        transactionMock.companyMembership.updateMany,
      ).toHaveBeenCalledTimes(1);
      expect(transactionMock.user.update).toHaveBeenCalledTimes(1);
    });

    it('rechaza la activación si la membresía dejó de estar pendiente', async () => {
      transactionMock.companyMembership.updateMany.mockResolvedValue({
        count: 0,
      });

      await expect(service.verify(token)).rejects.toThrow(
        'La verificación no es válida o ha vencido.',
      );
      expect(transactionMock.user.update).not.toHaveBeenCalled();
    });
  });
});
