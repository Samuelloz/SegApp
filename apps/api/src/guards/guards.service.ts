import type { CreateGuardInput, UpdateGuardInput } from '@segapp/contracts';

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { DEFAULT_COMPANY_ID } from '../companies/company.constants';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GuardService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.guard.findMany({
      where: {
        companyId: DEFAULT_COMPANY_ID,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateGuardInput) {
    await this.ensureUniqueIdentifiers(data);

    try {
      return await this.prisma.guard.create({
        data: {
          ...this.prepareGuardData(data),
          companyId: DEFAULT_COMPANY_ID,
        },
      });
    } catch (error: unknown) {
      this.handlePrismaError(error);
    }
  }

  async updateActiveStatus(id: string, active: boolean) {
    const existingGuard = await this.prisma.guard.findFirst({
      where: {
        id,
        companyId: DEFAULT_COMPANY_ID,
      },
      select: {
        id: true,
      },
    });

    if (!existingGuard) {
      throw new NotFoundException('Guardia no encontrado.');
    }

    return this.prisma.guard.update({
      where: { id },
      data: { active },
    });
  }

  async update(id: string, data: UpdateGuardInput) {
    const current = await this.prisma.guard.findFirst({
      where: {
        id,
        companyId: DEFAULT_COMPANY_ID,
      },
    });

    if (!current) {
      throw new NotFoundException('Guardia no encontrado.');
    }

    await this.ensureUniqueIdentifiers(data, id);

    try {
      return await this.prisma.guard.update({
        where: { id },
        data: this.prepareGuardData(data),
      });
    } catch (error: unknown) {
      this.handlePrismaError(error);
    }
  }

  private prepareGuardData(data: CreateGuardInput | UpdateGuardInput) {
    return {
      fullName: data.fullName,
      fatherFullName: data.fatherFullName,
      motherFullName: data.motherFullName,
      birthDate: new Date(`${data.birthDate}T00:00:00.000Z`),
      birthPlace: data.birthPlace,
      employeeNumber: data.employeeNumber,
      hiredAt: new Date(`${data.hiredAt}T00:00:00.000Z`),
      phone: this.normalizeOptionalText(data.phone),
      rfc: data.rfc,
      curp: data.curp,
      nss: data.nss,
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

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.filter(
            (value): value is string => typeof value === 'string',
          )
        : [];

      if (target.includes('employeeNumber')) {
        throw new ConflictException(
          'El número de empleado ya está registrado.',
        );
      }

      if (target.includes('rfc')) {
        throw new ConflictException('El RFC ya está registrado.');
      }

      if (target.includes('curp')) {
        throw new ConflictException('La CURP ya está registrada.');
      }

      if (target.includes('nss')) {
        throw new ConflictException('El NSS ya está registrado.');
      }

      throw new ConflictException(
        'Ya existe un guardia con alguno de los identificadores proporcionados.',
      );
    }

    throw error;
  }

  private async ensureUniqueIdentifiers(
    data: CreateGuardInput | UpdateGuardInput,
    excludedId?: string,
  ): Promise<void> {
    const duplicates = await this.prisma.guard.findMany({
      where: {
        companyId: DEFAULT_COMPANY_ID,
        ...(excludedId ? { id: { not: excludedId } } : {}),
        OR: [
          { employeeNumber: data.employeeNumber },
          { rfc: data.rfc },
          { curp: data.curp },
          { nss: data.nss },
        ],
      },
      select: {
        employeeNumber: true,
        rfc: true,
        curp: true,
        nss: true,
      },
    });

    if (
      duplicates.some((guard) => guard.employeeNumber === data.employeeNumber)
    ) {
      throw new ConflictException('El número de empleado ya está registrado.');
    }

    if (duplicates.some((guard) => guard.rfc === data.rfc)) {
      throw new ConflictException('El RFC ya está registrado.');
    }

    if (duplicates.some((guard) => guard.curp === data.curp)) {
      throw new ConflictException('La CURP ya está registrada.');
    }

    if (duplicates.some((guard) => guard.nss === data.nss)) {
      throw new ConflictException('El NSS ya está registrado.');
    }
  }
}
