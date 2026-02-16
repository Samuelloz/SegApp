import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class GuardService {
    constructor(private prisma: PrismaService) {}

    findAll() {
        return this.prisma.guard.findMany({
            orderBy: { createdAt: "desc" },
        });
    }

    create(fullname: string, employeeNumber: string, phone: string) {
        return this.prisma.guard.create({
            data: { fullname, employeeNumber, phone },
        });
    }

    async toggleActive(id: string) {
        const current = await this.prisma.guard.findUnique({
            where: { id},
            select: { active: true }
        });
        
        if (!current) throw new Error('Guardia no Encontrado');

        return this.prisma.guard.update({
            where: { id },
            data: { active: !current.active }
        });
    }
}
