import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

export type UpdateCompanyData = {
  name?: string;
  legalName?: string | null;
  rfc?: string | null;
  address?: string | null;
  timezone?: string;
};

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async findCurrent(companyId: string) {
    const company = await this.prisma.company.findFirst({
      where: {
        id: companyId,
        deletedAt: null,
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa no encontrada');
    }

    return company;
  }

  async updateCurrent(companyId: string, data: UpdateCompanyData) {
    await this.findCurrent(companyId);

    return this.prisma.company.update({
      where: {
        id: companyId,
      },
      data,
    });
  }
}
