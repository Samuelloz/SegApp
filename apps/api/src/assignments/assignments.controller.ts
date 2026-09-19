import { createAssignmentSchema, endAssignmentSchema } from '@segapp/contracts';

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentCompanyId } from '../auth/current-company-id.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { AssignmentsService } from './assignments.service';

@UseGuards(SessionAuthGuard)
@Controller('assignments')
export class AssignmentsController {
  constructor(private service: AssignmentsService) {}

  @Get()
  findAll(@CurrentCompanyId() companyId: string) {
    return this.service.findAll(companyId);
  }

  @Post()
  create(@CurrentCompanyId() companyId: string, @Body() body: unknown) {
    const result = createAssignmentSchema.safeParse(body);

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        'Los datos de la asignación no son válidos.';

      throw new BadRequestException(message);
    }

    const { guardId, contractId, startedAt: startedAtValue } = result.data;

    const startedAt = startedAtValue ? new Date(startedAtValue) : undefined;

    return this.service.assignGuard(companyId, guardId, contractId, startedAt);
  }

  @Patch(':id/end')
  endAssignment(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
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

    return this.service.endAssignment(companyId, id, endedAt);
  }
}
