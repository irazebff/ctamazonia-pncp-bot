import { Controller, Get, Post } from '@nestjs/common';
import { PncpService } from './pncp.service.js';

@Controller('pncp')
export class PncpController {
  constructor(private readonly pncpService: PncpService) { }

  @Get()
  async listarLicitações() {
    // Agora retorna a lista de oportunidades salvas no banco para o Frontend
    return this.pncpService.listarTodos();
  }

  @Post('varredura')
  async executarVarredura() {
    // Dispara a busca manual de forma mais segura (via POST)
    return this.pncpService.consultarDispensasTi();
  }
}
