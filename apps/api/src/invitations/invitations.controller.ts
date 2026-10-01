import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import {
  acceptInvitationSchema,
  createInvitationSchema,
  rolesFor,
} from '@segapp/contracts';

import { INVALID_SESSION_MESSAGE } from '../auth/auth.constants';
import { CurrentCompanyId } from '../auth/current-company-id.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  type AuthenticatedRequest,
  SessionAuthGuard,
} from '../auth/session-auth.guard';
import { InvitationsService } from './invitations.service';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get(':token')
  async findValidByToken(
    @Param('token') token: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const invitation = await this.invitationsService.findValidByToken(token);

    response.setHeader('Cache-Control', 'no-store');

    return {
      companyName: invitation.company.name,
      email: invitation.email,
      phoneE164: invitation.phoneE164,
      deliveryChannel: invitation.deliveryChannel,
      roles: invitation.roles,
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }

  @Post()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(...rolesFor('users:manage'))
  async create(
    @CurrentCompanyId() companyId: string,
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = request.currentSession;

    if (!session) {
      throw new UnauthorizedException(INVALID_SESSION_MESSAGE);
    }

    const result = createInvitationSchema.safeParse(body);

    if (!result.success) {
      throw new BadRequestException(
        result.error.issues[0]?.message ??
          'Los datos de la invitación no son válidos.',
      );
    }

    const { invitation, token } = await this.invitationsService.create(
      companyId,
      session.membership.userId,
      result.data,
    );

    response.setHeader('Cache-Control', 'no-store');

    return {
      id: invitation.id,
      token,
      email: invitation.email,
      phoneE164: invitation.phoneE164,
      deliveryChannel: invitation.deliveryChannel,
      roles: invitation.roles,
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }

  @Post('accept')
  @HttpCode(HttpStatus.OK)
  async accept(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = acceptInvitationSchema.safeParse(body);

    if (!result.success) {
      throw new BadRequestException(
        result.error.issues[0]?.message ??
          'Los datos de la invitación no son válidos.',
      );
    }

    const accepted = await this.invitationsService.accept(result.data);
    response.setHeader('Cache-Control', 'no-store');

    return accepted;
  }
}
