import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_COMPANY_ID } from '../companies/company.constants';

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.guardAssignment.findMany({
      where: {
        companyId: DEFAULT_COMPANY_ID,
      },
      include: {
        guard: true,
        contract: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
  }

  async assignGuard(guardId: string, contractId: string, startedAt?: Date) {
    const [guard, contract, currentAssignment] = await Promise.all([
      this.prisma.guard.findFirst({
        where: {
          id: guardId,
          companyId: DEFAULT_COMPANY_ID,
          deletedAt: null,
        },
      }),

      this.prisma.contract.findFirst({
        where: {
          id: contractId,
          companyId: DEFAULT_COMPANY_ID,
          deletedAt: null,
        },
      }),

      this.prisma.guardAssignment.findFirst({
        where: {
          guardId,
          companyId: DEFAULT_COMPANY_ID,
          endedAt: null,
        },
      }),
    ]);

    if (!guard) {
      throw new NotFoundException('Guardia no encontrado.');
    }

    if (!contract) {
      throw new NotFoundException('Contrato no encontrado.');
    }

    if (!guard.active) {
      throw new BadRequestException('No se puede asignar un guardia inactivo.');
    }

    if (!contract.active) {
      throw new BadRequestException(
        'No se puede asignar a un contrato inactivo.',
      );
    }

    if (currentAssignment) {
      throw new ConflictException(
        'El guardia ya tiene una asignación vigente.',
      );
    }

    return this.prisma.guardAssignment.create({
      data: {
        guardId,
        contractId,
        companyId: DEFAULT_COMPANY_ID,
        ...(startedAt ? { startedAt } : {}),
      },
      include: {
        guard: true,
        contract: true,
      },
    });
  }

  async endAssignment(id: string, endedAt: Date = new Date()) {
    const assignment = await this.prisma.guardAssignment.findUnique({
      where: {
        id,
        companyId: DEFAULT_COMPANY_ID,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Asignación no encontrada.');
    }

    if (assignment.endedAt) {
      throw new ConflictException('La asignación ya fue finalizada.');
    }

    if (endedAt < assignment.startedAt) {
      throw new BadRequestException(
        'La fecha de finalización no puede ser anterior a la fecha de inicio.',
      );
    }

    if (endedAt > new Date()) {
      throw new BadRequestException(
        'La fecha de finalización no puede ser posterior a la fecha actual.',
      );
    }

    return this.prisma.guardAssignment.update({
      where: {
        id,
      },

      data: {
        endedAt,
      },

      include: {
        guard: true,
        contract: true,
      },
    });
  }
}
