import { createGuardSchema, updateGuardSchema } from '@segapp/contracts';

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
} from '@nestjs/common';

import { GuardService } from './guards.service';

@Controller('guards')
export class GuardsController {
  constructor(private service: GuardService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() body: unknown) {
    const result = createGuardSchema.safeParse(body);

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        'Los datos del guardia no son válidos.';

      throw new BadRequestException(message);
    }

    const { fullname, employeeNumber, phone } = result.data;

    return this.service.create(fullname, employeeNumber, phone);
  }

  @Patch(':id/toggle')
  toggle(@Param('id') id: string) {
    return this.service.toggleActive(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    const result = updateGuardSchema.safeParse(body);

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        'Los datos del guardia no son válidos.';

      throw new BadRequestException(message);
    }

    const { fullname, employeeNumber, phone } = result.data;

    return this.service.update(id, fullname, employeeNumber, phone);
  }
}
