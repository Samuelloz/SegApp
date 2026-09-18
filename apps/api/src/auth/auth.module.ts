import { Module } from '@nestjs/common';

import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SessionTokenService } from './session-token.service';

@Module({
  providers: [AuthService, PasswordService, SessionTokenService],
  exports: [AuthService, PasswordService, SessionTokenService],
})
export class AuthModule {}
