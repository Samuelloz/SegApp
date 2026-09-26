import {
  createGuardSchema,
  rolesFor,
  updateGuardSchema,
  updateActiveStatusSchema,
} from '@segapp/contracts';

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
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { GuardService } from './guards.service';

@UseGuards(SessionAuthGuard, RolesGuard)
@Controller('guards')
export class GuardsController {
  constructor(private service: GuardService) {}

  @Get()
  @Roles(...rolesFor('guards:manage'))
  findAll(@CurrentCompanyId() companyId: string) {
    return this.service.findAll(companyId);
  }

  @Get('list')
  @Roles(...rolesFor('guards:list'))
  findList(@CurrentCompanyId() companyId: string) {
    return this.service.findList(companyId);
  }

  @Get('assignment-options')
  @Roles(...rolesFor('assignments:manage'))
  findAssignmentOptions(@CurrentCompanyId() companyId: string) {
    return this.service.findAssignmentOptions(companyId);
  }

  @Post()
  @Roles(...rolesFor('guards:manage'))
  create(@CurrentCompanyId() companyId: string, @Body() body: unknown) {
    const result = createGuardSchema.safeParse(body);

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        'Los datos del guardia no son válidos.';

      throw new BadRequestException(message);
    }

    return this.service.create(companyId, result.data);
  }

  @Patch(':id')
  @Roles(...rolesFor('guards:manage'))
  update(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const result = updateGuardSchema.safeParse(body);

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        'Los datos del guardia no son válidos.';

      throw new BadRequestException(message);
    }

    return this.service.update(companyId, id, result.data);
  }

  @Patch(':id/status')
  @Roles(...rolesFor('guards:manage'))
  updateStatus(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const result = updateActiveStatusSchema.safeParse(body);

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        'Los datos del guardia no son válidos.';

      throw new BadRequestException(message);
    }

    return this.service.updateActiveStatus(companyId, id, result.data.active);
  }
}
