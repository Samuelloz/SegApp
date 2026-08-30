import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
} from '@nestjs/common';
import { CompaniesService, UpdateCompanyData } from './companies.service';

type UpdateCompanyBody = {
  name?: string;
  legalName?: string;
  rfc?: string;
  address?: string;
  timezone?: string;
};

@Controller('companies')
export class CompaniesController {
  constructor(private service: CompaniesService) {}

  @Get('current')
  findCurrent() {
    return this.service.findCurrent();
  }

  @Patch('current')
  updateCurrent(@Body() body: UpdateCompanyBody) {
    const data: UpdateCompanyData = {};

    if (body.name !== undefined) {
      const name = body.name.trim();

      if (!name) {
        throw new BadRequestException('El nombre de la empresa es obligatorio');
      }

      data.name = name;
    }

    if (body.legalName !== undefined) {
      data.legalName = body.legalName.trim() || null;
    }

    if (body.rfc !== undefined) {
      data.rfc = body.rfc.trim().toUpperCase() || null;
    }

    if (body.address !== undefined) {
      data.address = body.address.trim() || null;
    }

    if (body.timezone !== undefined) {
      const timezone = body.timezone.trim();

      if (!timezone) {
        throw new BadRequestException('La zona horaria es obligatoria.');
      }

      data.timezone = timezone;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'Debes proporcionar al menos un campo para actualizar.',
      );
    }

    return this.service.updateCurrent(data);
  }
}
