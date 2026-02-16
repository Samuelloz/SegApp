import { Controller, Get, Post, Body } from '@nestjs/common';

type Contract = { id: string; name: string; };

const contracts: Contract[] = [
  { id: 'c1', name: 'Contrato Plaza Principal'},
  { id: 'c2', name: 'Contrato Bodega Norte' },
];

@Controller()
export class AppController {
}