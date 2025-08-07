
'use client'

// Mock temporário para motion
const motion = {
  div: 'div' as any,
  span: 'span' as any,
  button: 'button' as any,
}
// Centro de relatórios financeiros

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { FileText, Download, Filter, Calendar, TrendingUp, TrendingDown, Users, BarChart3, ArrowLeft, RefreshCw } from '@/shared/utils/optimized-imports'
import { Card } from '@/shared/components/ui'
import { Button } from '@/shared/components/ui'
import { useReports } from '../hooks/use-reports'
import { getMonthRange, formatCurrency } from '../utils'
import type { DateRange } from '../types/index'

// Definindo o tipo localmente para evitar problemas de importação
type ConfigRelatorio = {
  tipo: 'RECEITAS' | 'DESPESAS' | 'DRE' | 'FLUXO_CAIXA' | 'COMISSOES'
  periodo: {
    inicio: string
    fim: string
  }
  filtros: {
    barbeiroId?: string
    categoriaId?: string
    statusPagamento?: string
  }
  formato: 'PDF' | 'EXCEL' | 'CSV'
}

interface ReportsCenterProps {
  className?: string
}

export const ReportsCenter = ({ className = '' }: ReportsCenterProps) => {
  const router = useRouter()
  const {
    relatorioReceitas,
    relatorioDespesas,
    relatorioComissoes,
    dreData,
    isLoading,
    isError,
    error,
    gerarRelatorioReceitas,
    gerarRelatorioDespesas,
    gerarRelatorioComissoes,
    gerarDRE,
    exportarRelatorio,
    limparRelatorios
  } = useReports()

  // Estados locais
  const [tipoRelatorio, setTipoRelatorio] = useState<ConfigRelatorio['tipo']>('RECEITAS')
  const [periodo, setPeriodo] = useState<DateRange>(getMonthRange())
  const [filtros, setFiltros] = useState<ConfigRelatorio['filtros']>({})
  const [formatoExportacao, setFormatoExportacao] = useState<ConfigRelatorio['formato']>('CSV')

  // Tipos de relatório disponíveis
  const tiposRelatorio = [
    {
      tipo: 'RECEITAS' as const,
      nome: 'Receitas',
      descricao: 'Relatório detalhado de todas as receitas',
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      tipo: 'DESPESAS' as const,
      nome: 'Despesas',
      descricao: 'Relatório de despesas por categoria',
      icon: TrendingDown,
      color: 'text-red-600'
    },
    {
      tipo: 'COMISSOES' as const,
      nome: 'Comissões',
      descricao: 'Relatório de comissões por barbeiro',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      tipo: 'DRE' as const,
      nome: 'DRE',
      descricao: 'Demonstrativo de Resultado do Exercício',
      icon: BarChart3,
      color: 'text-purple-600'
    }
  ]

  // Formatos de exportação
  const formatosExportacao = [
    { formato: 'CSV' as const, nome: 'CSV', icon: FileText },
    { formato: 'EXCEL' as const, nome: 'Excel', icon: FileSpreadsheet },
    { formato: 'PDF' as const, nome: 'PDF', icon: FileImage }
  ]

  // Gerar relatório
  const handleGerarRelatorio = async () => {
    const config: ConfigRelatorio = {
      tipo: tipoRelatorio,
      periodo,
      filtros,
      formato: formatoExportacao
    }

    switch (tipoRelatorio) {
      case 'RECEITAS':
        await gerarRelatorioReceitas(config)
        break
      case 'DESPESAS':
        await gerarRelatorioDespesas(config)
        break
      case 'COMISSOES':
        await gerarRelatorioComissoes(config)
        break
      case 'DRE':
        await gerarDRE(periodo)
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
      case 'RECEITAS':
        return relatorioReceitas
      case 'DESPESAS':
        return relatorioDespesas
      case 'COMISSOES':
        return relatorioComissoes
      case 'DRE':
        return dreData ? { dados: [dreData], resumo: dreData } : null
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
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-primary-gold to-primary-gold-dark rounded-2xl shadow-xl">
            <BarChart3 className="h-10 w-10 text-primary-black" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Centro de Relatórios
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
              Gere e exporte relatórios financeiros detalhados
            </p>
          </div>
        </div>
        <div className="w-24 h-1 bg-gradient-to-r from-primary-gold to-primary-gold-dark rounded-full mx-auto mb-6"></div>

        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="border-primary-gold/50 hover:border-primary-gold hover:bg-primary-gold/20 text-primary-gold hover:text-primary-gold-dark font-semibold flex items-center space-x-2 px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={limparRelatorios}
            disabled={isLoading}
            className="border-primary-gold/30 hover:border-primary-gold/50 hover:bg-primary-gold/10 flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Limpar Relatórios</span>
          </Button>
        </div>
      </motion.div>

      {/* Seleção de Tipo de Relatório */}
      <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
        <div className="px-2 py-2 border-b border-gray-200 dark:border-secondary-graphite-card/30 bg-gradient-to-r from-primary-gold/5 to-transparent mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-primary-gold/10 rounded-lg">
              <BarChart3 className="h-6 w-6 text-primary-gold" />
            </div>
            Tipo de Relatório
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiposRelatorio.map((tipo) => {
            const Icon = tipo.icon
            const isSelected = tipoRelatorio === tipo.tipo

            return (
              <motion.div
                key={tipo.tipo}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`p-4 cursor-pointer transition-all duration-200 border border-gray-200 dark:border-secondary-graphite-card/30 hover:border-primary-gold/50 hover:shadow-lg dark:hover:shadow-xl ${isSelected
                    ? 'ring-2 ring-primary-gold bg-primary-gold/5 dark:bg-primary-gold/10 border-primary-gold'
                    : 'bg-white dark:bg-secondary-graphite-light hover:bg-gray-50 dark:hover:bg-secondary-graphite-card/30'
                    }`}
                  onClick={() => setTipoRelatorio(tipo.tipo)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary-gold/20' : 'bg-gray-100 dark:bg-secondary-graphite-card/50'}`}>
                      <Icon className={`h-6 w-6 ${isSelected ? 'text-primary-gold' : tipo.color + ' dark:text-gray-300'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {tipo.nome}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {tipo.descricao}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </Card>

      {/* Configurações do Relatório */}
      <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
        <div className="px-2 py-2 border-b border-gray-200 dark:border-secondary-graphite-card/30 bg-gradient-to-r from-primary-gold/5 to-transparent mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-primary-gold/10 rounded-lg">
              <Filter className="h-6 w-6 text-primary-gold" />
            </div>
            Configurações do Relatório
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Período */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Período
            </label>
            <div className="space-y-2">
              <input
                type="date"
                value={periodo.inicio}
                onChange={(e) => setPeriodo(prev => ({ ...prev, inicio: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-secondary-graphite-card/30 rounded-lg bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-gold focus:border-transparent"
              />
              <input
                type="date"
                value={periodo.fim}
                onChange={(e) => setPeriodo(prev => ({ ...prev, fim: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-secondary-graphite-card/30 rounded-lg bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-gold focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtros */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              <Filter className="h-4 w-4 inline mr-1" />
              Filtros
            </label>
            <div className="space-y-2">
              {tipoRelatorio === 'RECEITAS' && (
                <select
                  value={filtros.barbeiroId || ''}
                  onChange={(e) => setFiltros(prev => ({ ...prev, barbeiroId: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-secondary-graphite-card/30 rounded-lg bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-gold"
                >
                  <option value="">Todos os barbeiros</option>
                  {/* TODO: Carregar lista de barbeiros */}
                </select>
              )}

              {tipoRelatorio === 'DESPESAS' && (
                <select
                  value={filtros.categoriaId || ''}
                  onChange={(e) => setFiltros(prev => ({ ...prev, categoriaId: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-secondary-graphite-card/30 rounded-lg bg-white dark:bg-secondary-graphite-light text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-gold"
                >
                  <option value="">Todas as categorias</option>
                  {/* TODO: Carregar lista de categorias */}
                </select>
              )}

              {(tipoRelatorio === 'COMISSOES' || tipoRelatorio === 'DRE') && (
                <div className="text-sm text-gray-500 dark:text-gray-400 italic py-2">
                  Nenhum filtro adicional disponível
                </div>
              )}
            </div>
          </div>

          {/* Formato de Exportação */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              <Download className="h-4 w-4 inline mr-1" />
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
                    className={`flex items-center space-x-1 ${isSelected
                      ? 'bg-primary-gold hover:bg-primary-gold-dark text-primary-black border-primary-gold'
                      : 'border-primary-gold/30 hover:border-primary-gold/50 hover:bg-primary-gold/10 text-gray-700 dark:text-gray-300'
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
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-secondary-graphite-card/30">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {dadosAtual && (
              <span>
                Relatório gerado com {Array.isArray(dadosAtual.dados) ? dadosAtual.dados.length : 1} registro(s)
              </span>
            )}
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleGerarRelatorio}
              disabled={isLoading}
              className="bg-primary-gold hover:bg-primary-gold-dark text-primary-black font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
            >
              <BarChart3 className="h-5 w-5" />
              <span>{isLoading ? 'Gerando...' : 'Gerar Relatório'}</span>
            </Button>

            {dadosAtual && (
              <Button
                variant="outline"
                onClick={handleExportar}
                disabled={isLoading}
                className="border-primary-gold/30 hover:border-primary-gold/50 hover:bg-primary-gold/10 flex items-center space-x-2"
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
          <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
            <div className="px-2 py-4 border-b border-gray-200 dark:border-secondary-graphite-card/30 bg-gradient-to-r from-primary-gold/5 to-transparent mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-primary-gold/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary-gold" />
                </div>
                Prévia do Relatório - {tiposRelatorio.find(t => t.tipo === tipoRelatorio)?.nome}
              </h2>
            </div>

            {/* Resumo */}
            {dadosAtual.resumo && (
              <div className="mb-6 p-4 bg-gradient-to-r from-primary-gold/5 to-transparent dark:from-primary-gold/10 dark:to-transparent rounded-lg border border-primary-gold/20">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary-gold" />
                  Resumo Executivo
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {Object.entries(dadosAtual.resumo).map(([key, value]) => (
                    <div key={key} className="bg-white dark:bg-secondary-graphite-card/30 p-3 rounded-lg border border-gray-200 dark:border-secondary-graphite-card/50">
                      <span className="text-gray-600 dark:text-gray-400 capitalize text-xs font-medium block mb-1">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                      <div className="font-bold text-gray-900 dark:text-white">
                        {typeof value === 'number' && (key.includes('total') || key.includes('valor'))
                          ? formatCurrency(value)
                          : String(value)
                        }
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
                          className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider"
                        >
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-secondary-graphite-light divide-y divide-gray-200 dark:divide-secondary-graphite-card/30">
                    {dadosAtual.dados.slice(0, 10).map((item: Record<string, unknown>, index: number) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-secondary-graphite-card/30 transition-colors duration-200">
                        {Object.entries(item).map(([key, value]) => (
                          <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {typeof value === 'number' && (key.includes('valor') || key.includes('total'))
                              ? formatCurrency(value)
                              : String(value)
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {dadosAtual.dados.length > 10 && (
                  <div className="text-center py-6 text-sm text-gray-600 dark:text-gray-400 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-secondary-graphite-card dark:to-secondary-graphite-light rounded-lg mt-4 border border-gray-200 dark:border-secondary-graphite-card/50">
                    <strong>Mostrando 10 de {dadosAtual.dados.length} registros.</strong><br />
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
        <Card className="p-8 border-2 border-red-200 dark:border-red-800/30 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 rounded-xl shadow-lg">
          <div className="flex items-center space-x-4 text-red-600 dark:text-red-400">
            <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-xl">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1">Erro ao gerar relatório</h3>
              <p className="text-sm font-medium">{error.message}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Estado Vazio */}
      {!isLoading && !dadosAtual && !isError && (
        <Card className="p-12 text-center bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border border-gray-200 dark:border-secondary-graphite rounded-xl shadow-lg">
          <div className="p-6 bg-primary-gold/10 rounded-2xl w-fit mx-auto mb-6">
            <BarChart3 className="h-16 w-16 text-primary-gold mx-auto" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Nenhum relatório gerado
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 font-medium">
            Selecione o tipo de relatório, configure os filtros e clique em &quot;Gerar Relatório&quot; para visualizar os dados.
          </p>
          <Button
            onClick={handleGerarRelatorio}
            disabled={isLoading}
            className="bg-primary-gold hover:bg-primary-gold-dark text-primary-black font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <BarChart3 className="h-5 w-5 mr-2" />
            Gerar Relatório
          </Button>
        </Card>
      )}
    </div>
  )
}
