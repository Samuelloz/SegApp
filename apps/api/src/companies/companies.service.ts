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

  async findUsers(companyId: string) {
    const memberships = await this.prisma.companyMembership.findMany({
      where: { companyId },
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

    return memberships.map((membership) => ({
      ...membership,
      createdAt: membership.createdAt.toISOString(),
    }));
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
