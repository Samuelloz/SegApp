import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ContactVerificationsModule } from '../contact-verifications/contact-verifications.module';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

@Module({
  imports: [AuthModule, ContactVerificationsModule],
  controllers: [InvitationsController],
  providers: [InvitationsService],
})
export class InvitationsModule {}
