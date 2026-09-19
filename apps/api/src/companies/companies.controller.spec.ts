import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';

import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

describe('CompaniesController', () => {
  let controller: CompaniesController;

  const companiesServiceMock = {
    findCurrent: jest.fn(),
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

  it('protege todas las rutas de empresas con SessionAuthGuard', () => {
    const reflector = new Reflector();
    const guards = reflector.get<unknown[]>(
      GUARDS_METADATA,
      CompaniesController,
    );

    expect(guards).toContain(SessionAuthGuard);
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
