import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { ContractsService } from './contracts.service';

describe('ContractsService', () => {
  let service: ContractsService;

  const prismaMock = {
    contract: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const contractInput = {
    name: 'Contrato Norte',
    clientLegalName: 'Cliente del Norte, S.A. de C.V.',
    clientRfc: 'CNO260101AB1',
    startDate: '2026-09-20',
    endDate: '2026-12-31',
    contactName: 'María López',
    contactPhone: '871 123 4567',
    contactEmail: '',
    requiredGuardCount: 4,
    latitude: '25.5428',
    longitude: '-103.4068',
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
  });

  it('lista únicamente contratos no eliminados de la empresa indicada', async () => {
    const contracts = [{ id: 'contract-1', companyId: 'company-1' }];

    prismaMock.contract.findMany.mockResolvedValue(contracts);

    const result = await service.findAll('company-1');

    expect(prismaMock.contract.findMany).toHaveBeenCalledWith({
      where: {
        companyId: 'company-1',
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    expect(result).toEqual(contracts);
  });

  it('selecciona solo los campos públicos del listado de contratos', async () => {
    prismaMock.contract.findMany.mockResolvedValue([]);

    await service.findList('company-1');

    expect(prismaMock.contract.findMany).toHaveBeenCalledWith({
      where: { companyId: 'company-1', deletedAt: null },
      select: {
        id: true,
        name: true,
        clientLegalName: true,
        startDate: true,
        endDate: true,
        requiredGuardCount: true,
        active: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('limita las opciones de asignación a contratos activos y campos mínimos', async () => {
    prismaMock.contract.findMany.mockResolvedValue([]);

    await service.findAssignmentOptions('company-1');

    expect(prismaMock.contract.findMany).toHaveBeenCalledWith({
      where: { companyId: 'company-1', deletedAt: null, active: true },
      select: { id: true, name: true, active: true },
      orderBy: { name: 'asc' },
    });
  });

  it('crea el contrato dentro de la empresa indicada y normaliza sus datos', async () => {
    const createdContract = {
      id: 'contract-1',
      companyId: 'company-1',
    };

    prismaMock.contract.create.mockResolvedValue(createdContract);

    const result = await service.create('company-1', contractInput);

    expect(prismaMock.contract.create).toHaveBeenCalledWith({
      data: {
        companyId: 'company-1',
        name: 'Contrato Norte',
        clientLegalName: 'Cliente del Norte, S.A. de C.V.',
        clientRfc: 'CNO260101AB1',
        startDate: new Date('2026-09-20T00:00:00.000Z'),
        endDate: new Date('2026-12-31T00:00:00.000Z'),
        contactName: 'María López',
        contactPhone: '871 123 4567',
        contactEmail: null,
        requiredGuardCount: 4,
        street: undefined,
        exteriorNumber: undefined,
        interiorNumber: undefined,
        neighborhood: undefined,
        postalCode: undefined,
        city: undefined,
        municipality: undefined,
        state: undefined,
        country: undefined,
        formattedAddress: undefined,
        latitude: 25.5428,
        longitude: -103.4068,
        externalPlaceId: undefined,
      },
    });
    expect(result).toEqual(createdContract);
  });

  it('actualiza un contrato perteneciente a la empresa indicada', async () => {
    prismaMock.contract.findFirst.mockResolvedValue({
      id: 'contract-1',
    });
    prismaMock.contract.update.mockResolvedValue({
      id: 'contract-1',
      name: 'Contrato Norte',
    });

    await service.update('company-1', 'contract-1', contractInput);

    expect(prismaMock.contract.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'contract-1',
        companyId: 'company-1',
        deletedAt: null,
      },
    });
    expect(prismaMock.contract.update).toHaveBeenCalledWith({
      where: {
        id: 'contract-1',
      },
      data: {
        name: 'Contrato Norte',
        clientLegalName: 'Cliente del Norte, S.A. de C.V.',
        clientRfc: 'CNO260101AB1',
        startDate: new Date('2026-09-20T00:00:00.000Z'),
        endDate: new Date('2026-12-31T00:00:00.000Z'),
        contactName: 'María López',
        contactPhone: '871 123 4567',
        contactEmail: null,
        requiredGuardCount: 4,
        street: undefined,
        exteriorNumber: undefined,
        interiorNumber: undefined,
        neighborhood: undefined,
        postalCode: undefined,
        city: undefined,
        municipality: undefined,
        state: undefined,
        country: undefined,
        formattedAddress: undefined,
        latitude: 25.5428,
        longitude: -103.4068,
        externalPlaceId: undefined,
      },
    });
  });

  it('no actualiza un contrato inexistente, eliminado o de otra empresa', async () => {
    prismaMock.contract.findFirst.mockResolvedValue(null);

    await expect(
      service.update('company-1', 'contract-2', contractInput),
    ).rejects.toThrow(NotFoundException);

    expect(prismaMock.contract.update).not.toHaveBeenCalled();
  });

  it('actualiza el estado únicamente en un contrato de la empresa indicada', async () => {
    prismaMock.contract.findFirst.mockResolvedValue({
      id: 'contract-1',
    });
    prismaMock.contract.update.mockResolvedValue({
      id: 'contract-1',
      active: false,
    });

    await service.updateActiveStatus('company-1', 'contract-1', false);

    expect(prismaMock.contract.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'contract-1',
        companyId: 'company-1',
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });
    expect(prismaMock.contract.update).toHaveBeenCalledWith({
      where: {
        id: 'contract-1',
      },
      data: {
        active: false,
      },
    });
  });

  it('no cambia el estado de un contrato ajeno, eliminado o inexistente', async () => {
    prismaMock.contract.findFirst.mockResolvedValue(null);

    await expect(
      service.updateActiveStatus('company-1', 'contract-2', false),
    ).rejects.toThrow(NotFoundException);

    expect(prismaMock.contract.update).not.toHaveBeenCalled();
  });
});
