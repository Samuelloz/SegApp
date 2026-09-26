import { Module } from '@nestjs/common';

import { ContactVerificationsController } from './contact-verifications.controller';
import { ContactVerificationsService } from './contact-verifications.service';

@Module({
  controllers: [ContactVerificationsController],
  providers: [ContactVerificationsService],
  exports: [ContactVerificationsService],
})
export class ContactVerificationsModule {}
