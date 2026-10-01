import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

import { verifyContactSchema } from '@segapp/contracts';

import { ContactVerificationsService } from './contact-verifications.service';

@Controller('contact-verifications')
export class ContactVerificationsController {
  constructor(
    private readonly contactVerificationsService: ContactVerificationsService,
  ) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = verifyContactSchema.safeParse(body);

    if (!result.success) {
      throw new BadRequestException(
        result.error.issues[0]?.message ??
          'Los datos de verificación no son válidos.',
      );
    }

    const verified = await this.contactVerificationsService.verify(
      result.data.token,
    );

    response.setHeader('Cache-Control', 'no-store');

    return verified;
  }
}
