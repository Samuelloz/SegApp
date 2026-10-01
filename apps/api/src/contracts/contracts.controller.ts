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

import {
  createContractSchema,
  rolesFor,
  updateActiveStatusSchema,
  updateContractSchema,
} from '@segapp/contracts';

import { CurrentCompanyId } from '../auth/current-company-id.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { ContractsService } from './contracts.service';

@UseGuards(SessionAuthGuard, RolesGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private service: ContractsService) {}

  @Get()
  @Roles(...rolesFor('contracts:manage'))
  findAll(@CurrentCompanyId() companyId: string) {
    return this.service.findAll(companyId);
  }

  @Get('list')
  @Roles(...rolesFor('contracts:list'))
  findList(@CurrentCompanyId() companyId: string) {
    return this.service.findList(companyId);
  }

  @Get('assignment-options')
  @Roles(...rolesFor('assignments:manage'))
  findAssignmentOptions(@CurrentCompanyId() companyId: string) {
    return this.service.findAssignmentOptions(companyId);
  }

  @Post()
  @Roles(...rolesFor('contracts:manage'))
  create(@CurrentCompanyId() companyId: string, @Body() body: unknown) {
    const result = createContractSchema.safeParse(body);

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        'Los datos del contrato no son válidos.';

      throw new BadRequestException(message);
    }

    return this.service.create(companyId, result.data);
  }

  @Patch(':id')
  @Roles(...rolesFor('contracts:manage'))
  update(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const result = updateContractSchema.safeParse(body);

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        'Los datos del contrato no son válidos.';

      throw new BadRequestException(message);
    }

    return this.service.update(companyId, id, result.data);
  }

  @Patch(':id/status')
  @Roles(...rolesFor('contracts:status'))
  updateStatus(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const result = updateActiveStatusSchema.safeParse(body);

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        'El estatus del contrato no es válido.';

      throw new BadRequestException(message);
    }

    return this.service.updateActiveStatus(companyId, id, result.data.active);
  }
}
