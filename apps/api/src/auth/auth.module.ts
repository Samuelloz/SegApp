import { Module } from '@nestjs/common';

import { PasswordService } from './password.service';
import { SessionTokenService } from './session-token.service';

@Module({
  providers: [PasswordService, SessionTokenService],
  exports: [PasswordService, SessionTokenService],
})
export class AuthModule {}
