import { type InvitationDeliveryChannel, type Prisma } from '@prisma/client';
import { contactVerificationTokenSchema } from '@segapp/contracts';
import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';

const VERIFICATION_DURATION_MS = 24 * 60 * 60 * 1000;
const INVALID_VERIFICATION_MESSAGE =
  'La verificación no es válida o ha vencido.';

type CreateVerificationInput = {
  userId: string;
  deliveryChannel: InvitationDeliveryChannel;
  contactValue: string;
};

@Injectable()
export class ContactVerificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    transaction: Prisma.TransactionClient,
    input: CreateVerificationInput,
  ) {
    const now = new Date();

    await transaction.contactVerification.updateMany({
      where: {
        userId: input.userId,
        deliveryChannel: input.deliveryChannel,
        consumedAt: null,
        revokedAt: null,
      },
      data: {
        revokedAt: now,
      },
    });

    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const verification = await transaction.contactVerification.create({
      data: {
        userId: input.userId,
        deliveryChannel: input.deliveryChannel,
        contactValue: input.contactValue,
        tokenHash,
        expiresAt: new Date(now.getTime() + VERIFICATION_DURATION_MS),
      },
    });

    return {
      verification,
      token,
    };
  }

  async verify(token: string) {
    const parsed = contactVerificationTokenSchema.safeParse(token);

    if (!parsed.success) {
      throw new BadRequestException(INVALID_VERIFICATION_MESSAGE);
    }

    const tokenHash = createHash('sha256').update(parsed.data).digest('hex');

    return this.prisma.$transaction(async (transaction) => {
      const now = new Date();

      const verification = await transaction.contactVerification.findUnique({
        where: {
          tokenHash,
        },
        include: {
          user: {
            select: {
              id: true,
              active: true,
              email: true,
              phoneE164: true,
              membership: {
                select: {
                  id: true,
                  status: true,
                  company: {
                    select: {
                      name: true,
                      active: true,
                      deletedAt: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const membership = verification?.user.membership;

      const contactMatches =
        verification?.deliveryChannel === 'EMAIL'
          ? verification.user.email === verification.contactValue
          : verification?.deliveryChannel === 'WHATSAPP'
            ? verification.user.phoneE164 === verification.contactValue
            : false;

      if (
        !verification ||
        verification.consumedAt ||
        verification.revokedAt ||
        verification.expiresAt <= now ||
        !verification.user.active ||
        !membership ||
        membership.status !== 'PENDING' ||
        !membership.company.active ||
        membership.company.deletedAt ||
        !contactMatches
      ) {
        throw new BadRequestException(INVALID_VERIFICATION_MESSAGE);
      }

      const claim = await transaction.contactVerification.updateMany({
        where: {
          id: verification.id,
          consumedAt: null,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: {
          consumedAt: now,
        },
      });

      if (claim.count !== 1) {
        throw new BadRequestException(INVALID_VERIFICATION_MESSAGE);
      }

      const activation = await transaction.companyMembership.updateMany({
        where: {
          id: membership.id,
          status: 'PENDING',
        },
        data: {
          status: 'ACTIVE',
        },
      });

      if (activation.count !== 1) {
        throw new BadRequestException(INVALID_VERIFICATION_MESSAGE);
      }

      await transaction.user.update({
        where: {
          id: verification.user.id,
        },
        data:
          verification.deliveryChannel === 'EMAIL'
            ? { emailVerifiedAt: now }
            : { phoneVerifiedAt: now },
      });

      return {
        membershipId: membership.id,
        companyName: membership.company.name,
        status: 'ACTIVE' as const,
        deliveryChannel: verification.deliveryChannel,
      };
    });
  }
}
