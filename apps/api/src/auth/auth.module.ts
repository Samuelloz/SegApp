import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { SessionTokenService } from './session-token.service';
import { SessionAuthGuard } from './session-auth.guard';
import { RolesGuard } from './roles.guard';

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
