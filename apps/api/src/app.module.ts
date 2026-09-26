import { Module } from '@nestjs/common';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { InvitationsModule } from './invitations/invitations.module';
import { ContractsModule } from './contracts/contracts.module';
import { GuardsModule } from './guards/guards.module';
import { AssignmentsModule } from './assignments/assignments.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CompaniesModule,
    InvitationsModule,
    ContractsModule,
    GuardsModule,
    AssignmentsModule,
  ],
})
export class AppModule {}
