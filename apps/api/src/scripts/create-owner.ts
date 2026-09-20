import 'dotenv/config';

import {
  userEmailSchema,
  userNameSchema,
  userPasswordSchema,
} from '@segapp/contracts';

import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { PasswordService } from '../auth/password.service';
import { PrismaService } from '../prisma/prisma.service';

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}.`);
  }

  return value;
}

function getOwnerConfiguration() {
  const nameResult = userNameSchema.safeParse(
    getRequiredEnvironmentVariable('OWNER_NAME'),
  );

  if (!nameResult.success) {
    throw new Error(
      nameResult.error.issues[0]?.message ??
        'El nombre del propietario no es válido.',
    );
  }

  const emailResult = userEmailSchema.safeParse(
    getRequiredEnvironmentVariable('OWNER_EMAIL'),
  );

  if (!emailResult.success) {
    throw new Error(
      emailResult.error.issues[0]?.message ??
        'El correo electrónico no es válido.',
    );
  }

  const passwordResult = userPasswordSchema.safeParse(
    getRequiredEnvironmentVariable('OWNER_PASSWORD'),
  );

  if (!passwordResult.success) {
    throw new Error(
      passwordResult.error.issues[0]?.message ?? 'La contraseña no es válida.',
    );
  }

  const companySlug = getRequiredEnvironmentVariable('OWNER_COMPANY_SLUG')
    .trim()
    .toLowerCase();

  return {
    name: nameResult.data,
    email: emailResult.data,
    password: passwordResult.data,
    companySlug,
  };
}

async function createOwner(): Promise<void> {
  const configuration = getOwnerConfiguration();

  const application = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const prisma = application.get(PrismaService);
    const passwordService = application.get(PasswordService);

    const company = await prisma.company.findFirst({
      where: {
        slug: configuration.companySlug,
        active: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!company) {
      throw new Error(
        `No existe una empresa activa con el slug "${configuration.companySlug}".`,
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: configuration.email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      throw new Error(
        `Ya existe un usuario con el correo ${configuration.email}.`,
      );
    }

    const existingOwner = await prisma.companyMembership.findFirst({
      where: {
        companyId: company.id,
        role: 'OWNER',
      },
      select: {
        id: true,
      },
    });

    if (existingOwner) {
      throw new Error(`La empresa ${company.name} ya tiene un propietario.`);
    }

    const passwordHash = await passwordService.hash(configuration.password);

    const owner = await prisma.user.create({
      data: {
        name: configuration.name,
        email: configuration.email,
        passwordHash,
        emailVerifiedAt: new Date(),
        membership: {
          create: {
            companyId: company.id,
            role: 'OWNER',
            status: 'ACTIVE',
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    console.log(
      `Propietario ${owner.name} (${owner.email}) creado para ${company.name}.`,
    );
  } finally {
    await application.close();
  }
}

void createOwner().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Ocurrió un error desconocido.';

  console.error(`No fue posible crear al propietario: ${message}`);
  process.exitCode = 1;
});
