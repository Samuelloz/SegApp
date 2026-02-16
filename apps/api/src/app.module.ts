import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ContractsModule } from './contracts/contracts.module';
import { GuardsModule } from './guards/guards.module';

@Module({
  imports: [PrismaModule, ContractsModule, GuardsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
