
'use client'

// Mock temporário para motion
const motion = {
  div: 'div' as any,
  span: 'span' as any,
  button: 'button' as any,
}
// Centro de relatórios operacionais

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { FileText, Download, Filter, Calendar, Activity, TrendingUp, Zap, BarChart3, ArrowLeft, RefreshCw, Target, Settings } from 'lucide-react'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import {
  useOperationalReports,
  type ConfigRelatorioOperacional,
  type DateRange,
} from '@/shared/hooks/data/use-operational-reports'
import { getMonthRange, formatCurrency } from '@/components/financial/utils'

interface OperationalReportsCenterProps {
  className?: string
}

export const OperationalReportsCenter = ({ className = '' }: OperationalReportsCenterProps) => {
  const router = useRouter()
  const {
    relatorioProdutividade,
    relatorioServicos,
    relatorioEficiencia,
    relatorioAnalise,
    isLoading,
    isError,
    error,
    gerarRelatorioProdutividade,
    gerarRelatorioServicos,
    gerarRelatorioEficiencia,
    gerarRelatorioAnalise,
    exportarRelatorio,
    limparRelatorios,
  } = useOperationalReports()

  // Estados locais
  const [tipoRelatorio, setTipoRelatorio] =
    useState<ConfigRelatorioOperacional['tipo']>('PRODUTIVIDADE')
  const [periodo, setPeriodo] = useState<DateRange>(getMonthRange())
  const [filtros, setFiltros] = useState<ConfigRelatorioOperacional['filtros']>({})
  const [formatoExportacao, setFormatoExportacao] =
    useState<ConfigRelatorioOperacional['formato']>('CSV')

  // Tipos de relatório disponíveis
  const tiposRelatorio = [
    {
      tipo: 'PRODUTIVIDADE' as const,
      nome: 'Produtividade',
      descricao: 'Análise de produtividade por barbeiro',
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      tipo: 'SERVICOS' as const,
      nome: 'Serviços',
      descricao: 'Análise de serviços mais vendidos',
      icon: Settings,
      color: 'text-blue-600',
    },
    {
      tipo: 'EFICIENCIA' as const,
      nome: 'Eficiência',
      descricao: 'Análise de eficiência operacional',
      icon: Zap,
      color: 'text-yellow-600',
    },
    {
      tipo: 'ANALISE' as const,
      nome: 'Análise Geral',
      descricao: 'Análise operacional completa',
      icon: Target,
      color: 'text-purple-600',
    },
  ]

  // Formatos de exportação
  const formatosExportacao = [
    { formato: 'CSV' as const, nome: 'CSV', icon: FileText },
    { formato: 'EXCEL' as const, nome: 'Excel', icon: FileSpreadsheet },
    { formato: 'PDF' as const, nome: 'PDF', icon: FileImage },
  ]

  // Gerar relatório
  const handleGerarRelatorio = async () => {
    const config: ConfigRelatorioOperacional = {
      tipo: tipoRelatorio,
      periodo,
      filtros,
      formato: formatoExportacao,
    }

    switch (tipoRelatorio) {
      case 'PRODUTIVIDADE':
        await gerarRelatorioProdutividade(config)
        break
      case 'SERVICOS':
        await gerarRelatorioServicos(config)
        break
      case 'EFICIENCIA':
        await gerarRelatorioEficiencia(config)
        break
      case 'ANALISE':
        await gerarRelatorioAnalise(config)
        break
    }
  }

  // Exportar relatório atual
  const handleExportar = async () => {
    await exportarRelatorio(tipoRelatorio, formatoExportacao)
  }

  // Obter dados do relatório atual
  const getDadosRelatorioAtual = () => {
    switch (tipoRelatorio) {
      case 'PRODUTIVIDADE':
        return relatorioProdutividade
      case 'SERVICOS':
        return relatorioServicos
      case 'EFICIENCIA':
        return relatorioEficiencia
      case 'ANALISE':
        return relatorioAnalise
      default:
        return null
    }
  }

  const dadosAtual = getDadosRelatorioAtual()

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Moderno */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8 text-center"
      >
        <div className="mb-6 flex items-center justify-center space-x-4">
          <div className="rounded-2xl bg-gradient-to-br from-primary-gold to-primary-gold-dark p-4 shadow-xl">
            <Activity className="h-10 w-10 text-primary-black" />
          </div>
          <div>
            <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
              Relatórios Operacionais
            </h1>
            <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
              Análise de produtividade, serviços e eficiência operacional
            </p>
          </div>
        </div>
        <div className="mx-auto mb-6 h-1 w-24 rounded-full bg-gradient-to-r from-primary-gold to-primary-gold-dark"></div>

        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-2 rounded-lg border-primary-gold/50 px-4 py-2 font-semibold text-primary-gold shadow-md transition-all duration-300 hover:border-primary-gold hover:bg-primary-gold/20 hover:text-primary-gold-dark hover:shadow-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={limparRelatorios}
            disabled={isLoading}
            className="flex items-center space-x-2 border-primary-gold/30 hover:border-primary-gold/50 hover:bg-primary-gold/10"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Limpar Relatórios</span>
          </Button>
        </div>
      </motion.div>

      {/* Seleção de Tipo de Relatório */}
      <Card className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-lg transition-all duration-300 hover:shadow-2xl dark:border-secondary-graphite dark:from-secondary-graphite-light dark:to-secondary-graphite">
        <div className="mb-6 border-b border-gray-200 bg-gradient-to-r from-primary-gold/5 to-transparent px-2 py-2 dark:border-secondary-graphite-card/30">
          <h2 className="flex items-center gap-3 text-xl font-bold text-gray-900 dark:text-white">
            <div className="rounded-lg bg-primary-gold/10 p-2">
              <BarChart3 className="h-6 w-6 text-primary-gold" />
            </div>
            Tipo de Relatório
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {tiposRelatorio.map((tipo) => {
            const Icon = tipo.icon
            const isSelected = tipoRelatorio === tipo.tipo

            return (
              <motion.div key={tipo.tipo} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card
                  className={`cursor-pointer border border-gray-200 p-4 transition-all duration-200 hover:border-primary-gold/50 hover:shadow-lg dark:border-secondary-graphite-card/30 dark:hover:shadow-xl ${
                    isSelected
                      ? 'border-primary-gold bg-primary-gold/5 ring-2 ring-primary-gold dark:bg-primary-gold/10'
                      : 'bg-white hover:bg-gray-50 dark:bg-secondary-graphite-light dark:hover:bg-secondary-graphite-card/30'
                  }`}
                  onClick={() => setTipoRelatorio(tipo.tipo)}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`rounded-lg p-2 ${isSelected ? 'bg-primary-gold/20' : 'bg-gray-100 dark:bg-secondary-graphite-card/50'}`}
                    >
                      <Icon
                        className={`h-6 w-6 ${isSelected ? 'text-primary-gold' : tipo.color + ' dark:text-gray-300'}`}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{tipo.nome}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{tipo.descricao}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </Card>

      {/* Configurações do Relatório */}
      <Card className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-lg transition-all duration-300 hover:shadow-2xl dark:border-secondary-graphite dark:from-secondary-graphite-light dark:to-secondary-graphite">
        <div className="mb-6 border-b border-gray-200 bg-gradient-to-r from-primary-gold/5 to-transparent px-2 py-2 dark:border-secondary-graphite-card/30">
          <h2 className="flex items-center gap-3 text-xl font-bold text-gray-900 dark:text-white">
            <div className="rounded-lg bg-primary-gold/10 p-2">
              <Filter className="h-6 w-6 text-primary-gold" />
            </div>
            Configurações do Relatório
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Período */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
              <Calendar className="mr-1 inline h-4 w-4" />
              Período
            </label>
            <div className="space-y-2">
              <input
                type="date"
                value={periodo.inicio}
                onChange={(e) => setPeriodo((prev) => ({ ...prev, inicio: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-gold dark:border-secondary-graphite-card/30 dark:bg-secondary-graphite-light dark:text-white"
              />
              <input
                type="date"
                value={periodo.fim}
                onChange={(e) => setPeriodo((prev) => ({ ...prev, fim: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-gold dark:border-secondary-graphite-card/30 dark:bg-secondary-graphite-light dark:text-white"
              />
            </div>
          </div>

          {/* Filtros */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
              <Filter className="mr-1 inline h-4 w-4" />
              Filtros
            </label>
            <div className="space-y-2">
              {(tipoRelatorio === 'PRODUTIVIDADE' || tipoRelatorio === 'EFICIENCIA') && (
                <select
                  value={filtros.barbeiroId || ''}
                  onChange={(e) =>
                    setFiltros((prev) => ({ ...prev, barbeiroId: e.target.value || undefined }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-gold dark:border-secondary-graphite-card/30 dark:bg-secondary-graphite-light dark:text-white"
                >
                  <option value="">Todos os barbeiros</option>
                  <option value="1">Carlos Santos</option>
                  <option value="2">Roberto Lima</option>
                </select>
              )}

              {tipoRelatorio === 'SERVICOS' && (
                <>
                  <select
                    value={filtros.servicoId || ''}
                    onChange={(e) =>
                      setFiltros((prev) => ({ ...prev, servicoId: e.target.value || undefined }))
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-gold dark:border-secondary-graphite-card/30 dark:bg-secondary-graphite-light dark:text-white"
                  >
                    <option value="">Todos os serviços</option>
                    <option value="1">Corte Masculino</option>
                    <option value="2">Corte + Barba</option>
                    <option value="3">Barba</option>
                  </select>
                  <select
                    value={filtros.categoriaId || ''}
                    onChange={(e) =>
                      setFiltros((prev) => ({ ...prev, categoriaId: e.target.value || undefined }))
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-gold dark:border-secondary-graphite-card/30 dark:bg-secondary-graphite-light dark:text-white"
                  >
                    <option value="">Todas as categorias</option>
                    <option value="Cortes">Cortes</option>
                    <option value="Combos">Combos</option>
                    <option value="Barba">Barba</option>
                  </select>
                </>
              )}

              {tipoRelatorio === 'ANALISE' && (
                <div className="py-2 text-sm italic text-gray-500 dark:text-gray-400">
                  Análise geral - sem filtros específicos
                </div>
              )}
            </div>
          </div>

          {/* Formato de Exportação */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
              <Download className="mr-1 inline h-4 w-4" />
              Formato de Exportação
            </label>
            <div className="flex space-x-2">
              {formatosExportacao.map((formato) => {
                const Icon = formato.icon
                const isSelected = formatoExportacao === formato.formato

                return (
                  <Button
                    key={formato.formato}
                    variant={isSelected ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setFormatoExportacao(formato.formato)}
                    className={`flex items-center space-x-1 ${
                      isSelected
                        ? 'border-primary-gold bg-primary-gold text-primary-black hover:bg-primary-gold-dark'
                        : 'border-primary-gold/30 text-gray-700 hover:border-primary-gold/50 hover:bg-primary-gold/10 dark:text-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{formato.nome}</span>
                  </Button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6 dark:border-secondary-graphite-card/30">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {dadosAtual && (
              <span>
                Relatório gerado com {Array.isArray(dadosAtual.dados) ? dadosAtual.dados.length : 1}{' '}
                registro(s)
              </span>
            )}
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleGerarRelatorio}
              disabled={isLoading}
              className="flex items-center space-x-2 rounded-xl bg-primary-gold px-6 py-3 font-semibold text-primary-black shadow-lg transition-all duration-300 hover:bg-primary-gold-dark hover:shadow-xl"
            >
              <BarChart3 className="h-5 w-5" />
              <span>{isLoading ? 'Gerando...' : 'Gerar Relatório'}</span>
            </Button>

            {dadosAtual && (
              <Button
                variant="outline"
                onClick={handleExportar}
                disabled={isLoading}
                className="flex items-center space-x-2 border-primary-gold/30 hover:border-primary-gold/50 hover:bg-primary-gold/10"
              >
                <Download className="h-4 w-4" />
                <span>Exportar</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Visualização do Relatório */}
      {dadosAtual && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-lg transition-all duration-300 hover:shadow-2xl dark:border-secondary-graphite dark:from-secondary-graphite-light dark:to-secondary-graphite">
            <div className="mb-6 border-b border-gray-200 bg-gradient-to-r from-primary-gold/5 to-transparent px-2 py-4 dark:border-secondary-graphite-card/30">
              <h2 className="flex items-center gap-3 text-xl font-bold text-gray-900 dark:text-white">
                <div className="rounded-lg bg-primary-gold/10 p-2">
                  <FileText className="h-6 w-6 text-primary-gold" />
                </div>
                Prévia do Relatório - {tiposRelatorio.find((t) => t.tipo === tipoRelatorio)?.nome}
              </h2>
            </div>

            {/* Resumo */}
            {dadosAtual.resumo && (
              <div className="mb-6 rounded-lg border border-primary-gold/20 bg-gradient-to-r from-primary-gold/5 to-transparent p-4 dark:from-primary-gold/10 dark:to-transparent">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                  <BarChart3 className="h-5 w-5 text-primary-gold" />
                  Resumo Executivo
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  {Object.entries(dadosAtual.resumo).map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded-lg border border-gray-200 bg-white p-3 dark:border-secondary-graphite-card/50 dark:bg-secondary-graphite-card/30"
                    >
                      <span className="mb-1 block text-xs font-medium capitalize text-gray-600 dark:text-gray-400">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                      <div className="font-bold text-gray-900 dark:text-white">
                        {typeof value === 'number' &&
                        (key.includes('receita') || key.includes('Receita'))
                          ? formatCurrency(value)
                          : typeof value === 'number' &&
                              (key.includes('percentual') ||
                                key.includes('Percentual') ||
                                key.includes('eficiencia') ||
                                key.includes('Eficiencia'))
                            ? `${value.toFixed(1)}%`
                            : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dados */}
            {Array.isArray(dadosAtual.dados) && dadosAtual.dados.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-secondary-graphite-card/30">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-secondary-graphite-card dark:to-secondary-graphite-light">
                    <tr>
                      {Object.keys(dadosAtual.dados[0]).map((key) => (
                        <th
                          key={key}
                          className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200"
                        >
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-secondary-graphite-card/30 dark:bg-secondary-graphite-light">
                    {dadosAtual.dados
                      .slice(0, 10)
                      .map((item: Record<string, unknown>, index: number) => (
                        <tr
                          key={index}
                          className="transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-secondary-graphite-card/30"
                        >
                          {Object.entries(item).map(([key, value]) => (
                            <td
                              key={key}
                              className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white"
                            >
                              {typeof value === 'number' &&
                              (key.includes('receita') || key.includes('Receita'))
                                ? formatCurrency(value)
                                : typeof value === 'number' &&
                                    (key.includes('percentual') ||
                                      key.includes('Percentual') ||
                                      key.includes('eficiencia') ||
                                      key.includes('Eficiencia') ||
                                      key.includes('score') ||
                                      key.includes('Score'))
                                  ? `${value}%`
                                  : Array.isArray(value)
                                    ? value.join(', ')
                                    : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>

                {dadosAtual.dados.length > 10 && (
                  <div className="mt-4 rounded-lg border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 py-6 text-center text-sm text-gray-600 dark:border-secondary-graphite-card/50 dark:from-secondary-graphite-card dark:to-secondary-graphite-light dark:text-gray-400">
                    <strong>Mostrando 10 de {dadosAtual.dados.length} registros.</strong>
                    <br />
                    Exporte o relatório para ver todos os dados.
                  </div>
                )}
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Estado de Erro */}
      {isError && error && (
        <Card className="rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-red-100 p-8 shadow-lg dark:border-red-800/30 dark:from-red-900/20 dark:to-red-900/30">
          <div className="flex items-center space-x-4 text-red-600 dark:text-red-400">
            <div className="rounded-xl bg-red-100 p-3 dark:bg-red-900/40">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <h3 className="mb-1 text-lg font-bold">Erro ao gerar relatório</h3>
              <p className="text-sm font-medium">{error.message}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Estado Vazio */}
      {!isLoading && !dadosAtual && !isError && (
        <Card className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-12 text-center shadow-lg dark:border-secondary-graphite dark:from-secondary-graphite-light dark:to-secondary-graphite">
          <div className="mx-auto mb-6 w-fit rounded-2xl bg-primary-gold/10 p-6">
            <Activity className="mx-auto h-16 w-16 text-primary-gold" />
          </div>
          <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
            Nenhum relatório gerado
          </h3>
          <p className="mb-6 font-medium text-gray-600 dark:text-gray-300">
            Selecione o tipo de relatório, configure os filtros e clique em &quot;Gerar
            Relatório&quot; para visualizar os dados operacionais.
          </p>
          <Button
            onClick={handleGerarRelatorio}
            disabled={isLoading}
            className="rounded-xl bg-primary-gold px-8 py-3 font-semibold text-primary-black shadow-lg transition-all duration-300 hover:bg-primary-gold-dark hover:shadow-xl"
          >
            <Activity className="mr-2 h-5 w-5" />
            Gerar Relatório
          </Button>
        </Card>
      )}
    </div>
  )
}
