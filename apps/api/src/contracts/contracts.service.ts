import type {
  CreateContractInput,
  UpdateContractInput,
} from '@segapp/contracts';

import { Injectable, NotFoundException } from '@nestjs/common';

import { DEFAULT_COMPANY_ID } from '../companies/company.constants';
import { PrismaService } from '../prisma/prisma.service';

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

  create(data: CreateContractInput) {
    return this.prisma.contract.create({
      data: {
        ...this.prepareContractData(data),
        companyId: DEFAULT_COMPANY_ID,
      },
    });
  }

  async update(id: string, data: UpdateContractInput) {
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
      data: this.prepareContractData(data),
    });
  }

  async updateActiveStatus(id: string, active: boolean) {
    const existingContract = await this.prisma.contract.findFirst({
      where: {
        id,
        companyId: DEFAULT_COMPANY_ID,
      },
      select: { id: true },
    });

    if (!existingContract) {
      throw new NotFoundException('Contrato no encontrado.');
    }

    return this.prisma.contract.update({
      where: { id },
      data: { active },
    });
  }

  private prepareContractData(data: CreateContractInput | UpdateContractInput) {
    return {
      name: data.name,
      clientLegalName: data.clientLegalName,
      clientRfc: data.clientRfc,
      startDate: new Date(`${data.startDate}T00:00:00.000Z`),
      endDate:
        data.endDate === undefined
          ? undefined
          : data.endDate
            ? new Date(`${data.endDate}T00:00:00.000Z`)
            : null,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      contactEmail: this.normalizeOptionalText(data.contactEmail),
      requiredGuardCount: data.requiredGuardCount,
      street: this.normalizeOptionalText(data.street),
      exteriorNumber: this.normalizeOptionalText(data.exteriorNumber),
      interiorNumber: this.normalizeOptionalText(data.interiorNumber),
      neighborhood: this.normalizeOptionalText(data.neighborhood),
      postalCode: this.normalizeOptionalText(data.postalCode),
      city: this.normalizeOptionalText(data.city),
      municipality: this.normalizeOptionalText(data.municipality),
      state: this.normalizeOptionalText(data.state),
      country: this.normalizeOptionalText(data.country),
      formattedAddress: this.normalizeOptionalText(data.formattedAddress),
      latitude: this.normalizeOptionalNumber(data.latitude),
      longitude: this.normalizeOptionalNumber(data.longitude),
      externalPlaceId: this.normalizeOptionalText(data.externalPlaceId),
    };
  }

  private normalizeOptionalText(
    value: string | undefined,
  ): string | null | undefined {
    if (value === undefined) return undefined;

    const normalized = value.trim();

    return normalized || null;
  }

  private normalizeOptionalNumber(
    value: string | undefined,
  ): number | null | undefined {
    if (value === undefined) return undefined;

    const normalized = value.trim();

    return normalized === '' ? null : Number(normalized);
  }
}
