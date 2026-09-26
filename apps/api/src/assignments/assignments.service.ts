import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

const assignmentSelect = {
  id: true,
  guardId: true,
  contractId: true,
  companyId: true,
  startedAt: true,
  endedAt: true,
  createdAt: true,
  updatedAt: true,
  guard: { select: { fullName: true, employeeNumber: true } },
  contract: { select: { name: true } },
} as const;

const assignmentListSelect = {
  id: true,
  startedAt: true,
  endedAt: true,
  guard: { select: { fullName: true, employeeNumber: true } },
  contract: { select: { name: true } },
} as const;

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(companyId: string) {
    return this.prisma.guardAssignment.findMany({
      where: { companyId },
      select: assignmentSelect,
      orderBy: { startedAt: 'desc' },
    });
  }

  findList(companyId: string) {
    return this.prisma.guardAssignment.findMany({
      where: { companyId },
      select: assignmentListSelect,
      orderBy: { startedAt: 'desc' },
    });
  }

  async assignGuard(
    companyId: string,
    guardId: string,
    contractId: string,
    startedAt?: Date,
  ) {
    const [guard, contract, currentAssignment] = await Promise.all([
      this.prisma.guard.findFirst({
        where: {
          id: guardId,
          companyId: companyId,
          deletedAt: null,
        },
      }),

      this.prisma.contract.findFirst({
        where: {
          id: contractId,
          companyId: companyId,
          deletedAt: null,
        },
      }),

      this.prisma.guardAssignment.findFirst({
        where: {
          guardId,
          companyId: companyId,
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
        companyId: companyId,
        ...(startedAt ? { startedAt } : {}),
      },
      select: assignmentSelect,
    });
  }

  async endAssignment(
    companyId: string,
    id: string,
    endedAt: Date = new Date(),
  ) {
    const assignment = await this.prisma.guardAssignment.findFirst({
      where: {
        id,
        companyId: companyId,
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

      select: assignmentSelect,
    });
  }
}
