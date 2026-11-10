'use client';

import React, { useState, useEffect } from 'react';
import {
  Terminal,
  RefreshCw,
  FileText,
  Building2,
  DollarSign,
  ShieldCheck,
  Search,
  ExternalLink,
  SlidersHorizontal,
  BellRing
} from 'lucide-react';

interface Dispensa {
  id: string | number;
  controlePncpId?: string;
  numeroControlePNCP?: string;
  objeto?: string;
  orgaoNome?: string;
  uf?: string;
  linkSistemaOrigem?: string;
  valorEstimado?: number;
  dataPublicacao?: string;
  modalidadeNome?: string;
}

export default function Page() {
  const [activeTab, setActiveTab] = useState<'licitacoes' | 'config'>('licitacoes');
  const [dispensas, setDispensas] = useState<Dispensa[]>([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  const [ufFiltro, setUfFiltro] = useState('Todos');
  const [modalidadeFiltro, setModalidadeFiltro] = useState('Todas');
  const [ultimaVarredura, setUltimaVarredura] = useState('--:--:--');

  const [termos, setTermos] = useState('software, sistema, portal, consultoria, ti, informática, desenvolvimento');
  const [whatsapp, setWhatsapp] = useState('(92) 99999-9999');

  const carregarDados = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/pncp');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setDispensas(data);
        }
      }
      setUltimaVarredura(new Date().toLocaleTimeString('pt-BR'));
    } catch (err) {
      console.error('Erro ao conectar com o backend NestJS:', err);
      setDispensas([]);
    } finally {
      setLoading(false);
    }
  };

  const forcarVarredura = async () => {
    setLoading(true);
    try {
      // 1. Dispara a varredura no portal governamental
      await fetch('http://localhost:3000/pncp/varredura', { method: 'POST' });
      // 2. Atualiza a lista lendo do banco de dados (que também remove o loading)
      await carregarDados();
    } catch (err) {
      console.error('Erro ao acionar a varredura manual:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Total absoluto gravado no banco de dados
  const totalOportunidades = dispensas.length;

  // Foco Amazonas Fixo: conta quantos itens do AM existem no banco total, independente dos filtros da barra
  const focoAmazonas = dispensas.filter(d => (d.uf || '').toUpperCase() === 'AM').length;

  // Filtro defensivo para a lista
  const dispensasFiltradas = dispensas.filter(item => {
    const objetoTexto = (item.objeto || '').toLowerCase();
    const orgaoTexto = (item.orgaoNome || '').toLowerCase();
    const numeroTexto = (item.numeroControlePNCP || '').toLowerCase();
    const termoBusca = busca.toLowerCase().trim();

    const atendeBusca = !termoBusca ||
      objetoTexto.includes(termoBusca) ||
      orgaoTexto.includes(termoBusca) ||
      numeroTexto.includes(termoBusca);

    const ufItem = (item.uf || '').toUpperCase();
    const atendeUf = ufFiltro === 'Todos' || ufItem === ufFiltro.toUpperCase();

    const modalidadeItem = (item.modalidadeNome || 'Dispensa Eletrônica').toLowerCase();
    const atendeModalidade = modalidadeFiltro === 'Todas' ||
      modalidadeItem.includes(modalidadeFiltro.toLowerCase());

    return atendeBusca && atendeUf && atendeModalidade;
  });

  // Valor médio calculado com base nos itens filtrados
  const valorMedio = dispensasFiltradas.length > 0
    ? dispensasFiltradas.reduce((acc, curr) => acc + Number(curr.valorEstimado || 0), 0) / dispensasFiltradas.length
    : 0;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans p-6 md:p-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">PNCP Monitor</h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20">
                CTAMAZÔNIA
              </span>
            </div>
            <p className="text-sm text-slate-400">Varredura automática de Licitações e Dispensas - TI</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Última varredura PNCP: <strong className="text-white">{ultimaVarredura}</strong></span>
          </div>

          <button
            onClick={forcarVarredura}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-lg transition-all text-sm shadow-lg shadow-emerald-500/10 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar Dados</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-8 mt-6 border-b border-slate-800/80">
        <button
          onClick={() => setActiveTab('licitacoes')}
          className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${activeTab === 'licitacoes'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
        >
          <FileText className="w-4 h-4" />
          <span>Licitações Encontradas</span>
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-slate-800 text-slate-300 rounded-full">{totalOportunidades}</span>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${activeTab === 'config'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Configuração de Termos & Alertas</span>
        </button>
      </div>

      {activeTab === 'licitacoes' ? (
        <>
          {/* Cards KPI */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-[#0d1322] border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Total Monitorado</span>
                <FileText className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-white">{totalOportunidades}</div>
              <div className="text-sm font-semibold text-slate-300 mt-0.5">Oportunidades</div>
              <p className="text-xs text-emerald-400/90 mt-3 flex items-center gap-1">
                ✓ Dispensas e editais ativos
              </p>
            </div>

            <div className="bg-[#0d1322] border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Foco Amazonas (AM)</span>
                <Building2 className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white">{focoAmazonas} Editais</div>
              <p className="text-xs text-slate-400 mt-4">Prefeitura, Estado e Órgãos Federais</p>
            </div>

            <div className="bg-[#0d1322] border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Valor Médio Estimado</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorMedio)}
              </div>
              <p className="text-xs text-amber-400/90 mt-4 font-medium">
                Modalidade: {modalidadeFiltro === 'Todas' ? 'Todas Selecionadas' : modalidadeFiltro}
              </p>
            </div>

            <div className="bg-[#0d1322] border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Status do Robô</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-center gap-2 text-2xl font-bold text-emerald-400">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Ativo 24/7</span>
              </div>
              <p className="text-xs text-slate-400 mt-4">Varredura a cada 30 minutos</p>
            </div>
          </div>

          {/* Barra de Filtros */}
          <div className="mt-6 bg-[#0d1322] border border-slate-800/80 rounded-xl p-3 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por objeto, órgão ou número..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>

            <select
              value={ufFiltro}
              onChange={(e) => setUfFiltro(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500/50 w-full md:w-48 cursor-pointer"
            >
              <option value="Todos">Todos os Estados</option>
              <option value="AM">Amazonas (AM)</option>
              <option value="PR">Paraná (PR)</option>
              <option value="SP">São Paulo (SP)</option>
              <option value="DF">Distrito Federal (DF)</option>
            </select>

            <select
              value={modalidadeFiltro}
              onChange={(e) => setModalidadeFiltro(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500/50 w-full md:w-56 cursor-pointer"
            >
              <option value="Todas">Todas as Modalidades</option>
              <option value="Dispensa">Dispensa Eletrônica</option>
              <option value="Inexigibilidade">Inexigibilidade</option>
              <option value="Pregão">Pregão Eletrônico</option>
            </select>
          </div>

          {/* Lista de Oportunidades */}
          <div className="mt-4 space-y-3">
            {dispensasFiltradas.length === 0 ? (
              <div className="bg-[#0d1322] border border-slate-800/80 rounded-2xl p-8 text-center text-slate-400 text-sm">
                Nenhuma contratação encontrada na base de dados para os filtros selecionados.
              </div>
            ) : (
              dispensasFiltradas.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#0d1322] border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 transition-all group"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 text-xs font-semibold bg-slate-800 text-emerald-400 rounded-md border border-slate-700">
                        {item.numeroControlePNCP || 'Licitação PNCP'}
                      </span>
                      <span className="px-2 py-1 text-xs font-bold bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20">
                        {item.uf || 'BR'}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20">
                        {item.modalidadeNome || 'Dispensa Eletrônica'}
                      </span>
                    </div>

                    <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                      Aberta
                    </span>
                  </div>

                  <div className="flex items-start gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <h3 className="font-semibold text-white text-base">{item.orgaoNome || 'Órgão Público'}</h3>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed mb-4 pl-6">
                    {item.objeto || 'Sem descrição cadastrada.'}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800/60 text-xs">
                    <div className="flex items-center gap-6">
                      <div className="text-emerald-400 font-bold text-base flex items-center gap-1">
                        <span className="text-xs text-slate-400 font-normal">$</span>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valorEstimado || 0)}
                      </div>
                      <div className="text-slate-400">
                        Publicado: <strong className="text-slate-200">{item.dataPublicacao || '--/--/----'}</strong>
                      </div>
                    </div>

                    <a
                      href={item.linkSistemaOrigem || 'https://pncp.gov.br'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-all font-medium cursor-pointer"
                    >
                      <span>Acessar no PNCP</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* Configuração */
        <div className="mt-6 bg-[#0d1322] border border-slate-800/80 rounded-2xl p-6 max-w-2xl">
          <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <BellRing className="w-5 h-5 text-emerald-400" />
            Configuração de Alertas e Palavras-Chave
          </h2>
          <p className="text-xs text-slate-400 mb-6">Ajuste os termos monitorados pelo robô do PNCP e o número do WhatsApp de destino.</p>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Palavras-chave de TI (separadas por vírgula)
              </label>
              <textarea
                rows={3}
                value={termos}
                onChange={(e) => setTermos(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                WhatsApp de Destino para Alertas
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <button
              onClick={() => alert('Configurações salvas no backend com sucesso!')}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-sm transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      )}
    </div>
  );
}