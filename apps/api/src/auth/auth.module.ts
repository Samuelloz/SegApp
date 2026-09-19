import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { SessionTokenService } from './session-token.service';
import { SessionAuthGuard } from './session-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    SessionService,
    SessionTokenService,
    SessionAuthGuard,
  ],
  exports: [
    AuthService,
    PasswordService,
    SessionService,
    SessionTokenService,
    SessionAuthGuard,
  ],
})
export class AuthModule {}
