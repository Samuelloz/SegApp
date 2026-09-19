import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { GuardService } from './guards.service';

describe('GuardService', () => {
  let service: GuardService;

  const prismaMock = {
    guard: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const guardInput = {
    fullName: 'Rosario Félix López Lugo',
    fatherFullName: 'Roberto López Ruiz',
    motherFullName: 'María Lugo Díaz',
    birthDate: '1975-01-01',
    birthPlace: 'Torreón, Coahuila',
    employeeNumber: '000003',
    hiredAt: '2026-09-18',
    phone: '',
    rfc: 'LOLR750101AB1',
    curp: 'LOLR750101HCLPXS09',
    nss: '12345678901',
    latitude: '25.5428',
    longitude: '-103.4068',
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuardService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<GuardService>(GuardService);
  });

  it('lista únicamente guardias no eliminados de la empresa indicada', async () => {
    const guards = [{ id: 'guard-1', companyId: 'company-1' }];

    prismaMock.guard.findMany.mockResolvedValue(guards);

    const result = await service.findAll('company-1');

    expect(prismaMock.guard.findMany).toHaveBeenCalledWith({
      where: {
        companyId: 'company-1',
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    expect(result).toEqual(guards);
  });

  it('crea el guardia dentro de la empresa indicada y normaliza sus datos', async () => {
    const createdGuard = { id: 'guard-1', companyId: 'company-1' };

    prismaMock.guard.findMany.mockResolvedValue([]);
    prismaMock.guard.create.mockResolvedValue(createdGuard);

    const result = await service.create('company-1', guardInput);

    expect(prismaMock.guard.findMany).toHaveBeenCalledWith({
      where: {
        companyId: 'company-1',
        OR: [
          { employeeNumber: '000003' },
          { rfc: 'LOLR750101AB1' },
          { curp: 'LOLR750101HCLPXS09' },
          { nss: '12345678901' },
        ],
      },
      select: {
        employeeNumber: true,
        rfc: true,
        curp: true,
        nss: true,
      },
    });
    expect(prismaMock.guard.create).toHaveBeenCalledWith({
      data: {
        companyId: 'company-1',
        fullName: 'Rosario Félix López Lugo',
        fatherFullName: 'Roberto López Ruiz',
        motherFullName: 'María Lugo Díaz',
        birthDate: new Date('1975-01-01T00:00:00.000Z'),
        birthPlace: 'Torreón, Coahuila',
        employeeNumber: '000003',
        hiredAt: new Date('2026-09-18T00:00:00.000Z'),
        phone: null,
        rfc: 'LOLR750101AB1',
        curp: 'LOLR750101HCLPXS09',
        nss: '12345678901',
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
    expect(result).toEqual(createdGuard);
  });

  it('rechaza identificadores repetidos dentro de la misma empresa', async () => {
    prismaMock.guard.findMany.mockResolvedValue([
      {
        employeeNumber: '000003',
        rfc: 'OTRO750101AB1',
        curp: 'OTRO750101HCLPXS09',
        nss: '10987654321',
      },
    ]);

    await expect(service.create('company-1', guardInput)).rejects.toThrow(
      ConflictException,
    );

    expect(prismaMock.guard.create).not.toHaveBeenCalled();
  });

  it('actualiza únicamente un guardia de la empresa indicada', async () => {
    prismaMock.guard.findFirst.mockResolvedValue({ id: 'guard-1' });
    prismaMock.guard.findMany.mockResolvedValue([]);
    prismaMock.guard.update.mockResolvedValue({ id: 'guard-1' });

    await service.update('company-1', 'guard-1', guardInput);

    expect(prismaMock.guard.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'guard-1',
        companyId: 'company-1',
        deletedAt: null,
      },
    });
    expect(prismaMock.guard.findMany).toHaveBeenCalledWith({
      where: {
        companyId: 'company-1',
        id: { not: 'guard-1' },
        OR: [
          { employeeNumber: '000003' },
          { rfc: 'LOLR750101AB1' },
          { curp: 'LOLR750101HCLPXS09' },
          { nss: '12345678901' },
        ],
      },
      select: {
        employeeNumber: true,
        rfc: true,
        curp: true,
        nss: true,
      },
    });
    expect(prismaMock.guard.update).toHaveBeenCalledWith({
      where: { id: 'guard-1' },
      data: {
        fullName: 'Rosario Félix López Lugo',
        fatherFullName: 'Roberto López Ruiz',
        motherFullName: 'María Lugo Díaz',
        birthDate: new Date('1975-01-01T00:00:00.000Z'),
        birthPlace: 'Torreón, Coahuila',
        employeeNumber: '000003',
        hiredAt: new Date('2026-09-18T00:00:00.000Z'),
        phone: null,
        rfc: 'LOLR750101AB1',
        curp: 'LOLR750101HCLPXS09',
        nss: '12345678901',
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

  it('no actualiza un guardia inexistente, eliminado o de otra empresa', async () => {
    prismaMock.guard.findFirst.mockResolvedValue(null);

    await expect(
      service.update('company-1', 'guard-2', guardInput),
    ).rejects.toThrow(NotFoundException);

    expect(prismaMock.guard.findMany).not.toHaveBeenCalled();
    expect(prismaMock.guard.update).not.toHaveBeenCalled();
  });

  it('actualiza el estado únicamente en un guardia de la empresa indicada', async () => {
    prismaMock.guard.findFirst.mockResolvedValue({ id: 'guard-1' });
    prismaMock.guard.update.mockResolvedValue({
      id: 'guard-1',
      active: false,
    });

    await service.updateActiveStatus('company-1', 'guard-1', false);

    expect(prismaMock.guard.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'guard-1',
        companyId: 'company-1',
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });
    expect(prismaMock.guard.update).toHaveBeenCalledWith({
      where: { id: 'guard-1' },
      data: { active: false },
    });
  });

  it('no cambia el estado de un guardia ajeno, eliminado o inexistente', async () => {
    prismaMock.guard.findFirst.mockResolvedValue(null);

    await expect(
      service.updateActiveStatus('company-1', 'guard-2', false),
    ).rejects.toThrow(NotFoundException);

    expect(prismaMock.guard.update).not.toHaveBeenCalled();
  });
});
