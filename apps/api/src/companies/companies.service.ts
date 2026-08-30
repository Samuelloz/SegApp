import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_COMPANY_ID } from './company.constants';

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

  async findCurrent() {
    const company = await this.prisma.company.findFirst({
      where: {
        id: DEFAULT_COMPANY_ID,
        deletedAt: null,
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa no encontrada');
    }

    return company;
  }

  async updateCurrent(data: UpdateCompanyData) {
    await this.findCurrent();

    return this.prisma.company.update({
      where: {
        id: DEFAULT_COMPANY_ID,
      },
      data,
    });
  }
}
