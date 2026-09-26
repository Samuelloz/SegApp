import type {
  CreateContractInput,
  UpdateContractInput,
} from '@segapp/contracts';

import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(companyId: string) {
    return this.prisma.contract.findMany({
      where: {
        companyId: companyId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findList(companyId: string) {
    return this.prisma.contract.findMany({
      where: { companyId, deletedAt: null },
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
  }

  findAssignmentOptions(companyId: string) {
    return this.prisma.contract.findMany({
      where: { companyId, deletedAt: null, active: true },
      select: { id: true, name: true, active: true },
      orderBy: { name: 'asc' },
    });
  }

  create(companyId: string, data: CreateContractInput) {
    return this.prisma.contract.create({
      data: {
        ...this.prepareContractData(data),
        companyId: companyId,
      },
    });
  }

  async update(companyId: string, id: string, data: UpdateContractInput) {
    const current = await this.prisma.contract.findFirst({
      where: {
        id,
        companyId: companyId,
        deletedAt: null,
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

  async updateActiveStatus(companyId: string, id: string, active: boolean) {
    const existingContract = await this.prisma.contract.findFirst({
      where: {
        id,
        companyId: companyId,
        deletedAt: null,
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
