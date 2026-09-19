import {
  createParamDecorator,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

import { INVALID_SESSION_MESSAGE } from './auth.constants';
import type { AuthenticatedRequest } from './session-auth.guard';

export function extractCurrentCompanyId(context: ExecutionContext): string {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

  const companyId = request.currentSession?.membership.companyId;

  if (!companyId) {
    throw new UnauthorizedException(INVALID_SESSION_MESSAGE);
  }

  return companyId;
}

export const CurrentCompanyId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string =>
    extractCurrentCompanyId(context),
);
