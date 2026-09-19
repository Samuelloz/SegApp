import { loginSchema } from '@segapp/contracts';

import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
} from '@nestjs/common';

import type { Response } from 'express';

import { AuthService } from './auth.service';
import { SESSION_COOKIE_NAME } from './auth.constants';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        'Los datos de inicio de sesión no son válidos.';

      throw new BadRequestException(message);
    }

    const { token, currentSession } = await this.authService.login(result.data);

    response.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(currentSession.expiresAt),
    });

    response.setHeader('Cache-Control', 'no-store');

    return currentSession;
  }
}
