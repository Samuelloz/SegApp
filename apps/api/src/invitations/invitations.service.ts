import { createHash, randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { type Invitation, Prisma } from '@prisma/client';

import {
  type AcceptInvitationInput,
  acceptInvitationSchema,
  type CreateInvitationInput,
  createInvitationSchema,
} from '@segapp/contracts';

import { PasswordService } from '../auth/password.service';
import { ContactVerificationsService } from '../contact-verifications/contact-verifications.service';
import { PrismaService } from '../prisma/prisma.service';

const INVITATION_DURATION_MS = 48 * 60 * 60 * 1000;

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly contactVerificationsService: ContactVerificationsService,
  ) {}

  async create(
    companyId: string,
    invitedById: string,
    input: CreateInvitationInput,
  ): Promise<{ invitation: Invitation; token: string }> {
    const inviter = await this.prisma.companyMembership.findUnique({
      where: { userId: invitedById },
      include: {
        company: true,
        user: { select: { active: true } },
      },
    });

    if (
      !inviter ||
      inviter.companyId !== companyId ||
      inviter.status !== 'ACTIVE' ||
      !inviter.user.active ||
      !inviter.company.active ||
      inviter.company.deletedAt ||
      !inviter.roles.some((role) => role === 'OWNER' || role === 'ADMIN')
    ) {
      throw new ForbiddenException(
        'No tienes permiso para invitar usuarios a esta empresa.',
      );
    }

    const parsed = createInvitationSchema.safeParse(input);

    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues[0]?.message ??
          'Los datos de la invitación no son válidos.',
      );
    }

    const email = parsed.data.email?.toLowerCase() ?? null;
    const phoneE164 = parsed.data.phoneE164 ?? null;
    const deliveryChannel = parsed.data.deliveryChannel;
    const now = new Date();

    const matchingContacts = [
      ...(email ? [{ email }] : []),
      ...(phoneE164 ? [{ phoneE164 }] : []),
    ];

    const existingUser = await this.prisma.user.findFirst({
      where: { companyId, OR: matchingContacts },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException(
        'Estos datos de contacto ya pertenecen a un usuario de esta empresa.',
      );
    }

    await this.prisma.invitation.updateMany({
      where: {
        companyId,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { lte: now },
        OR: matchingContacts,
      },
      data: { revokedAt: now },
    });

    const pendingInvitation = await this.prisma.invitation.findFirst({
      where: {
        companyId,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
        OR: matchingContacts,
      },
      select: { id: true },
    });

    if (pendingInvitation) {
      throw new ConflictException(
        'Ya existe una invitación vigente para estos datos de contacto.',
      );
    }

    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');

    let invitation: Invitation;

    try {
      invitation = await this.prisma.invitation.create({
        data: {
          companyId,
          invitedById,
          email,
          phoneE164,
          roles: parsed.data.roles,
          tokenHash,
          expiresAt: new Date(now.getTime() + INVITATION_DURATION_MS),
          deliveryChannel,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ya existe una invitación vigente para estos datos de contacto.',
        );
      }

      throw error;
    }

    return { invitation, token };
  }

  async findValidByToken(token: string) {
    const invalidMessage = 'La invitación no es válida o ha vencido.';

    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
      throw new BadRequestException(invalidMessage);
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');

    const invitation = await this.prisma.invitation.findUnique({
      where: { tokenHash },
      include: { company: true },
    });

    if (
      !invitation ||
      invitation.acceptedAt ||
      invitation.revokedAt ||
      invitation.expiresAt <= new Date() ||
      !invitation.company.active ||
      invitation.company.deletedAt
    ) {
      throw new BadRequestException(invalidMessage);
    }

    return invitation;
  }

  async accept(input: AcceptInvitationInput) {
    const parsed = acceptInvitationSchema.safeParse(input);

    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues[0]?.message ??
          'Los datos de la invitación no son válidos.',
      );
    }

    const { token, name, email, phoneE164, password } = parsed.data;
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const invalidInvitationMessage = 'La invitación no es válida o ha vencido.';

    try {
      return await this.prisma.$transaction(async (tx) => {
        const now = new Date();
        const invitation = await tx.invitation.findUnique({
          where: { tokenHash },
          include: { company: true },
        });

        if (
          !invitation ||
          invitation.acceptedAt ||
          invitation.revokedAt ||
          invitation.expiresAt <= now ||
          !invitation.company.active ||
          invitation.company.deletedAt
        ) {
          throw new BadRequestException(invalidInvitationMessage);
        }

        const deliveryEmail =
          invitation.deliveryChannel === 'EMAIL' ? invitation.email : null;
        const deliveryPhone =
          invitation.deliveryChannel === 'WHATSAPP'
            ? invitation.phoneE164
            : null;

        if (!deliveryEmail && !deliveryPhone) {
          throw new BadRequestException(invalidInvitationMessage);
        }

        // Por ahora no aceptamos un segundo contacto sin verificarlo.
        // Si el formulario envía al contacto invitado, debe coincidir.
        if (
          (email && email !== deliveryEmail) ||
          (phoneE164 && phoneE164 !== deliveryPhone)
        ) {
          throw new BadRequestException(
            'El contacto adicional deberá agregarse después de verificarlo.',
          );
        }

        // El UPDATE condicional reclama el enlace una sola vez.
        const claim = await tx.invitation.updateMany({
          where: {
            id: invitation.id,
            acceptedAt: null,
            revokedAt: null,
            expiresAt: { gt: now },
          },
          data: { acceptedAt: now },
        });

        if (claim.count !== 1) {
          throw new BadRequestException(invalidInvitationMessage);
        }

        const passwordHash = await this.passwordService.hash(password);

        // El índice único (companyId, contacto) rechaza contactos ya
        // registrados en la empresa; el catch lo convierte en 409.
        const user = await tx.user.create({
          data: {
            companyId: invitation.companyId,
            name,
            passwordHash,
            email: deliveryEmail,
            phoneE164: deliveryPhone,
          },
          select: { id: true },
        });

        const membership = await tx.companyMembership.create({
          data: {
            userId: user.id,
            companyId: invitation.companyId,
            roles: invitation.roles,
            status: 'PENDING',
          },
          select: { id: true, status: true },
        });

        const contactValue = deliveryEmail ?? deliveryPhone;

        if (!contactValue) {
          throw new BadRequestException(invalidInvitationMessage);
        }

        const { verification, token: verificationToken } =
          await this.contactVerificationsService.create(tx, {
            userId: user.id,
            deliveryChannel: invitation.deliveryChannel,
            contactValue,
          });

        return {
          membershipId: membership.id,
          companyName: invitation.company.name,
          status: membership.status,
          verificationToken,
          verificationExpiresAt: verification.expiresAt.toISOString(),
        };
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Estos datos de contacto ya pertenecen a un usuario de esta empresa.',
        );
      }

      throw error;
    }
  }
}
