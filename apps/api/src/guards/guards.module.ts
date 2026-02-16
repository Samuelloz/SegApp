import { Module } from '@nestjs/common';
import { GuardsController } from './guards.controller';
import { GuardService } from './guards.service';

@Module({
    controllers: [GuardsController],
    providers: [GuardService],
})
export class GuardsModule {}