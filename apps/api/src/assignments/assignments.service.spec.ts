import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { AssignmentsService } from './assignments.service';

describe('AssignmentsService', () => {
  let service: AssignmentsService;

  const prismaMock = {
    guard: {
      findFirst: jest.fn(),
    },
    contract: {
      findFirst: jest.fn(),
    },
    guardAssignment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const startedAt = new Date('2026-09-18T10:00:00.000Z');
  const endedAt = new Date('2026-09-18T18:00:00.000Z');

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<AssignmentsService>(AssignmentsService);
  });

  function prepareValidAssignment(): void {
    prismaMock.guard.findFirst.mockResolvedValue({
      id: 'guard-1',
      active: true,
    });
    prismaMock.contract.findFirst.mockResolvedValue({
      id: 'contract-1',
      active: true,
    });
    prismaMock.guardAssignment.findFirst.mockResolvedValue(null);
  }

  it('lista únicamente las asignaciones de la empresa indicada', async () => {
    const assignments = [{ id: 'assignment-1', companyId: 'company-1' }];

    prismaMock.guardAssignment.findMany.mockResolvedValue(assignments);

    const result = await service.findAll('company-1');

    expect(prismaMock.guardAssignment.findMany).toHaveBeenCalledWith({
      where: {
        companyId: 'company-1',
      },
      include: {
        guard: true,
        contract: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
    expect(result).toEqual(assignments);
  });

  it('asigna un guardia y un contrato pertenecientes a la empresa indicada', async () => {
    const createdAssignment = {
      id: 'assignment-1',
      companyId: 'company-1',
    };

    prepareValidAssignment();
    prismaMock.guardAssignment.create.mockResolvedValue(createdAssignment);

    const result = await service.assignGuard(
      'company-1',
      'guard-1',
      'contract-1',
      startedAt,
    );

    expect(prismaMock.guard.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'guard-1',
        companyId: 'company-1',
        deletedAt: null,
      },
    });
    expect(prismaMock.contract.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'contract-1',
        companyId: 'company-1',
        deletedAt: null,
      },
    });
    expect(prismaMock.guardAssignment.findFirst).toHaveBeenCalledWith({
      where: {
        guardId: 'guard-1',
        companyId: 'company-1',
        endedAt: null,
      },
    });
    expect(prismaMock.guardAssignment.create).toHaveBeenCalledWith({
      data: {
        guardId: 'guard-1',
        contractId: 'contract-1',
        companyId: 'company-1',
        startedAt,
      },
      include: {
        guard: true,
        contract: true,
      },
    });
    expect(result).toEqual(createdAssignment);
  });

  it('rechaza un guardia inexistente, eliminado o de otra empresa', async () => {
    prismaMock.guard.findFirst.mockResolvedValue(null);
    prismaMock.contract.findFirst.mockResolvedValue({
      id: 'contract-1',
      active: true,
    });
    prismaMock.guardAssignment.findFirst.mockResolvedValue(null);

    await expect(
      service.assignGuard('company-1', 'guard-2', 'contract-1'),
    ).rejects.toThrow(NotFoundException);

    expect(prismaMock.guardAssignment.create).not.toHaveBeenCalled();
  });

  it('rechaza un contrato inexistente, eliminado o de otra empresa', async () => {
    prismaMock.guard.findFirst.mockResolvedValue({
      id: 'guard-1',
      active: true,
    });
    prismaMock.contract.findFirst.mockResolvedValue(null);
    prismaMock.guardAssignment.findFirst.mockResolvedValue(null);

    await expect(
      service.assignGuard('company-1', 'guard-1', 'contract-2'),
    ).rejects.toThrow(NotFoundException);

    expect(prismaMock.guardAssignment.create).not.toHaveBeenCalled();
  });

  it('rechaza un guardia inactivo', async () => {
    prismaMock.guard.findFirst.mockResolvedValue({
      id: 'guard-1',
      active: false,
    });
    prismaMock.contract.findFirst.mockResolvedValue({
      id: 'contract-1',
      active: true,
    });
    prismaMock.guardAssignment.findFirst.mockResolvedValue(null);

    await expect(
      service.assignGuard('company-1', 'guard-1', 'contract-1'),
    ).rejects.toThrow(BadRequestException);

    expect(prismaMock.guardAssignment.create).not.toHaveBeenCalled();
  });

  it('rechaza un contrato inactivo', async () => {
    prismaMock.guard.findFirst.mockResolvedValue({
      id: 'guard-1',
      active: true,
    });
    prismaMock.contract.findFirst.mockResolvedValue({
      id: 'contract-1',
      active: false,
    });
    prismaMock.guardAssignment.findFirst.mockResolvedValue(null);

    await expect(
      service.assignGuard('company-1', 'guard-1', 'contract-1'),
    ).rejects.toThrow(BadRequestException);

    expect(prismaMock.guardAssignment.create).not.toHaveBeenCalled();
  });

  it('rechaza un guardia que ya tiene una asignación vigente', async () => {
    prepareValidAssignment();
    prismaMock.guardAssignment.findFirst.mockResolvedValue({
      id: 'assignment-1',
    });

    await expect(
      service.assignGuard('company-1', 'guard-1', 'contract-1'),
    ).rejects.toThrow(ConflictException);

    expect(prismaMock.guardAssignment.create).not.toHaveBeenCalled();
  });

  it('finaliza únicamente una asignación de la empresa indicada', async () => {
    prismaMock.guardAssignment.findFirst.mockResolvedValue({
      id: 'assignment-1',
      startedAt,
      endedAt: null,
    });
    prismaMock.guardAssignment.update.mockResolvedValue({
      id: 'assignment-1',
      endedAt,
    });

    const result = await service.endAssignment(
      'company-1',
      'assignment-1',
      endedAt,
    );

    expect(prismaMock.guardAssignment.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'assignment-1',
        companyId: 'company-1',
      },
    });
    expect(prismaMock.guardAssignment.update).toHaveBeenCalledWith({
      where: {
        id: 'assignment-1',
      },
      data: {
        endedAt,
      },
      include: {
        guard: true,
        contract: true,
      },
    });
    expect(result).toEqual({ id: 'assignment-1', endedAt });
  });

  it('no finaliza una asignación inexistente o de otra empresa', async () => {
    prismaMock.guardAssignment.findFirst.mockResolvedValue(null);

    await expect(
      service.endAssignment('company-1', 'assignment-2', endedAt),
    ).rejects.toThrow(NotFoundException);

    expect(prismaMock.guardAssignment.update).not.toHaveBeenCalled();
  });

  it('no vuelve a finalizar una asignación terminada', async () => {
    prismaMock.guardAssignment.findFirst.mockResolvedValue({
      id: 'assignment-1',
      startedAt,
      endedAt,
    });

    await expect(
      service.endAssignment('company-1', 'assignment-1', endedAt),
    ).rejects.toThrow(ConflictException);

    expect(prismaMock.guardAssignment.update).not.toHaveBeenCalled();
  });

  it('rechaza una finalización anterior al inicio de la asignación', async () => {
    prismaMock.guardAssignment.findFirst.mockResolvedValue({
      id: 'assignment-1',
      startedAt,
      endedAt: null,
    });

    await expect(
      service.endAssignment(
        'company-1',
        'assignment-1',
        new Date('2026-09-18T09:59:59.000Z'),
      ),
    ).rejects.toThrow(BadRequestException);

    expect(prismaMock.guardAssignment.update).not.toHaveBeenCalled();
  });

  it('rechaza una fecha de finalización posterior a la fecha actual', async () => {
    prismaMock.guardAssignment.findFirst.mockResolvedValue({
      id: 'assignment-1',
      startedAt,
      endedAt: null,
    });

    await expect(
      service.endAssignment(
        'company-1',
        'assignment-1',
        new Date('2099-01-01T00:00:00.000Z'),
      ),
    ).rejects.toThrow(BadRequestException);

    expect(prismaMock.guardAssignment.update).not.toHaveBeenCalled();
  });
});
