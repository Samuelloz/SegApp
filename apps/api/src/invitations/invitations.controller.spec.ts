import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { GUARDS_METADATA, HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';

import type { Response } from 'express';

import { ROLES_KEY } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  type AuthenticatedRequest,
  SessionAuthGuard,
} from '../auth/session-auth.guard';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

describe('InvitationsController', () => {
  let controller: InvitationsController;

  const invitationsServiceMock = {
    findValidByToken: jest.fn(),
    create: jest.fn(),
    accept: jest.fn(),
  };

  const responseMock = {
    setHeader: jest.fn(),
  };

  const token = 'a'.repeat(43);
  const response = responseMock as unknown as Response;
  const authenticatedRequest = {
    currentSession: { membership: { userId: 'owner-1' } },
  } as unknown as AuthenticatedRequest;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvitationsController],
      providers: [
        { provide: InvitationsService, useValue: invitationsServiceMock },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: jest.fn() })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn() })
      .compile();

    controller = module.get<InvitationsController>(InvitationsController);
  });

  it('permite consultar la invitación sin una sesión activa', () => {
    const reflector = new Reflector();
    const controllerGuards = reflector.get<unknown[]>(
      GUARDS_METADATA,
      InvitationsController,
    );
    const methodGuards = reflector.get<unknown[]>(
      GUARDS_METADATA,
      // Solo se usa la referencia del método para leer sus metadatos.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      InvitationsController.prototype.findValidByToken,
    );

    expect(controllerGuards).toBeUndefined();
    expect(methodGuards).toBeUndefined();
  });

  it('devuelve solo los datos públicos y evita guardar la respuesta en caché', async () => {
    invitationsServiceMock.findValidByToken.mockResolvedValue({
      id: 'invitation-1',
      tokenHash: 'hash-secreto',
      invitedById: 'user-1',
      company: { name: 'LozCorp', rfc: 'RFC-privado' },
      email: 'persona@ejemplo.com',
      phoneE164: '+528711234567',
      deliveryChannel: 'WHATSAPP',
      roles: ['SALES', 'CONTRACT_MANAGER'],
      expiresAt: new Date('2026-09-23T12:00:00.000Z'),
    });

    const result = await controller.findValidByToken(token, response);

    expect(invitationsServiceMock.findValidByToken).toHaveBeenCalledWith(token);
    expect(responseMock.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'no-store',
    );
    expect(result).toEqual({
      companyName: 'LozCorp',
      email: 'persona@ejemplo.com',
      phoneE164: '+528711234567',
      deliveryChannel: 'WHATSAPP',
      roles: ['SALES', 'CONTRACT_MANAGER'],
      expiresAt: '2026-09-23T12:00:00.000Z',
    });
  });

  it('conserva los contactos opcionales vacíos', async () => {
    invitationsServiceMock.findValidByToken.mockResolvedValue({
      company: { name: 'LozCorp' },
      email: null,
      phoneE164: '+528711234567',
      deliveryChannel: 'WHATSAPP',
      roles: ['VIEWER'],
      expiresAt: new Date('2026-09-23T12:00:00.000Z'),
    });

    const result = await controller.findValidByToken(token, response);

    expect(result.email).toBeNull();
    expect(result.phoneE164).toBe('+528711234567');
  });

  it('propaga el rechazo de una invitación inválida o vencida', async () => {
    const error = new BadRequestException(
      'La invitación no es válida o ha vencido.',
    );
    invitationsServiceMock.findValidByToken.mockRejectedValue(error);

    await expect(controller.findValidByToken(token, response)).rejects.toBe(
      error,
    );
    expect(responseMock.setHeader).not.toHaveBeenCalled();
  });

  it('protege la creación con sesión y roles OWNER o ADMIN', () => {
    const reflector = new Reflector();
    // Solo se usa la referencia del método para leer sus metadatos.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const create = InvitationsController.prototype.create;

    expect(reflector.get<unknown[]>(GUARDS_METADATA, create)).toEqual([
      SessionAuthGuard,
      RolesGuard,
    ]);
    expect(reflector.get<string[]>(ROLES_KEY, create)).toEqual([
      'OWNER',
      'ADMIN',
    ]);
    expect(
      reflector.get<unknown[]>(GUARDS_METADATA, InvitationsController),
    ).toBeUndefined();
  });

  it('rechaza la creación sin una sesión actual', async () => {
    await expect(
      controller.create(
        'company-1',
        {} as AuthenticatedRequest,
        {
          email: 'persona@ejemplo.com',
          deliveryChannel: 'EMAIL',
          roles: ['VIEWER'],
        },
        response,
      ),
    ).rejects.toThrow(UnauthorizedException);

    expect(invitationsServiceMock.create).not.toHaveBeenCalled();
    expect(responseMock.setHeader).not.toHaveBeenCalled();
  });

  it.each([
    ['sin contacto', { deliveryChannel: 'EMAIL', roles: ['VIEWER'] }],
    [
      'sin teléfono para WhatsApp',
      {
        email: 'persona@ejemplo.com',
        deliveryChannel: 'WHATSAPP',
        roles: ['VIEWER'],
      },
    ],
    [
      'con un rol no permitido',
      {
        email: 'persona@ejemplo.com',
        deliveryChannel: 'EMAIL',
        roles: ['OWNER'],
      },
    ],
  ])('rechaza una invitación %s', async (_case, body) => {
    await expect(
      controller.create('company-1', authenticatedRequest, body, response),
    ).rejects.toThrow(BadRequestException);

    expect(invitationsServiceMock.create).not.toHaveBeenCalled();
    expect(responseMock.setHeader).not.toHaveBeenCalled();
  });

  it('crea una invitación con la empresa y el usuario de la sesión sin exponer datos internos', async () => {
    invitationsServiceMock.create.mockResolvedValue({
      token,
      invitation: {
        id: 'invitation-1',
        tokenHash: 'hash-secreto',
        invitedById: 'owner-1',
        companyId: 'company-1',
        email: 'persona@ejemplo.com',
        phoneE164: null,
        deliveryChannel: 'EMAIL',
        roles: ['SALES'],
        expiresAt: new Date('2026-09-23T12:00:00.000Z'),
      },
    });

    const result = await controller.create(
      'company-1',
      authenticatedRequest,
      {
        email: '  Persona@Ejemplo.com  ',
        deliveryChannel: 'EMAIL',
        roles: ['SALES'],
      },
      response,
    );

    expect(invitationsServiceMock.create).toHaveBeenCalledWith(
      'company-1',
      'owner-1',
      {
        email: 'persona@ejemplo.com',
        deliveryChannel: 'EMAIL',
        roles: ['SALES'],
      },
    );
    expect(responseMock.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'no-store',
    );
    expect(result).toEqual({
      id: 'invitation-1',
      token,
      email: 'persona@ejemplo.com',
      phoneE164: null,
      deliveryChannel: 'EMAIL',
      roles: ['SALES'],
      expiresAt: '2026-09-23T12:00:00.000Z',
    });
  });

  it('propaga los conflictos al intentar crear una invitación duplicada', async () => {
    const error = new ConflictException(
      'Ya existe una invitación vigente para estos datos de contacto.',
    );
    invitationsServiceMock.create.mockRejectedValue(error);

    await expect(
      controller.create(
        'company-1',
        authenticatedRequest,
        {
          phoneE164: '+528711234567',
          deliveryChannel: 'WHATSAPP',
          roles: ['VIEWER'],
        },
        response,
      ),
    ).rejects.toBe(error);
    expect(responseMock.setHeader).not.toHaveBeenCalled();
  });

  it('deja pública la aceptación y responde con HTTP 200', () => {
    const reflector = new Reflector();
    // Solo se usa la referencia del método para leer sus metadatos.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const accept = InvitationsController.prototype.accept;

    expect(reflector.get<unknown[]>(GUARDS_METADATA, accept)).toBeUndefined();
    expect(reflector.get<number>(HTTP_CODE_METADATA, accept)).toBe(200);
  });

  it.each([
    [
      'token inválido',
      {
        token: 'incorrecto',
        name: 'Ana',
        password: 'una contraseña suficientemente larga',
      },
    ],
    ['contraseña corta', { token, name: 'Ana', password: 'corta' }],
  ])('rechaza la aceptación con %s', async (_case, body) => {
    await expect(controller.accept(body, response)).rejects.toThrow(
      BadRequestException,
    );
    expect(invitationsServiceMock.accept).not.toHaveBeenCalled();
    expect(responseMock.setHeader).not.toHaveBeenCalled();
  });

  it('acepta la invitación y devuelve el enlace de verificación sin crear una sesión', async () => {
    invitationsServiceMock.accept.mockResolvedValue({
      membershipId: 'membership-1',
      companyName: 'LozCorp',
      status: 'PENDING',
      verificationToken: 'v'.repeat(43),
      verificationExpiresAt: '2026-09-22T12:00:00.000Z',
    });

    const result = await controller.accept(
      {
        token,
        name: ' Ana ',
        email: ' PERSONA@EJEMPLO.COM ',
        password: 'una contraseña suficientemente larga',
      },
      response,
    );

    expect(invitationsServiceMock.accept).toHaveBeenCalledWith({
      token,
      name: 'Ana',
      email: 'persona@ejemplo.com',
      password: 'una contraseña suficientemente larga',
    });
    expect(responseMock.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'no-store',
    );
    expect(result).toEqual({
      membershipId: 'membership-1',
      companyName: 'LozCorp',
      status: 'PENDING',
      verificationToken: 'v'.repeat(43),
      verificationExpiresAt: '2026-09-22T12:00:00.000Z',
    });
  });

  it('propaga un rechazo del servicio sin declarar éxito ni caché', async () => {
    const error = new ConflictException('Invitación ya aceptada.');
    invitationsServiceMock.accept.mockRejectedValue(error);

    await expect(
      controller.accept(
        {
          token,
          name: 'Ana',
          password: 'una contraseña suficientemente larga',
        },
        response,
      ),
    ).rejects.toBe(error);
    expect(responseMock.setHeader).not.toHaveBeenCalled();
  });
});
