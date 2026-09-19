import { Module } from '@nestjs/common';

import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { SessionTokenService } from './session-token.service';

@Module({
  providers: [
    AuthService,
    PasswordService,
    SessionService,
    SessionTokenService,
  ],
  exports: [AuthService, PasswordService, SessionService, SessionTokenService],
})
export class AuthModule {}
