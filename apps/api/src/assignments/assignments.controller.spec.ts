import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';

import { SessionAuthGuard } from '../auth/session-auth.guard';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';

describe('AssignmentsController', () => {
  let controller: AssignmentsController;

  const assignmentsServiceMock = {
    findAll: jest.fn(),
    assignGuard: jest.fn(),
    endAssignment: jest.fn(),
  };

  const sessionAuthGuardMock = {
    canActivate: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentsController],
      providers: [
        {
          provide: AssignmentsService,
          useValue: assignmentsServiceMock,
        },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue(sessionAuthGuardMock)
      .compile();

    controller = module.get<AssignmentsController>(AssignmentsController);
  });

  it('protege todas las rutas de asignaciones con SessionAuthGuard', () => {
    const reflector = new Reflector();
    const guards = reflector.get<unknown[]>(
      GUARDS_METADATA,
      AssignmentsController,
    );

    expect(guards).toContain(SessionAuthGuard);
  });

  it('lista las asignaciones de la empresa obtenida desde la sesión', async () => {
    const assignments = [{ id: 'assignment-1', companyId: 'company-1' }];

    assignmentsServiceMock.findAll.mockResolvedValue(assignments);

    const result = await controller.findAll('company-1');

    expect(assignmentsServiceMock.findAll).toHaveBeenCalledWith('company-1');
    expect(result).toEqual(assignments);
  });

  it('rechaza datos inválidos al crear una asignación', () => {
    expect(() => controller.create('company-1', {})).toThrow(
      BadRequestException,
    );

    expect(assignmentsServiceMock.assignGuard).not.toHaveBeenCalled();
  });

  it('crea una asignación dentro de la empresa obtenida desde la sesión', async () => {
    assignmentsServiceMock.assignGuard.mockResolvedValue({
      id: 'assignment-1',
    });

    await controller.create('company-1', {
      guardId: ' guard-1 ',
      contractId: ' contract-1 ',
      startedAt: '2026-09-18T10:00:00.000Z',
    });

    expect(assignmentsServiceMock.assignGuard).toHaveBeenCalledWith(
      'company-1',
      'guard-1',
      'contract-1',
      new Date('2026-09-18T10:00:00.000Z'),
    );
  });

  it('rechaza datos inválidos al finalizar una asignación', () => {
    expect(() =>
      controller.endAssignment('company-1', 'assignment-1', {
        endedAt: 'fecha-inválida',
      }),
    ).toThrow(BadRequestException);

    expect(assignmentsServiceMock.endAssignment).not.toHaveBeenCalled();
  });

  it('finaliza una asignación dentro de la empresa obtenida desde la sesión', async () => {
    assignmentsServiceMock.endAssignment.mockResolvedValue({
      id: 'assignment-1',
    });

    await controller.endAssignment('company-1', 'assignment-1', {
      endedAt: '2026-09-18T18:00:00.000Z',
    });

    expect(assignmentsServiceMock.endAssignment).toHaveBeenCalledWith(
      'company-1',
      'assignment-1',
      new Date('2026-09-18T18:00:00.000Z'),
    );
  });

  it('permite finalizar una asignación usando la fecha actual del servicio', async () => {
    assignmentsServiceMock.endAssignment.mockResolvedValue({
      id: 'assignment-1',
    });

    await controller.endAssignment('company-1', 'assignment-1', {});

    expect(assignmentsServiceMock.endAssignment).toHaveBeenCalledWith(
      'company-1',
      'assignment-1',
      undefined,
    );
  });
});
