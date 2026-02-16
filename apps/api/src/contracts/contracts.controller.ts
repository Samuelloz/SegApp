import { BadRequestException, Body, Controller, Get, Patch, Post, Param } from '@nestjs/common';
import { ContractsService } from './contracts.service';

@Controller('contracts')
export class ContractsController {
    constructor(private service: ContractsService) {}

    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Post()
    create(@Body() body: { name?: string }) {
        const name = (body?.name ?? '').trim();
        if (!name) throw new Error('El nombre es obligatorio');
        return this.service.create(name);
    }

    @Patch(':id/toggle')
    toggle(@Param('id') id: string) {
        return this.service.toggleActive(id);
    }
}