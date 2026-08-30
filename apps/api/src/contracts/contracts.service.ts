import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_COMPANY_ID } from '../companies/company.constants';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.contract.findMany({
      where: {
        companyId: DEFAULT_COMPANY_ID,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(name: string) {
    return this.prisma.contract.create({
      data: {
        name,
        companyId: DEFAULT_COMPANY_ID,
      },
    });
  }

  async update(id: string, name: string) {
    const current = await this.prisma.contract.findFirst({
      where: {
        id,
        companyId: DEFAULT_COMPANY_ID,
      },
    });

    if (!current) {
      throw new NotFoundException('Contrato no encontrado.');
    }

    return this.prisma.contract.update({
      where: { id },
      data: { name },
    });
  }

  async toggleActive(id: string) {
    const current = await this.prisma.contract.findFirst({
      where: {
        id,
        companyId: DEFAULT_COMPANY_ID,
      },
      select: { active: true },
    });

    if (!current) {
      throw new NotFoundException('Contrato no encontrado.');
    }

    return this.prisma.contract.update({
      where: { id },
      data: { active: !current.active },
    });
  }
}
