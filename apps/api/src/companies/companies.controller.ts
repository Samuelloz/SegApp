import { updateCompanySchema } from '@segapp/contracts';

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { CurrentCompanyId } from '../auth/current-company-id.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CompaniesService, type UpdateCompanyData } from './companies.service';

@UseGuards(SessionAuthGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  @Get('current')
  findCurrent(@CurrentCompanyId() companyId: string) {
    return this.service.findCurrent(companyId);
  }

  @Patch('current')
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
