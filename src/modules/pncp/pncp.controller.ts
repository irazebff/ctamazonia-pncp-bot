import { Controller, Get } from '@nestjs/common';
import { PncpService } from './pncp.service.js';

@Controller('pncp')
export class PncpController {
  constructor(private readonly pncpService: PncpService) {}

  @Get()
  async listarLicitações() {
    return this.pncpService.consultarDispensasTi();
  }

  @Get('executar')
  async executarVarredura() {
    return this.pncpService.consultarDispensasTi();
  }
}
