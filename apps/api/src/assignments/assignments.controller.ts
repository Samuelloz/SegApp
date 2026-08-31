import { createAssignmentSchema, endAssignmentSchema } from '@segapp/contracts';

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
  create(@Body() body: unknown) {
    const result = createAssignmentSchema.safeParse(body);

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        'Los datos de la asignación no son válidos.';

      throw new BadRequestException(message);
    }

    const { guardId, contractId, startedAt: startedAtValue } = result.data;

    const startedAt = startedAtValue ? new Date(startedAtValue) : undefined;

    return this.service.assignGuard(guardId, contractId, startedAt);
  }

  @Patch(':id/end')
  endAssignment(@Param('id') id: string, @Body() body: unknown) {
    const result = endAssignmentSchema.safeParse(body);

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        'Los datos de la finalización no son válidos.';

      throw new BadRequestException(message);
    }
    const endedAt = result.data.endedAt
      ? new Date(result.data.endedAt)
      : undefined;

    return this.service.endAssignment(id, endedAt);
  }
}
