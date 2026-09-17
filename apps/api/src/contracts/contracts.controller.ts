import {
  createContractSchema,
  updateContractSchema,
  updateActiveStatusSchema,
} from '@segapp/contracts';

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
} from '@nestjs/common';

import { ContractsService } from './contracts.service';

@Controller('contracts')
export class ContractsController {
  constructor(private service: ContractsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() body: unknown) {
    const result = createContractSchema.safeParse(body);

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        'Los datos del contrato no son válidos.';

      throw new BadRequestException(message);
    }

    return this.service.create(result.data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    const result = updateContractSchema.safeParse(body);

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        'Los datos del contrato no son válidos.';

      throw new BadRequestException(message);
    }

    return this.service.update(id, result.data);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: unknown) {
    const result = updateActiveStatusSchema.safeParse(body);

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        'El estatus del contrato no es válido.';

      throw new BadRequestException(message);
    }

    return this.service.updateActiveStatus(id, result.data.active);
  }
}
