import { BadRequestException, Body, Controller, Get, Post, Patch, Param } from '@nestjs/common';
import { GuardService } from './guards.service';

@Controller('guards')
export class GuardsController {
    constructor(private service: GuardService) {}

    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Post()
    create(@Body() body: { fullname?: string, employeeNumber?: string, phone?: string}) {
        const name = (body?.fullname ?? '').trim();
        const employeeNumber = (body?.employeeNumber ?? '').trim();
        const phone = (body?.phone ?? '').trim();

        if (!name) throw new BadRequestException('El nombre es obligatorio');
        if (!employeeNumber) throw new BadRequestException('El número de empleado es obligatorio');

        return this.service.create(name, employeeNumber, phone);
    }

    @Patch(':id/toggle')
    toggle(@Param('id') id: string) {
        return this.service.toggleActive(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: {fullname?: string, employeeNumber?: string, phone?: string}) {
        const name = body?.fullname?.trim();
        const employeeNumber = body?.employeeNumber?.trim();
        const phone = (body?.phone ?? '' ).trim();

        if (!name) throw new BadRequestException('El nombre es obligatorio');
        if (!employeeNumber) throw new BadRequestException('El número de empleado es obligatorio');

        return this.service.update(id, name, employeeNumber, phone);
    }
}