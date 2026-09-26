import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA, HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Response } from 'express';

import { ContactVerificationsController } from './contact-verifications.controller';
import { ContactVerificationsService } from './contact-verifications.service';

describe('ContactVerificationsController', () => {
  let controller: ContactVerificationsController;

  const contactVerificationsServiceMock = {
    verify: jest.fn(),
  };
  const responseMock = {
    setHeader: jest.fn(),
  };
  const response = responseMock as unknown as Response;
  const token = 'a'.repeat(43);

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactVerificationsController],
      providers: [
        {
          provide: ContactVerificationsService,
          useValue: contactVerificationsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<ContactVerificationsController>(
      ContactVerificationsController,
    );
  });

  it('permite verificar el contacto sin una sesión activa y responde con 200', () => {
    const reflector = new Reflector();
    const controllerGuards = reflector.get<unknown[]>(
      GUARDS_METADATA,
      ContactVerificationsController,
    );
    const methodGuards = reflector.get<unknown[]>(
      GUARDS_METADATA,
      // Solo se usa la referencia del método para leer sus metadatos.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      ContactVerificationsController.prototype.verify,
    );
    const statusCode = reflector.get<number>(
      HTTP_CODE_METADATA,
      // Solo se usa la referencia del método para leer sus metadatos.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      ContactVerificationsController.prototype.verify,
    );

    expect(controllerGuards).toBeUndefined();
    expect(methodGuards).toBeUndefined();
    expect(statusCode).toBe(200);
  });

  it.each([
    ['un cuerpo vacío', {}],
    ['un token mal formado', { token: 'incorrecto' }],
  ])('rechaza %s antes de llamar al servicio', async (_case, body) => {
    await expect(controller.verify(body, response)).rejects.toThrow(
      BadRequestException,
    );
    expect(contactVerificationsServiceMock.verify).not.toHaveBeenCalled();
    expect(responseMock.setHeader).not.toHaveBeenCalled();
  });

  it('normaliza el token, verifica el contacto y evita guardar la respuesta en caché', async () => {
    const verified = {
      membershipId: 'membership-1',
      companyName: 'LozCorp',
      status: 'ACTIVE',
      deliveryChannel: 'EMAIL',
    };
    contactVerificationsServiceMock.verify.mockResolvedValue(verified);

    const result = await controller.verify({ token: `  ${token}  ` }, response);

    expect(contactVerificationsServiceMock.verify).toHaveBeenCalledWith(token);
    expect(responseMock.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'no-store',
    );
    expect(result).toBe(verified);
  });

  it('propaga los errores del servicio sin declarar éxito ni caché', async () => {
    const error = new BadRequestException(
      'La verificación no es válida o ha vencido.',
    );
    contactVerificationsServiceMock.verify.mockRejectedValue(error);

    await expect(controller.verify({ token }, response)).rejects.toBe(error);
    expect(responseMock.setHeader).not.toHaveBeenCalled();
  });
});
