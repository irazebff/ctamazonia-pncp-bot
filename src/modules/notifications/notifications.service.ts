import { Injectable, Logger } from '@nestjs/common';
import { PncpItem } from '../pncp/entities/pncp-item.entity.js';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  // Lendo das variáveis de ambiente com fallbacks de segurança
  private readonly numeroDestino = process.env.WHATSAPP_DESTINO || '';
  private readonly evolutionApiUrl = process.env.EVOLUTION_API_URL || '';
  private readonly apiKey = process.env.EVOLUTION_API_KEY || '';

  async notificarOportunidadeWhatsapp(item: PncpItem) {
    if (!this.numeroDestino || !this.evolutionApiUrl || !this.apiKey) {
      this.logger.warn('[WHATSAPP] Credenciais ausentes no .env. Notificação cancelada.');
      return false;
    }

    const mensagem = this.formatarMensagem(item);

    this.logger.log(`[WHATSAPP] Enviando alerta real de nova dispensa para ${this.numeroDestino}...`);

    try {
      const response = await fetch(this.evolutionApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
        },
        body: JSON.stringify({
          number: this.numeroDestino,
          text: mensagem,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Status ${response.status}: ${errText}`);
      }

      this.logger.log(`[WHATSAPP OK] Alerta enviado via Evolution API para ${this.numeroDestino}!`);
      return true;
    } catch (error: any) {
      this.logger.error(`[WHATSAPP ERRO] Falha ao enviar mensagem: ${error.message}`);
      return false;
    }
  }

  private formatarMensagem(item: PncpItem): string {
    const valorFmt = item.valorEstimado
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(item.valorEstimado))
      : 'Não informado';

    return `🚀 *NOVA DISPENSA DE TI ENCONTRADA (PNCP)* 🚀\n\n` +
      `📍 *Órgão:* ${item.orgaoNome} (${item.uf})\n` +
      `💰 *Valor Estimado:* ${valorFmt}\n` +
      `📝 *Objeto:* ${item.objeto}\n\n` +
      `🔗 *Link/ID:* ${item.numeroControlePNCP}\n` +
      `🌐 *Acesse:* ${item.linkSistemaOrigem || 'https://pncp.gov.br'}\n\n` +
      `_CTAMAZÔNIA - Monitor de Licitações_`;
  }
}