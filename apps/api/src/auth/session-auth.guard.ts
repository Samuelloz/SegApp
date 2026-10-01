import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { INVALID_SESSION_MESSAGE, SESSION_COOKIE_NAME } from './auth.constants';
import { SessionService } from './session.service';

export type AuthenticatedRequest = Omit<Request, 'cookies'> & {
  cookies?: Record<string, unknown>;
  currentSession?: Awaited<ReturnType<SessionService['findValidByToken']>>;
};

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const token = request.cookies?.[SESSION_COOKIE_NAME];

    if (typeof token !== 'string' || token.length === 0) {
      throw new UnauthorizedException(INVALID_SESSION_MESSAGE);
    }

    const currentSession = await this.sessionService.findValidByToken(token);

    request.currentSession = currentSession;

    return true;
  }
}
