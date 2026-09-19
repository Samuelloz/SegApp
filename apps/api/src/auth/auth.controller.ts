import { loginSchema } from '@segapp/contracts';

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import type { Response } from 'express';

import {
  INVALID_SESSION_MESSAGE,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from './auth.constants';
import { AuthService } from './auth.service';
import {
  type AuthenticatedRequest,
  SessionAuthGuard,
} from './session-auth.guard';

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
      ...SESSION_COOKIE_OPTIONS,
      expires: new Date(currentSession.expiresAt),
    });

    response.setHeader('Cache-Control', 'no-store');

    return currentSession;
  }

  @UseGuards(SessionAuthGuard)
  @Get('session')
  getCurrentSession(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = request.currentSession;

    if (!session) {
      throw new UnauthorizedException(INVALID_SESSION_MESSAGE);
    }

    response.setHeader('Cache-Control', 'no-store');

    return this.authService.toCurrentSessionResponse(
      session.membership.user,
      session.membership,
      session.expiresAt,
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const token = request.cookies?.[SESSION_COOKIE_NAME];

    if (typeof token === 'string' && token.length > 0) {
      await this.authService.logout(token);
    }

    response.clearCookie(SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);

    response.setHeader('Cache-Control', 'no-store');
  }
}
