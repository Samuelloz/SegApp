import { ConflictException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class GuardService {
    constructor(private prisma: PrismaService) { }

    findAll() {
        return this.prisma.guard.findMany({
            orderBy: { createdAt: "desc" },
        });
    }

    async create(fullname: string, employeeNumber: string, phone: string) {
        try {
            return await this.prisma.guard.create({
                data: {
                    fullname,
                    employeeNumber,
                    phone,
                },
            });
        } catch (error: unknown) {
            this.handlePrismaError(error);
        }
    }

    async toggleActive(id: string) {
        const current = await this.prisma.guard.findUnique({
            where: { id },
            select: { active: true }
        });

        if (!current) throw new Error('Guardia no Encontrado');

        return this.prisma.guard.update({
            where: { id },
            data: { active: !current.active }
        });
    }

    async update(id: string, fullname: string, employeeNumber: string, phone: string) {
        const current = await this.prisma.guard.findUnique({
            where: { id },
        });

        if (!current) throw new Error('Guardia no Encontrado');

        try {
            return await this.prisma.guard.update({
                where: { id },
                data: {
                    fullname,
                    employeeNumber,
                    phone,
                },
            });
        } catch (error: unknown) {
            this.handlePrismaError(error);
        }
    }

    private handlePrismaError(error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new ConflictException("El número de empleado ya está registrado.");
        }

        throw error;
    }
}
