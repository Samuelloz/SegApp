import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';

import type { MembershipRole } from '@segapp/contracts';

import { ROLES_KEY } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

describe('CompaniesController', () => {
  let controller: CompaniesController;

  const companiesServiceMock = {
    findCurrent: jest.fn(),
    findUsers: jest.fn(),
    updateCurrent: jest.fn(),
  };

  const sessionAuthGuardMock = {
    canActivate: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesController],
      providers: [
        {
          provide: CompaniesService,
          useValue: companiesServiceMock,
        },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue(sessionAuthGuardMock)
      .compile();

    controller = module.get<CompaniesController>(CompaniesController);
  });

  it('protege todas las rutas de empresas con los guards en el orden correcto', () => {
    const reflector = new Reflector();
    const guards = reflector.get<unknown[]>(
      GUARDS_METADATA,
      CompaniesController,
    );

    expect(guards).toEqual([SessionAuthGuard, RolesGuard]);
  });

  it('reserva la consulta de empresa a OWNER y ADMIN', () => {
    const reflector = new Reflector();
    const roles = reflector.get<MembershipRole[]>(
      ROLES_KEY,
      // Solo se usa la referencia del método para leer sus metadatos.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      CompaniesController.prototype.findCurrent,
    );

    expect(roles).toEqual(['OWNER', 'ADMIN']);
  });

  it('limita la actualización de la empresa a OWNER y ADMIN', () => {
    const reflector = new Reflector();
    const roles = reflector.get<MembershipRole[]>(
      ROLES_KEY,
      // Solo se usa la referencia del método para leer sus metadatos.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      CompaniesController.prototype.updateCurrent,
    );

    expect(roles).toEqual(['OWNER', 'ADMIN']);
  });

  it('limita la consulta de usuarios a OWNER y ADMIN', () => {
    const reflector = new Reflector();
    const roles = reflector.get<MembershipRole[]>(
      ROLES_KEY,
      // Solo se usa la referencia del método para leer sus metadatos.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      CompaniesController.prototype.findUsers,
    );

    expect(roles).toEqual(['OWNER', 'ADMIN']);
  });

  it('consulta la empresa obtenida desde la sesión', async () => {
    const company = {
      id: 'company-1',
      name: 'Seguridad del Norte',
    };

    companiesServiceMock.findCurrent.mockResolvedValue(company);

    const result = await controller.findCurrent('company-1');

    expect(companiesServiceMock.findCurrent).toHaveBeenCalledWith('company-1');
    expect(result).toEqual(company);
  });

  it('consulta los usuarios de la empresa obtenida desde la sesión', async () => {
    const users = [{ id: 'membership-1', user: { name: 'Samuel Lozano' } }];
    companiesServiceMock.findUsers.mockResolvedValue(users);

    const result = await controller.findUsers('company-1');

    expect(companiesServiceMock.findUsers).toHaveBeenCalledWith('company-1');
    expect(result).toEqual(users);
  });

  it('rechaza datos de actualización inválidos', () => {
    expect(() => controller.updateCurrent('company-1', {})).toThrow(
      BadRequestException,
    );

    expect(companiesServiceMock.updateCurrent).not.toHaveBeenCalled();
  });

  it('normaliza y actualiza la empresa obtenida desde la sesión', async () => {
    const updatedCompany = {
      id: 'company-1',
      name: 'Seguridad del Norte',
      legalName: null,
      rfc: null,
      address: null,
      timezone: 'America/Mexico_City',
    };

    companiesServiceMock.updateCurrent.mockResolvedValue(updatedCompany);

    const result = await controller.updateCurrent('company-1', {
      name: ' Seguridad del Norte ',
      legalName: '',
      rfc: '',
      address: '',
      timezone: 'America/Mexico_City',
    });

    expect(companiesServiceMock.updateCurrent).toHaveBeenCalledWith(
      'company-1',
      {
        name: 'Seguridad del Norte',
        legalName: null,
        rfc: null,
        address: null,
        timezone: 'America/Mexico_City',
      },
    );
    expect(result).toEqual(updatedCompany);
  });
});
