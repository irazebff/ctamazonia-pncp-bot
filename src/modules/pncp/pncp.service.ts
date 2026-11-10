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
    this.logger.log('Iniciando varredura multi-modalidade de TI no PNCP (Pregão, Inexigibilidade, Dispensa)...');

    try {
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');

      const dataFormatadaConsulta = `${ano}${mes}${dia}`;
      const dataFormatadaIso = `${ano}-${mes}-${dia}`;

      // Principais modalidades de interesse para empresas de TI:
      // 6 = Pregão Eletrônico, 7 = Inexigibilidade (ideal para softwares próprios/SIGALI), 8 = Dispensa Eletrônica
      const modalidades = [6, 7, 8];
      let totalLidosGeral = 0;
      let novasOportunidades = 0;

      const termosTi = ['software', 'sistema', 'portal', 'consultoria', 'ti', 'informática', 'desenvolvimento', 'computador', 'tecnologia', 'rede', 'serviços', 'servicos', 'sigali'];

      for (const modalidade of modalidades) {
        const url = `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?dataInicial=${dataFormatadaConsulta}&dataFinal=${dataFormatadaConsulta}&codigoModalidadeContratacao=${modalidade}&pagina=1`;

        this.logger.log(`[PNCP] Consultando modalidade ${modalidade}: ${url}`);

        try {
          const response = await fetch(url, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'CTAMAZONIA-Monitor/1.0',
            },
          });

          if (!response.ok) {
            this.logger.warn(`[PNCP] Modalidade ${modalidade} retornou status ${response.status}`);
            continue;
          }

          const data = await response.json();
          const itens: any[] = Array.isArray(data) ? data : (data.data || data.items || data.resultado || data.content || []);

          totalLidosGeral += itens.length;

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
                  modalidadeNome: item.modalidadeContratacaoNome || item.modalidadeNome || (modalidade === 6 ? 'Pregão Eletrônico' : modalidade === 7 ? 'Inexigibilidade' : 'Dispensa Eletrônica'),
                });

                const itemSalvo = await this.pncpItemRepository.save(novoItem);
                novasOportunidades++;

                await this.notificationsService.notificarOportunidadeWhatsapp(itemSalvo);
              }
            }
          }
        } catch (errModalidade: any) {
          this.logger.error(`[PNCP] Erro ao consultar modalidade ${modalidade}: ${errModalidade.message}`);
        }
      }

      this.logger.log(`[PNCP] Varredura multi-modalidade concluída: ${totalLidosGeral} lidas, ${novasOportunidades} novas oportunidades de TI gravadas.`);

      return {
        status: 'Sucesso',
        totalProcessados: totalLidosGeral,
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
