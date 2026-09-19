import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { GuardsController } from './guards.controller';
import { GuardService } from './guards.service';

@Module({
  imports: [AuthModule],
  controllers: [GuardsController],
  providers: [GuardService],
})
export class GuardsModule {}
