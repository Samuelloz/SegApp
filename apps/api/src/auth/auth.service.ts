import { Injectable, UnauthorizedException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './password.service';

const INVALID_CREDENTIALS_MESSAGE =
  'Correo electrónico o contraseña incorrectos.';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
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
}
