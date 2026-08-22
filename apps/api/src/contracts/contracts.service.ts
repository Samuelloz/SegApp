import {
    Injectable,
    NotFoundException
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ContractsService {
    constructor(private prisma: PrismaService) { }

    findAll() {
        return this.prisma.contract.findMany({
            orderBy: { createdAt: "desc" },
        });
    }

    create(name: string) {
        return this.prisma.contract.create({
            data: { name },
        });
    }

    async update(id: string, name: string) {
        const current = await this.prisma.contract.findUnique({
            where: { id }
        });

        if (!current) {
            throw new NotFoundException('Contrato no encontrado.');
        }

        return this.prisma.contract.update({
            where: { id },
            data: { name },
        });
    }

    async toggleActive(id: string) {
        const current = await this.prisma.contract.findUnique({
            where: { id },
            select: { active: true }
        });

        if (!current) {
            throw new NotFoundException('Contrato no encontrado.');
        }

        return this.prisma.contract.update({
            where: { id },
            data: { active: !current.active }
        });
    }
}
