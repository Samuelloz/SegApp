import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { CompaniesService } from './companies.service';

describe('CompaniesService', () => {
  let service: CompaniesService;

  const prismaMock = {
    company: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    companyMembership: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
  });

  it('devuelve únicamente la empresa indicada y no eliminada', async () => {
    const company = {
      id: 'company-1',
      name: 'Seguridad del Norte',
      deletedAt: null,
    };

    prismaMock.company.findFirst.mockResolvedValue(company);

    const result = await service.findCurrent('company-1');

    expect(prismaMock.company.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'company-1',
        deletedAt: null,
      },
    });
    expect(result).toEqual(company);
  });

  it('rechaza una empresa inexistente o eliminada', async () => {
    prismaMock.company.findFirst.mockResolvedValue(null);

    await expect(service.findCurrent('company-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('devuelve únicamente los miembros de la empresa indicada sin datos sensibles', async () => {
    const createdAt = new Date('2026-09-21T12:00:00.000Z');
    const membership = {
      id: 'membership-1',
      roles: ['OWNER'],
      status: 'ACTIVE',
      createdAt,
      user: {
        id: 'user-1',
        name: 'Samuel Lozano',
        email: 'samuel@ejemplo.com',
        phoneE164: null,
        active: true,
      },
    };
    prismaMock.companyMembership.findMany.mockResolvedValue([membership]);

    const result = await service.findUsers('company-1');

    expect(prismaMock.companyMembership.findMany).toHaveBeenCalledWith({
      where: { companyId: 'company-1' },
      select: {
        id: true,
        roles: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneE164: true,
            active: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    expect(result).toEqual([
      { ...membership, createdAt: '2026-09-21T12:00:00.000Z' },
    ]);
  });

  it('devuelve una lista vacía cuando la empresa no tiene miembros', async () => {
    prismaMock.companyMembership.findMany.mockResolvedValue([]);

    await expect(service.findUsers('company-1')).resolves.toEqual([]);
  });

  it('actualiza únicamente la empresa indicada', async () => {
    const existingCompany = {
      id: 'company-1',
      name: 'Seguridad del Norte',
      deletedAt: null,
    };
    const data = {
      name: 'Seguridad del Norte Actualizada',
      legalName: null,
    };
    const updatedCompany = {
      ...existingCompany,
      ...data,
    };

    prismaMock.company.findFirst.mockResolvedValue(existingCompany);
    prismaMock.company.update.mockResolvedValue(updatedCompany);

    const result = await service.updateCurrent('company-1', data);

    expect(prismaMock.company.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'company-1',
        deletedAt: null,
      },
    });
    expect(prismaMock.company.update).toHaveBeenCalledWith({
      where: {
        id: 'company-1',
      },
      data,
    });
    expect(result).toEqual(updatedCompany);
  });

  it('no actualiza cuando la empresa no existe o está eliminada', async () => {
    prismaMock.company.findFirst.mockResolvedValue(null);

    await expect(
      service.updateCurrent('company-1', {
        name: 'Empresa inexistente',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(prismaMock.company.update).not.toHaveBeenCalled();
  });
});
