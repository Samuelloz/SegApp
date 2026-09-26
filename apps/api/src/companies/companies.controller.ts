import { rolesFor, updateCompanySchema } from '@segapp/contracts';

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { CurrentCompanyId } from '../auth/current-company-id.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CompaniesService, type UpdateCompanyData } from './companies.service';

@UseGuards(SessionAuthGuard, RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  @Get('current')
  @Roles(...rolesFor('company:manage'))
  findCurrent(@CurrentCompanyId() companyId: string) {
    return this.service.findCurrent(companyId);
  }

  @Get('current/users')
  @Roles(...rolesFor('users:manage'))
  findUsers(@CurrentCompanyId() companyId: string) {
    return this.service.findUsers(companyId);
  }

  @Patch('current')
  @Roles(...rolesFor('company:manage'))
  updateCurrent(@CurrentCompanyId() companyId: string, @Body() body: unknown) {
    const result = updateCompanySchema.safeParse(body);

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        'Los datos de la empresa no son válidos';

      throw new BadRequestException(message);
    }

    const data: UpdateCompanyData = {
      ...result.data,
    };

    if (result.data.legalName !== undefined) {
      data.legalName = result.data.legalName || null;
    }

    if (result.data.rfc !== undefined) {
      data.rfc = result.data.rfc || null;
    }

    if (result.data.address !== undefined) {
      data.address = result.data.address || null;
    }

    return this.service.updateCurrent(companyId, data);
  }
}
