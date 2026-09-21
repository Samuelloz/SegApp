import type { MembershipRole } from '@segapp/contracts';
import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';

import { ROLES_KEY } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';

describe('ContractsController', () => {
  let controller: ContractsController;

  const contractsServiceMock = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateActiveStatus: jest.fn(),
  };

  const sessionAuthGuardMock = {
    canActivate: jest.fn(),
  };

  const validContractInput = {
    name: ' Contrato Norte ',
    clientLegalName: ' Cliente del Norte, S.A. de C.V. ',
    clientRfc: 'cno260101ab1',
    startDate: '2026-09-20',
    contactName: ' María López ',
    contactPhone: '871 123 4567',
    requiredGuardCount: 4,
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractsController],
      providers: [
        {
          provide: ContractsService,
          useValue: contractsServiceMock,
        },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue(sessionAuthGuardMock)
      .compile();

    controller = module.get<ContractsController>(ContractsController);
  });

  it('protege las rutas con sesión antes de comprobar roles', () => {
    const reflector = new Reflector();
    const guards = reflector.get<unknown[]>(
      GUARDS_METADATA,
      ContractsController,
    );

    expect(guards).toEqual([SessionAuthGuard, RolesGuard]);
  });

  it('permite consultar contratos a cualquier usuario autenticado', () => {
    const reflector = new Reflector();
    const roles = reflector.get<MembershipRole[]>(
      ROLES_KEY,
      // Solo se lee la referencia del método para consultar sus metadatos.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      ContractsController.prototype.findAll,
    );

    expect(roles).toBeUndefined();
  });

  it('permite crear contratos a propietario, administrador, ventas y encargado de contratos', () => {
    const reflector = new Reflector();
    const roles = reflector.get<MembershipRole[]>(
      ROLES_KEY,
      // Solo se lee la referencia del método para consultar sus metadatos.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      ContractsController.prototype.create,
    );

    expect(roles).toEqual(['OWNER', 'ADMIN', 'SALES', 'CONTRACT_MANAGER']);
  });

  it('permite editar contratos a propietario, administrador, ventas y encargado de contratos', () => {
    const reflector = new Reflector();
    const roles = reflector.get<MembershipRole[]>(
      ROLES_KEY,
      // Solo se lee la referencia del método para consultar sus metadatos.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      ContractsController.prototype.update,
    );

    expect(roles).toEqual(['OWNER', 'ADMIN', 'SALES', 'CONTRACT_MANAGER']);
  });

  it('reserva el cambio de estatus a propietario, administrador y encargado de contratos', () => {
    const reflector = new Reflector();
    const roles = reflector.get<MembershipRole[]>(
      ROLES_KEY,
      // Solo se lee la referencia del método para consultar sus metadatos.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      ContractsController.prototype.updateStatus,
    );

    expect(roles).toEqual(['OWNER', 'ADMIN', 'CONTRACT_MANAGER']);
  });

  it('lista los contratos de la empresa obtenida desde la sesión', async () => {
    const contracts = [{ id: 'contract-1', companyId: 'company-1' }];

    contractsServiceMock.findAll.mockResolvedValue(contracts);

    const result = await controller.findAll('company-1');

    expect(contractsServiceMock.findAll).toHaveBeenCalledWith('company-1');
    expect(result).toEqual(contracts);
  });

  it('rechaza datos inválidos al crear un contrato', () => {
    expect(() => controller.create('company-1', {})).toThrow(
      BadRequestException,
    );

    expect(contractsServiceMock.create).not.toHaveBeenCalled();
  });

  it('crea un contrato dentro de la empresa obtenida desde la sesión', async () => {
    contractsServiceMock.create.mockResolvedValue({
      id: 'contract-1',
    });

    await controller.create('company-1', validContractInput);

    expect(contractsServiceMock.create).toHaveBeenCalledWith('company-1', {
      name: 'Contrato Norte',
      clientLegalName: 'Cliente del Norte, S.A. de C.V.',
      clientRfc: 'CNO260101AB1',
      startDate: '2026-09-20',
      contactName: 'María López',
      contactPhone: '871 123 4567',
      requiredGuardCount: 4,
    });
  });

  it('actualiza un contrato dentro de la empresa obtenida desde la sesión', async () => {
    contractsServiceMock.update.mockResolvedValue({
      id: 'contract-1',
    });

    await controller.update('company-1', 'contract-1', validContractInput);

    expect(contractsServiceMock.update).toHaveBeenCalledWith(
      'company-1',
      'contract-1',
      expect.objectContaining({
        name: 'Contrato Norte',
        clientRfc: 'CNO260101AB1',
      }),
    );
  });

  it('rechaza un estado de contrato inválido', () => {
    expect(() =>
      controller.updateStatus('company-1', 'contract-1', {
        active: 'no',
      }),
    ).toThrow(BadRequestException);

    expect(contractsServiceMock.updateActiveStatus).not.toHaveBeenCalled();
  });

  it('actualiza el estado dentro de la empresa obtenida desde la sesión', async () => {
    contractsServiceMock.updateActiveStatus.mockResolvedValue({
      id: 'contract-1',
      active: false,
    });

    await controller.updateStatus('company-1', 'contract-1', {
      active: false,
    });

    expect(contractsServiceMock.updateActiveStatus).toHaveBeenCalledWith(
      'company-1',
      'contract-1',
      false,
    );
  });
});
