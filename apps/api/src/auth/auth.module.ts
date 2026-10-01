import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { RolesGuard } from './roles.guard';
import { SessionService } from './session.service';
import { SessionAuthGuard } from './session-auth.guard';
import { SessionTokenService } from './session-token.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    SessionService,
    SessionTokenService,
    SessionAuthGuard,
    RolesGuard,
  ],
  exports: [
    AuthService,
    PasswordService,
    SessionService,
    SessionTokenService,
    SessionAuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
