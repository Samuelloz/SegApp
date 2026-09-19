import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import type { CurrentSessionResponse, LoginInput } from '@segapp/contracts';

import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';

const INVALID_CREDENTIALS_MESSAGE =
  'Correo electrónico o contraseña incorrectos.';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
  ) {}

  async authenticateCredentials(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        membership: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordMatches = await this.passwordService.verify(
      user.passwordHash,
      password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      active: user.active,
      emailVerifiedAt: user.emailVerifiedAt,
      membership: user.membership,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async login(input: LoginInput) {
    const authenticatedUser = await this.authenticateCredentials(
      input.email,
      input.password,
    );

    const membership = authenticatedUser.membership;

    if (!membership) {
      throw new ForbiddenException(
        'La cuenta no tiene acceso a una empresa activa.',
      );
    }

    const { token, session } = await this.sessionService.create(membership.id);

    const currentSession = {
      user: {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        name: authenticatedUser.name,
        active: authenticatedUser.active,
        emailVerifiedAt:
          authenticatedUser.emailVerifiedAt?.toISOString() ?? null,
        createdAt: authenticatedUser.createdAt.toISOString(),
        updatedAt: authenticatedUser.updatedAt.toISOString(),
      },
      membership: {
        id: membership.id,
        role: membership.role,
        status: membership.status,
        company: {
          id: membership.company.id,
          name: membership.company.name,
          slug: membership.company.slug,
        },
        createdAt: membership.createdAt.toISOString(),
        updatedAt: membership.updatedAt.toISOString(),
      },
      expiresAt: session.expiresAt.toISOString(),
    } satisfies CurrentSessionResponse;

    return {
      token,
      currentSession,
    };
  }
}
