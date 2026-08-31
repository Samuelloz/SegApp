import { createContractSchema, updateContractSchema } from '@segapp/contracts';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
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

    const { name } = result.data;

    return this.service.create(name);
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

    const { name } = result.data;

    return this.service.update(id, name);
  }

  @Patch(':id/toggle')
  toggle(@Param('id') id: string) {
    return this.service.toggleActive(id);
  }
}
