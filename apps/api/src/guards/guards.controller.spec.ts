import type { MembershipRole } from '@segapp/contracts';
import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';

import { ROLES_KEY } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { GuardsController } from './guards.controller';
import { GuardService } from './guards.service';

describe('GuardsController', () => {
  let controller: GuardsController;

  const guardServiceMock = {
    findAll: jest.fn(),
    findList: jest.fn(),
    findAssignmentOptions: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateActiveStatus: jest.fn(),
  };

  const sessionAuthGuardMock = {
    canActivate: jest.fn(),
  };

  const validGuardInput = {
    fullName: ' Rosario Félix López Lugo ',
    fatherFullName: ' Roberto López Ruiz ',
    motherFullName: ' María Lugo Díaz ',
    birthDate: '1975-01-01',
    birthPlace: ' Torreón, Coahuila ',
    employeeNumber: ' 000003 ',
    hiredAt: '2026-09-18',
    rfc: 'lolr750101ab1',
    curp: 'lolr750101hclpxs09',
    nss: '12345678901',
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuardsController],
      providers: [
        {
          provide: GuardService,
          useValue: guardServiceMock,
        },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue(sessionAuthGuardMock)
      .compile();

    controller = module.get<GuardsController>(GuardsController);
  });

  it('protege las rutas con sesión antes de comprobar roles', () => {
    const reflector = new Reflector();
    const guards = reflector.get<unknown[]>(GUARDS_METADATA, GuardsController);

    expect(guards).toEqual([SessionAuthGuard, RolesGuard]);
  });

  it('reserva los datos completos de guardias a quienes los gestionan', () => {
    const reflector = new Reflector();
    const roles = reflector.get<MembershipRole[]>(
      ROLES_KEY,
      // Solo se lee la referencia del método para consultar sus metadatos.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      GuardsController.prototype.findAll,
    );

    expect(roles).toEqual(['OWNER', 'ADMIN', 'GUARD_MANAGER']);
  });

  it('permite el listado reducido a VIEWER y a gestores de guardias', () => {
    const roles = new Reflector().get<MembershipRole[]>(
      ROLES_KEY,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      GuardsController.prototype.findList,
    );

    expect(roles).toEqual(['OWNER', 'ADMIN', 'GUARD_MANAGER', 'VIEWER']);
  });

  it('limita las opciones de asignación a quienes gestionan asignaciones', () => {
    const roles = new Reflector().get<MembershipRole[]>(
      ROLES_KEY,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      GuardsController.prototype.findAssignmentOptions,
    );

    expect(roles).toEqual(['OWNER', 'ADMIN', 'GUARD_MANAGER', 'SUPERVISOR']);
  });

  it('reserva la creación de guardias a propietario, administrador y encargado de guardias', () => {
    const reflector = new Reflector();
    const roles = reflector.get<MembershipRole[]>(
      ROLES_KEY,
      // Solo se lee la referencia del método para consultar sus metadatos.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      GuardsController.prototype.create,
    );

    expect(roles).toEqual(['OWNER', 'ADMIN', 'GUARD_MANAGER']);
  });

  it('reserva la edición de guardias a propietario, administrador y encargado de guardias', () => {
    const reflector = new Reflector();
    const roles = reflector.get<MembershipRole[]>(
      ROLES_KEY,
      // Solo se lee la referencia del método para consultar sus metadatos.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      GuardsController.prototype.update,
    );

    expect(roles).toEqual(['OWNER', 'ADMIN', 'GUARD_MANAGER']);
  });

  it('reserva el cambio de estatus a propietario, administrador y encargado de guardias', () => {
    const reflector = new Reflector();
    const roles = reflector.get<MembershipRole[]>(
      ROLES_KEY,
      // Solo se lee la referencia del método para consultar sus metadatos.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      GuardsController.prototype.updateStatus,
    );

    expect(roles).toEqual(['OWNER', 'ADMIN', 'GUARD_MANAGER']);
  });

  it('lista los guardias de la empresa obtenida desde la sesión', async () => {
    const guards = [{ id: 'guard-1', companyId: 'company-1' }];

    guardServiceMock.findAll.mockResolvedValue(guards);

    const result = await controller.findAll('company-1');

    expect(guardServiceMock.findAll).toHaveBeenCalledWith('company-1');
    expect(result).toEqual(guards);
  });

  it('consulta el listado reducido y las opciones dentro de la empresa de la sesión', async () => {
    guardServiceMock.findList.mockResolvedValue([{ id: 'guard-1' }]);
    guardServiceMock.findAssignmentOptions.mockResolvedValue([
      { id: 'guard-2' },
    ]);

    await expect(controller.findList('company-1')).resolves.toEqual([
      { id: 'guard-1' },
    ]);
    await expect(
      controller.findAssignmentOptions('company-1'),
    ).resolves.toEqual([{ id: 'guard-2' }]);
    expect(guardServiceMock.findList).toHaveBeenCalledWith('company-1');
    expect(guardServiceMock.findAssignmentOptions).toHaveBeenCalledWith(
      'company-1',
    );
  });

  it('rechaza datos inválidos al crear un guardia', () => {
    expect(() => controller.create('company-1', {})).toThrow(
      BadRequestException,
    );

    expect(guardServiceMock.create).not.toHaveBeenCalled();
  });

  it('crea un guardia dentro de la empresa obtenida desde la sesión', async () => {
    guardServiceMock.create.mockResolvedValue({ id: 'guard-1' });

    await controller.create('company-1', validGuardInput);

    expect(guardServiceMock.create).toHaveBeenCalledWith('company-1', {
      fullName: 'Rosario Félix López Lugo',
      fatherFullName: 'Roberto López Ruiz',
      motherFullName: 'María Lugo Díaz',
      birthDate: '1975-01-01',
      birthPlace: 'Torreón, Coahuila',
      employeeNumber: '000003',
      hiredAt: '2026-09-18',
      rfc: 'LOLR750101AB1',
      curp: 'LOLR750101HCLPXS09',
      nss: '12345678901',
    });
  });

  it('actualiza un guardia dentro de la empresa obtenida desde la sesión', async () => {
    guardServiceMock.update.mockResolvedValue({ id: 'guard-1' });

    await controller.update('company-1', 'guard-1', validGuardInput);

    expect(guardServiceMock.update).toHaveBeenCalledWith(
      'company-1',
      'guard-1',
      {
        fullName: 'Rosario Félix López Lugo',
        fatherFullName: 'Roberto López Ruiz',
        motherFullName: 'María Lugo Díaz',
        birthDate: '1975-01-01',
        birthPlace: 'Torreón, Coahuila',
        employeeNumber: '000003',
        hiredAt: '2026-09-18',
        rfc: 'LOLR750101AB1',
        curp: 'LOLR750101HCLPXS09',
        nss: '12345678901',
      },
    );
  });

  it('rechaza un estado de guardia inválido', () => {
    expect(() =>
      controller.updateStatus('company-1', 'guard-1', { active: 'no' }),
    ).toThrow(BadRequestException);

    expect(guardServiceMock.updateActiveStatus).not.toHaveBeenCalled();
  });

  it('actualiza el estado dentro de la empresa obtenida desde la sesión', async () => {
    guardServiceMock.updateActiveStatus.mockResolvedValue({
      id: 'guard-1',
      active: false,
    });

    await controller.updateStatus('company-1', 'guard-1', { active: false });

    expect(guardServiceMock.updateActiveStatus).toHaveBeenCalledWith(
      'company-1',
      'guard-1',
      false,
    );
  });
});
