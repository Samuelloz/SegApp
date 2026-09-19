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
