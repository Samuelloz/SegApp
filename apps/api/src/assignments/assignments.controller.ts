import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Param,
} from '@nestjs/common';

import { AssignmentsService } from './assignments.service';

@Controller('assignments')
export class AssignmentsController {
  constructor(private service: AssignmentsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(
    @Body()
    body: {
      guardId?: string;
      contractId?: string;
      startedAt?: string;
    },
  ) {
    const guardId = (body?.guardId ?? '').trim();
    const contractId = (body?.contractId ?? '').trim();
    const startedAtValue = (body?.startedAt ?? '').trim();

    if (!guardId) {
      throw new BadRequestException('El guardia es obligatorio.');
    }

    if (!contractId) {
      throw new BadRequestException('El contrato es obligatorio.');
    }

    let startedAt: Date | undefined;

    if (startedAtValue) {
      startedAt = new Date(startedAtValue);

      if (Number.isNaN(startedAt.getTime())) {
        throw new BadRequestException('La fecha de inicio no es válida.');
      }
    }

    return this.service.assignGuard(guardId, contractId, startedAt);
  }

  @Patch(':id/end')
  endAssignment(@Param('id') id: string, @Body() body: { endedAt?: string }) {
    const endedAtValue = (body?.endedAt ?? '').trim();

    let endedAt: Date | undefined;

    if (endedAtValue) {
      endedAt = new Date(endedAtValue);

      if (Number.isNaN(endedAt.getTime())) {
        throw new BadRequestException('La fecha de finalización no es válida.');
      }
    }

    return this.service.endAssignment(id, endedAt);
  }
}
