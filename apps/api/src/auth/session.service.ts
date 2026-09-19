import { ForbiddenException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { SessionTokenService } from './session-token.service';

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

const INACTIVE_MEMBERSHIP_MESSAGE =
  'La cuenta no tiene acceso a una empresa activa.';

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionTokenService: SessionTokenService,
  ) {}

  async create(membershipId: string) {
    const membership = await this.prisma.companyMembership.findUnique({
      where: {
        id: membershipId,
      },
      include: {
        company: true,
      },
    });

    if (
      !membership ||
      membership.status !== 'ACTIVE' ||
      !membership.company.active ||
      membership.company.deletedAt
    ) {
      throw new ForbiddenException(INACTIVE_MEMBERSHIP_MESSAGE);
    }

    const { token, tokenHash } = this.sessionTokenService.generate();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    const session = await this.prisma.session.create({
      data: {
        membershipId: membership.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      token,
      session,
    };
  }
}
