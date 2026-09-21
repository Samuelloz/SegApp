import {
  createContractSchema,
  updateActiveStatusSchema,
  updateContractSchema,
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
import { ContractsService } from './contracts.service';

@UseGuards(SessionAuthGuard, RolesGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private service: ContractsService) {}

  @Get()
  findAll(@CurrentCompanyId() companyId: string) {
    return this.service.findAll(companyId);
  }

  @Post()
  @Roles('OWNER', 'ADMIN', 'SALES', 'CONTRACT_MANAGER')
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
  @Roles('OWNER', 'ADMIN', 'SALES', 'CONTRACT_MANAGER')
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
  @Roles('OWNER', 'ADMIN', 'CONTRACT_MANAGER')
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
