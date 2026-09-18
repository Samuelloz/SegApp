import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';

import { AssignmentsModule } from './assignments/assignments.module';
import { ContractsModule } from './contracts/contracts.module';
import { GuardsModule } from './guards/guards.module';
import { PrismaModule } from './prisma/prisma.module';
import { CompaniesModule } from './companies/companies.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ContractsModule,
    GuardsModule,
    AssignmentsModule,
    CompaniesModule,
  ],
})
export class AppModule {}
