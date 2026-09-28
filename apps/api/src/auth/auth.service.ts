import { randomBytes } from 'node:crypto';

import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Company, CompanyMembership, User } from '@prisma/client';

import type { CurrentSessionResponse, LoginInput } from '@segapp/contracts';

import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';

const INVALID_CREDENTIALS_MESSAGE = 'Datos de acceso incorrectos.';

type MembershipWithCompany = CompanyMembership & {
  company: Pick<Company, 'id' | 'name' | 'slug'>;
};

@Injectable()
export class AuthService {
  private dummyPasswordHash?: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
  ) {}

  // Hash con los mismos parámetros que los reales, para que verificar
  // contra él tarde lo mismo que verificar contra un usuario existente.
  private getDummyPasswordHash(): Promise<string> {
    this.dummyPasswordHash ??= this.passwordService.hash(
      randomBytes(32).toString('base64url'),
    );

    return this.dummyPasswordHash;
  }

  async authenticateCredentials(
    companySlug: string,
    identifier: string,
    password: string,
  ) {
    const normalizedIdentifier = identifier.trim();
    const contact = normalizedIdentifier.startsWith('+')
      ? { phoneE164: normalizedIdentifier }
      : { email: normalizedIdentifier.toLowerCase() };

    // (companyId, contacto) es único: como máximo hay un resultado.
    const user = await this.prisma.user.findFirst({
      where: { ...contact, company: { slug: companySlug } },
      include: {
        membership: {
          include: {
            company: true,
          },
        },
      },
    });

    // Verificar siempre un hash, exista o no la cuenta, para que el tiempo
    // de respuesta no revele qué empresas o usuarios existen.
    const passwordMatches = await this.passwordService.verify(
      user?.passwordHash ?? (await this.getDummyPasswordHash()),
      password,
    );

    if (!user || !user.active || !passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    return {
      id: user.id,
      companyId: user.companyId,
      email: user.email,
      phoneE164: user.phoneE164,
      name: user.name,
      active: user.active,
      emailVerifiedAt: user.emailVerifiedAt,
      phoneVerifiedAt: user.phoneVerifiedAt,
      membership: user.membership,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  toCurrentSessionResponse(
    user: Omit<User, 'passwordHash'>,
    membership: MembershipWithCompany,
    expiresAt: Date,
  ): CurrentSessionResponse {
    return {
      user: {
        id: user.id,
        email: user.email,
        phoneE164: user.phoneE164,
        name: user.name,
        active: user.active,
        emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
        phoneVerifiedAt: user.phoneVerifiedAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      membership: {
        id: membership.id,
        roles: membership.roles,
        status: membership.status,
        company: {
          id: membership.company.id,
          name: membership.company.name,
          slug: membership.company.slug,
        },
        createdAt: membership.createdAt.toISOString(),
        updatedAt: membership.updatedAt.toISOString(),
      },
      expiresAt: expiresAt.toISOString(),
    };
  }

  async login(input: LoginInput) {
    const authenticatedUser = await this.authenticateCredentials(
      input.companySlug,
      input.identifier,
      input.password,
    );

    const membership = authenticatedUser.membership;

    if (!membership) {
      throw new ForbiddenException(
        'La cuenta no tiene acceso a una empresa activa.',
      );
    }

    const { token, session } = await this.sessionService.create(membership.id);

    const currentSession = this.toCurrentSessionResponse(
      authenticatedUser,
      membership,
      session.expiresAt,
    );

    return {
      token,
      currentSession,
    };
  }

  async logout(token: string): Promise<void> {
    await this.sessionService.revokeByToken(token);
  }
}
