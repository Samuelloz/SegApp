import { updateCompanySchema } from '@segapp/contracts';
import { CompaniesService, UpdateCompanyData } from './companies.service';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
} from '@nestjs/common';

@Controller('companies')
export class CompaniesController {
  constructor(private service: CompaniesService) { }

  @Get('current')
  findCurrent() {
    return this.service.findCurrent();
  }

  @Patch('current')
  updateCurrent(@Body() body: unknown) {
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

    return this.service.updateCurrent(data);
  }
}
