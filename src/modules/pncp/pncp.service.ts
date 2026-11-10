import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { PncpItem } from './entities/pncp-item.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class PncpService {
  private readonly logger = new Logger(PncpService.name);

  constructor(
    @InjectRepository(PncpItem)
    private readonly pncpItemRepository: Repository<PncpItem>,
    private readonly notificationsService: NotificationsService,
  ) { }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async executarCronAgendado() {
    this.logger.log('[CRON] Iniciando varredura automatizada agendada...');
    await this.consultarDispensasTi();
  }

  async listarTodos() {
    return this.pncpItemRepository.find({
      order: { id: 'DESC' },
    });
  }

  async consultarDispensasTi() {
    this.logger.log('Iniciando varredura de dispensas de TI no PNCP...');

    try {
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');

      // O novo endpoint exige o formato YYYYMMDD
      const dataFormatadaConsulta = `${ano}${mes}${dia}`;
      const dataFormatadaIso = `${ano}-${mes}-${dia}`;

      // URL corrigida conforme o contrato exigido pela API atual do PNCP
      const url = `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?dataInicial=${dataFormatadaConsulta}&dataFinal=${dataFormatadaConsulta}&codigoModalidadeContratacao=8&pagina=1`;

      this.logger.log(`[PNCP] Consultando API oficial: ${url}`);

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CTAMAZONIA-Monitor/1.0',
        },
      });

      if (!response.ok) {
        const erroTexto = await response.text();
        throw new Error(`Erro na API do Governo (${response.status}): ${erroTexto}`);
      }

      const data = await response.json();

      // O endpoint de consulta costuma retornar uma lista direta ou dentro de .data / .items
      const itens: any[] = Array.isArray(data) ? data : (data.data || data.items || data.resultado || data.content || []);

      if (itens.length === 0) {
        this.logger.log(`[PNCP] Nenhuma dispensa encontrada no portal para a data de hoje (${dataFormatadaIso}).`);
        return {
          status: 'Sucesso',
          totalProcessados: 0,
          novasOportunidadesSalvas: 0,
        };
      }

      let novasOportunidades = 0;
      const termosTi = ['software', 'sistema', 'portal', 'consultoria', 'ti', 'informática', 'desenvolvimento', 'computador', 'tecnologia', 'rede', 'serviços', 'servicos'];

      for (const item of itens) {
        const objeto = (item.objetoContratacao || item.objeto || '').toLowerCase();

        const contemTermoTi = termosTi.some(termo => {
          const regex = new RegExp(`\\b${termo}\\b`, 'i');
          return regex.test(objeto);
        });

        if (contemTermoTi) {
          const controlePncpId = item.numeroControlePNCP || `${item.cnpjOrgao}-${item.ano}-${item.sequencial || 'sem-id'}`;

          const existe = await this.pncpItemRepository.findOne({ where: { controlePncpId } });

          if (!existe) {
            const linkValido = item.linkSistemaOrigem || item.url || `https://pncp.gov.br`;

            const novoItem = this.pncpItemRepository.create({
              controlePncpId,
              numeroControlePNCP: item.numeroControlePNCP || controlePncpId,
              objeto: item.objetoContratacao || item.objeto || 'Sem descrição',
              orgaoNome: item.orgaoNome || item.nomeOrgao || 'Órgão público',
              uf: item.uf || item.siglaUf || 'BR',
              linkSistemaOrigem: linkValido,
              valorEstimado: item.valorEstimado || 0,
              dataPublicacao: item.dataPublicacao || dataFormatadaIso,
            });

            const itemSalvo = await this.pncpItemRepository.save(novoItem);
            novasOportunidades++;

            await this.notificationsService.notificarOportunidadeWhatsapp(itemSalvo);
          }
        }
      }

      this.logger.log(`[PNCP] Processo concluído: ${itens.length} lidas, ${novasOportunidades} gravadas.`);

      return {
        status: 'Sucesso',
        totalProcessados: itens.length,
        novasOportunidadesSalvas: novasOportunidades,
      };

    } catch (error: any) {
      this.logger.error(`[ERRO PNCP] Falha na execução do robô: ${error.message}`);
      return {
        status: 'Erro',
        mensagem: error.message,
      };
    }
  }
}
