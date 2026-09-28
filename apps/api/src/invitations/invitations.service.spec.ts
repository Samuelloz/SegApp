import { createHash } from 'node:crypto';

import { Test, type TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';

import type { CreateInvitationInput } from '@segapp/contracts';

import { PasswordService } from '../auth/password.service';
import { ContactVerificationsService } from '../contact-verifications/contact-verifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { InvitationsService } from './invitations.service';

describe('InvitationsService', () => {
  let service: InvitationsService;

  const prismaMock = {
    $transaction: jest.fn(),
    companyMembership: { findUnique: jest.fn(), create: jest.fn() },
    user: { findFirst: jest.fn(), create: jest.fn() },
    invitation: {
      updateMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };
  const passwordServiceMock = { hash: jest.fn() };
  const contactVerificationsServiceMock = { create: jest.fn() };

  const activeInviter = {
    companyId: 'company-1',
    status: 'ACTIVE',
    roles: ['ADMIN'],
    user: { active: true },
    company: { active: true, deletedAt: null },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    prismaMock.companyMembership.findUnique.mockResolvedValue(activeInviter);
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.invitation.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.invitation.findFirst.mockResolvedValue(null);
    prismaMock.invitation.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: 'invitation-1', ...data }),
    );
    prismaMock.$transaction.mockImplementation(
      (callback: (tx: typeof prismaMock) => Promise<unknown>) =>
        callback(prismaMock),
    );
    passwordServiceMock.hash.mockResolvedValue('argon2-hash');
    contactVerificationsServiceMock.create.mockResolvedValue({
      verification: {
        id: 'verification-1',
        expiresAt: new Date('2026-09-22T12:00:00.000Z'),
      },
      token: 'v'.repeat(43),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: PasswordService, useValue: passwordServiceMock },
        {
          provide: ContactVerificationsService,
          useValue: contactVerificationsServiceMock,
        },
      ],
    }).compile();

    service = module.get<InvitationsService>(InvitationsService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('crea una invitación por correo normalizado y almacena solo el hash', async () => {
    const now = new Date('2026-09-21T12:00:00.000Z');
    jest.useFakeTimers();
    jest.setSystemTime(now);

    const result = await service.create('company-1', 'owner-1', {
      email: '  Persona@Ejemplo.com  ',
      deliveryChannel: 'EMAIL',
      roles: ['VIEWER'],
    });

    expect(prismaMock.companyMembership.findUnique).toHaveBeenCalledWith({
      where: { userId: 'owner-1' },
      include: {
        company: true,
        user: { select: { active: true } },
      },
    });
    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: {
        companyId: 'company-1',
        OR: [{ email: 'persona@ejemplo.com' }],
      },
      select: { id: true },
    });
    expect(prismaMock.invitation.create).toHaveBeenCalledWith({
      data: {
        companyId: 'company-1',
        invitedById: 'owner-1',
        email: 'persona@ejemplo.com',
        phoneE164: null,
        deliveryChannel: 'EMAIL',
        roles: ['VIEWER'],
        tokenHash: createHash('sha256').update(result.token).digest('hex'),
        expiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      },
    });
    expect(result.token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(result.invitation.tokenHash).not.toBe(result.token);
    expect(result.invitation.email).toBe('persona@ejemplo.com');
  });

  it('crea una invitación solo por teléfono', async () => {
    const result = await service.create('company-1', 'owner-1', {
      phoneE164: ' +528711234567 ',
      deliveryChannel: 'WHATSAPP',
      roles: ['SALES'],
    });

    expect(prismaMock.invitation.create).toHaveBeenCalledTimes(1);
    expect(result.invitation.email).toBeNull();
    expect(result.invitation.phoneE164).toBe('+528711234567');
    expect(result.invitation.deliveryChannel).toBe('WHATSAPP');
    expect(result.invitation.roles).toEqual(['SALES']);
  });

  it('crea una invitación con correo y teléfono', async () => {
    const result = await service.create('company-1', 'owner-1', {
      email: 'persona@ejemplo.com',
      phoneE164: '+528711234567',
      deliveryChannel: 'EMAIL',
      roles: ['GUARD_MANAGER', 'SUPERVISOR'],
    });

    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: {
        companyId: 'company-1',
        OR: [{ email: 'persona@ejemplo.com' }, { phoneE164: '+528711234567' }],
      },
      select: { id: true },
    });
    expect(result.invitation.email).toBe('persona@ejemplo.com');
    expect(result.invitation.phoneE164).toBe('+528711234567');
    expect(result.invitation.deliveryChannel).toBe('EMAIL');
    expect(result.invitation.roles).toEqual(['GUARD_MANAGER', 'SUPERVISOR']);
  });

  it('permite elegir WhatsApp cuando se proporcionan ambos contactos', async () => {
    const result = await service.create('company-1', 'owner-1', {
      email: 'persona@ejemplo.com',
      phoneE164: '+528711234567',
      deliveryChannel: 'WHATSAPP',
      roles: ['VIEWER'],
    });

    expect(result.invitation.deliveryChannel).toBe('WHATSAPP');
  });

  it.each([
    ['una membresía inexistente', null],
    ['otra empresa', { ...activeInviter, companyId: 'company-2' }],
    ['una membresía suspendida', { ...activeInviter, status: 'SUSPENDED' }],
    ['un usuario inactivo', { ...activeInviter, user: { active: false } }],
    [
      'una empresa inactiva',
      { ...activeInviter, company: { active: false, deletedAt: null } },
    ],
    [
      'una empresa eliminada',
      { ...activeInviter, company: { active: true, deletedAt: new Date() } },
    ],
    ['un rol sin permisos', { ...activeInviter, roles: ['VIEWER'] }],
  ])('rechaza al invitador de %s', async (_case, inviter) => {
    prismaMock.companyMembership.findUnique.mockResolvedValue(inviter);

    await expect(
      service.create('company-1', 'owner-1', {
        email: 'persona@ejemplo.com',
        deliveryChannel: 'EMAIL',
        roles: ['VIEWER'],
      }),
    ).rejects.toThrow('No tienes permiso para invitar usuarios');

    expect(prismaMock.invitation.create).not.toHaveBeenCalled();
  });

  it.each([
    ['sin contacto', { deliveryChannel: 'EMAIL', roles: ['VIEWER'] }],
    [
      'correo faltante para EMAIL',
      {
        phoneE164: '+528711234567',
        deliveryChannel: 'EMAIL',
        roles: ['VIEWER'],
      },
    ],
    [
      'teléfono faltante para WHATSAPP',
      {
        email: 'persona@ejemplo.com',
        deliveryChannel: 'WHATSAPP',
        roles: ['VIEWER'],
      },
    ],
    [
      'sin canal de entrega',
      { email: 'persona@ejemplo.com', roles: ['VIEWER'] },
    ],
    [
      'con teléfono inválido',
      {
        phoneE164: '8711234567',
        deliveryChannel: 'WHATSAPP',
        roles: ['VIEWER'],
      },
    ],
    [
      'con rol OWNER',
      {
        email: 'persona@ejemplo.com',
        deliveryChannel: 'EMAIL',
        roles: ['OWNER'],
      },
    ],
    [
      'con roles repetidos',
      {
        email: 'persona@ejemplo.com',
        deliveryChannel: 'EMAIL',
        roles: ['VIEWER', 'VIEWER'],
      },
    ],
  ])('rechaza datos inválidos: %s', async (_case, input) => {
    const invalidInput = input as unknown as CreateInvitationInput;

    await expect(
      service.create('company-1', 'owner-1', invalidInput),
    ).rejects.toThrow();

    expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.invitation.create).not.toHaveBeenCalled();
  });

  it('rechaza un contacto ya registrado en la empresa', async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: 'user-1' });

    await expect(
      service.create('company-1', 'owner-1', {
        email: 'persona@ejemplo.com',
        phoneE164: '+528711234567',
        deliveryChannel: 'WHATSAPP',
        roles: ['VIEWER'],
      }),
    ).rejects.toThrow(
      'Estos datos de contacto ya pertenecen a un usuario de esta empresa.',
    );

    expect(prismaMock.invitation.create).not.toHaveBeenCalled();
  });

  it('busca contactos únicamente dentro de la empresa del invitador', async () => {
    prismaMock.companyMembership.findUnique.mockResolvedValue({
      ...activeInviter,
      companyId: 'company-2',
    });

    await service.create('company-2', 'owner-2', {
      email: 'persona@ejemplo.com',
      deliveryChannel: 'EMAIL',
      roles: ['VIEWER'],
    });

    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: {
        companyId: 'company-2',
        OR: [{ email: 'persona@ejemplo.com' }],
      },
      select: { id: true },
    });
    expect(prismaMock.invitation.create).toHaveBeenCalledTimes(1);
  });

  it('rechaza otra invitación vigente para el mismo contacto', async () => {
    const now = new Date('2026-09-21T12:00:00.000Z');
    jest.useFakeTimers();
    jest.setSystemTime(now);
    prismaMock.invitation.findFirst.mockResolvedValue({ id: 'invitation-1' });

    await expect(
      service.create('company-1', 'owner-1', {
        phoneE164: '+528711234567',
        deliveryChannel: 'WHATSAPP',
        roles: ['VIEWER'],
      }),
    ).rejects.toThrow('Ya existe una invitación vigente');

    expect(prismaMock.invitation.findFirst).toHaveBeenCalledWith({
      where: {
        companyId: 'company-1',
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
        OR: [{ phoneE164: '+528711234567' }],
      },
      select: { id: true },
    });
    expect(prismaMock.invitation.create).not.toHaveBeenCalled();
  });

  it('libera invitaciones vencidas de ambos contactos antes de crear otra', async () => {
    const now = new Date('2026-09-21T12:00:00.000Z');
    jest.useFakeTimers();
    jest.setSystemTime(now);

    await service.create('company-1', 'owner-1', {
      email: 'persona@ejemplo.com',
      phoneE164: '+528711234567',
      deliveryChannel: 'EMAIL',
      roles: ['VIEWER'],
    });

    expect(prismaMock.invitation.updateMany).toHaveBeenCalledWith({
      where: {
        companyId: 'company-1',
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { lte: now },
        OR: [{ email: 'persona@ejemplo.com' }, { phoneE164: '+528711234567' }],
      },
      data: { revokedAt: now },
    });
    expect(
      prismaMock.invitation.updateMany.mock.invocationCallOrder[0],
    ).toBeLessThan(prismaMock.invitation.create.mock.invocationCallOrder[0]);
  });

  it('convierte un conflicto de unicidad concurrente en un conflicto de invitación', async () => {
    prismaMock.invitation.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.2.0',
        meta: { target: 'Invitation_pending_company_email_key' },
      }),
    );

    await expect(
      service.create('company-1', 'owner-1', {
        email: 'persona@ejemplo.com',
        deliveryChannel: 'EMAIL',
        roles: ['VIEWER'],
      }),
    ).rejects.toThrow(
      'Ya existe una invitación vigente para estos datos de contacto.',
    );
  });

  it('no oculta errores de base de datos distintos a un duplicado', async () => {
    const databaseError = new Error('database unavailable');
    prismaMock.invitation.create.mockRejectedValue(databaseError);

    await expect(
      service.create('company-1', 'owner-1', {
        email: 'persona@ejemplo.com',
        deliveryChannel: 'EMAIL',
        roles: ['VIEWER'],
      }),
    ).rejects.toBe(databaseError);
  });

  it('genera un token diferente en cada invitación', async () => {
    const first = await service.create('company-1', 'owner-1', {
      email: 'primera@ejemplo.com',
      deliveryChannel: 'EMAIL',
      roles: ['VIEWER'],
    });
    const second = await service.create('company-1', 'owner-1', {
      email: 'segunda@ejemplo.com',
      deliveryChannel: 'EMAIL',
      roles: ['VIEWER'],
    });

    expect(first.token).not.toBe(second.token);
    expect(first.invitation.tokenHash).not.toBe(second.invitation.tokenHash);
  });

  describe('findValidByToken', () => {
    const token = 'a'.repeat(43);
    const now = new Date('2026-09-21T12:00:00.000Z');
    const validInvitation = {
      id: 'invitation-1',
      acceptedAt: null,
      revokedAt: null,
      expiresAt: new Date('2026-09-22T12:00:00.000Z'),
      company: { active: true, deletedAt: null },
    };

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(now);
      prismaMock.invitation.findUnique.mockResolvedValue(validInvitation);
    });

    it('busca el hash y devuelve una invitación vigente', async () => {
      await expect(service.findValidByToken(token)).resolves.toBe(
        validInvitation,
      );

      expect(prismaMock.invitation.findUnique).toHaveBeenCalledWith({
        where: {
          tokenHash: createHash('sha256').update(token).digest('hex'),
        },
        include: { company: true },
      });
    });

    it.each(['', 'a'.repeat(42), `${'a'.repeat(42)}!`])(
      'rechaza un token mal formado sin consultar la base de datos',
      async (invalidToken) => {
        await expect(service.findValidByToken(invalidToken)).rejects.toThrow(
          'La invitación no es válida o ha vencido.',
        );

        expect(prismaMock.invitation.findUnique).not.toHaveBeenCalled();
      },
    );

    it.each([
      ['inexistente', null],
      ['aceptada', { ...validInvitation, acceptedAt: now }],
      ['revocada', { ...validInvitation, revokedAt: now }],
      ['vencida exactamente ahora', { ...validInvitation, expiresAt: now }],
      [
        'vencida antes de ahora',
        { ...validInvitation, expiresAt: new Date(now.getTime() - 1) },
      ],
      [
        'de una empresa inactiva',
        { ...validInvitation, company: { active: false, deletedAt: null } },
      ],
      [
        'de una empresa eliminada',
        { ...validInvitation, company: { active: true, deletedAt: now } },
      ],
    ])('rechaza una invitación %s', async (_case, invitation) => {
      prismaMock.invitation.findUnique.mockResolvedValue(invitation);

      await expect(service.findValidByToken(token)).rejects.toThrow(
        'La invitación no es válida o ha vencido.',
      );
    });
  });

  describe('accept', () => {
    const token = 'a'.repeat(43);
    const now = new Date('2026-09-21T12:00:00.000Z');
    const emailInvitation = {
      id: 'invitation-1',
      companyId: 'company-1',
      email: 'persona@ejemplo.com',
      phoneE164: '+528711234567',
      deliveryChannel: 'EMAIL',
      roles: ['GUARD_MANAGER', 'SUPERVISOR'],
      acceptedAt: null,
      revokedAt: null,
      expiresAt: new Date('2026-09-22T12:00:00.000Z'),
      company: { name: 'LozCorp', active: true, deletedAt: null },
    };
    const input = {
      token,
      name: 'Persona Invitada',
      password: 'una contraseña suficientemente larga',
    };

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(now);
      prismaMock.invitation.findUnique.mockResolvedValue(emailInvitation);
      prismaMock.invitation.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.user.create.mockResolvedValue({ id: 'user-1' });
      prismaMock.companyMembership.create.mockResolvedValue({
        id: 'membership-1',
        status: 'PENDING',
      });
    });

    it('crea una cuenta y membresía pendiente usando solo el contacto de entrega', async () => {
      const result = await service.accept({
        ...input,
        email: ' PERSONA@EJEMPLO.COM ',
      });

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaMock.invitation.findUnique).toHaveBeenCalledWith({
        where: { tokenHash: createHash('sha256').update(token).digest('hex') },
        include: { company: true },
      });
      expect(prismaMock.invitation.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'invitation-1',
          acceptedAt: null,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { acceptedAt: now },
      });
      expect(passwordServiceMock.hash).toHaveBeenCalledWith(input.password);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          companyId: 'company-1',
          name: input.name,
          passwordHash: 'argon2-hash',
          email: 'persona@ejemplo.com',
          phoneE164: null,
        },
        select: { id: true },
      });
      expect(prismaMock.companyMembership.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          companyId: 'company-1',
          roles: ['GUARD_MANAGER', 'SUPERVISOR'],
          status: 'PENDING',
        },
        select: { id: true, status: true },
      });
      expect(contactVerificationsServiceMock.create).toHaveBeenCalledWith(
        prismaMock,
        {
          userId: 'user-1',
          deliveryChannel: 'EMAIL',
          contactValue: 'persona@ejemplo.com',
        },
      );
      expect(result).toEqual({
        membershipId: 'membership-1',
        companyName: 'LozCorp',
        status: 'PENDING',
        verificationToken: 'v'.repeat(43),
        verificationExpiresAt: '2026-09-22T12:00:00.000Z',
      });
    });

    it('usa solo el teléfono si la entrega fue por WhatsApp', async () => {
      prismaMock.invitation.findUnique.mockResolvedValue({
        ...emailInvitation,
        deliveryChannel: 'WHATSAPP',
      });

      await service.accept({ ...input, phoneE164: '+528711234567' });

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          companyId: 'company-1',
          name: input.name,
          passwordHash: 'argon2-hash',
          email: null,
          phoneE164: '+528711234567',
        },
        select: { id: true },
      });
      expect(contactVerificationsServiceMock.create).toHaveBeenCalledWith(
        prismaMock,
        {
          userId: 'user-1',
          deliveryChannel: 'WHATSAPP',
          contactValue: '+528711234567',
        },
      );
    });

    it.each([
      ['token mal formado', { ...input, token: 'invalid' }],
      ['contraseña corta', { ...input, password: 'corta' }],
      ['correo inválido', { ...input, email: 'incorrecto' }],
    ])('rechaza %s antes de iniciar la transacción', async (_case, body) => {
      await expect(service.accept(body)).rejects.toThrow();
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it.each([
      ['inexistente', null],
      ['aceptada', { ...emailInvitation, acceptedAt: now }],
      ['revocada', { ...emailInvitation, revokedAt: now }],
      ['vencida', { ...emailInvitation, expiresAt: now }],
      [
        'de empresa inactiva',
        {
          ...emailInvitation,
          company: { ...emailInvitation.company, active: false },
        },
      ],
      [
        'de empresa eliminada',
        {
          ...emailInvitation,
          company: { ...emailInvitation.company, deletedAt: now },
        },
      ],
    ])(
      'rechaza una invitación %s sin reclamarla',
      async (_case, invitation) => {
        prismaMock.invitation.findUnique.mockResolvedValue(invitation);

        await expect(service.accept(input)).rejects.toThrow(
          'La invitación no es válida o ha vencido.',
        );
        expect(prismaMock.invitation.updateMany).not.toHaveBeenCalled();
        expect(prismaMock.user.create).not.toHaveBeenCalled();
      },
    );

    it.each([
      ['correo de entrega cambiado', { ...input, email: 'otro@ejemplo.com' }],
      ['teléfono adicional', { ...input, phoneE164: '+528700000000' }],
    ])('rechaza %s sin reclamar el enlace', async (_case, body) => {
      await expect(service.accept(body)).rejects.toThrow(
        'El contacto adicional deberá agregarse',
      );
      expect(prismaMock.invitation.updateMany).not.toHaveBeenCalled();
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it('rechaza una invitación sin el contacto del canal elegido', async () => {
      prismaMock.invitation.findUnique.mockResolvedValue({
        ...emailInvitation,
        email: null,
      });

      await expect(service.accept(input)).rejects.toThrow(
        'La invitación no es válida o ha vencido.',
      );
      expect(prismaMock.invitation.updateMany).not.toHaveBeenCalled();
    });

    it('solo una petición puede reclamar el mismo token', async () => {
      prismaMock.invitation.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 0 });

      const attempts = await Promise.allSettled([
        service.accept(input),
        service.accept(input),
      ]);

      expect(
        attempts.filter((attempt) => attempt.status === 'fulfilled'),
      ).toHaveLength(1);
      expect(
        attempts.filter((attempt) => attempt.status === 'rejected'),
      ).toHaveLength(1);
      expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.companyMembership.create).toHaveBeenCalledTimes(1);
    });

    it('rechaza un contacto ya registrado en la empresa de la invitación', async () => {
      prismaMock.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '7.2.0',
          meta: { target: ['companyId', 'email'] },
        }),
      );

      await expect(service.accept(input)).rejects.toThrow(
        'Estos datos de contacto ya pertenecen a un usuario de esta empresa.',
      );
      expect(prismaMock.companyMembership.create).not.toHaveBeenCalled();
    });

    it('propaga otros errores de base de datos', async () => {
      const databaseError = new Error('database unavailable');
      prismaMock.companyMembership.create.mockRejectedValue(databaseError);

      await expect(service.accept(input)).rejects.toBe(databaseError);
    });
  });
});
