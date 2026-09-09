import {
  createGuardSchema,
  updateGuardSchema,
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

    return this.service.create(result.data);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: unknown) {
    const result = updateActiveStatusSchema.safeParse(body);

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        'Los datos del guardia no son válidos.';

      throw new BadRequestException(message);
    }

    return this.service.updateActiveStatus(id, result.data.active);
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

    return this.service.update(id, result.data);
  }
}
