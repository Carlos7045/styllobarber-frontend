// Centro de relatórios financeiros
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Download, 
  Filter, 
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  BarChart3,
  PieChart,
  FileSpreadsheet,
  FileImage,
  ArrowLeft
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useReports } from '../hooks/use-reports'
import { getMonthRange, formatCurrency, formatDate } from '../utils'
import type { ConfigRelatorio, DateRange } from '../types'

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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Centro de Relatórios
            </h1>
            <p className="text-gray-600 mt-1">
              Gere e exporte relatórios financeiros detalhados
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={limparRelatorios}
          disabled={isLoading}
        >
          Limpar Relatórios
        </Button>
      </motion.div>

      {/* Seleção de Tipo de Relatório */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Tipo de Relatório
        </h2>
        
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
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setTipoRelatorio(tipo.tipo)}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-8 w-8 ${tipo.color}`} />
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {tipo.nome}
                      </h3>
                      <p className="text-sm text-gray-600">
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
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Configurações
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Período */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Período
            </label>
            <div className="space-y-2">
              <input
                type="date"
                value={periodo.inicio}
                onChange={(e) => setPeriodo(prev => ({ ...prev, inicio: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={periodo.fim}
                onChange={(e) => setPeriodo(prev => ({ ...prev, fim: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filtros */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="h-4 w-4 inline mr-1" />
              Filtros
            </label>
            <div className="space-y-2">
              {tipoRelatorio === 'RECEITAS' && (
                <select
                  value={filtros.barbeiroId || ''}
                  onChange={(e) => setFiltros(prev => ({ ...prev, barbeiroId: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os barbeiros</option>
                  {/* TODO: Carregar lista de barbeiros */}
                </select>
              )}
              
              {tipoRelatorio === 'DESPESAS' && (
                <select
                  value={filtros.categoriaId || ''}
                  onChange={(e) => setFiltros(prev => ({ ...prev, categoriaId: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas as categorias</option>
                  {/* TODO: Carregar lista de categorias */}
                </select>
              )}
            </div>
          </div>

          {/* Formato de Exportação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Download className="h-4 w-4 inline mr-1" />
              Formato
            </label>
            <div className="flex space-x-2">
              {formatosExportacao.map((formato) => {
                const Icon = formato.icon
                const isSelected = formatoExportacao === formato.formato
                
                return (
                  <Button
                    key={formato.formato}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormatoExportacao(formato.formato)}
                    className="flex items-center space-x-1"
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
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
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
              className="flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>{isLoading ? 'Gerando...' : 'Gerar Relatório'}</span>
            </Button>
            
            {dadosAtual && (
              <Button
                variant="outline"
                onClick={handleExportar}
                disabled={isLoading}
                className="flex items-center space-x-2"
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
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Prévia do Relatório - {tiposRelatorio.find(t => t.tipo === tipoRelatorio)?.nome}
            </h2>
            
            {/* Resumo */}
            {dadosAtual.resumo && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Resumo</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {Object.entries(dadosAtual.resumo).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                      </span>
                      <div className="font-medium">
                        {typeof value === 'number' && key.includes('total') || key.includes('valor') 
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
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(dadosAtual.dados[0]).map((key) => (
                        <th
                          key={key}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dadosAtual.dados.slice(0, 10).map((item: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {Object.entries(item).map(([key, value]) => (
                          <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                  <div className="text-center py-4 text-sm text-gray-600">
                    Mostrando 10 de {dadosAtual.dados.length} registros. 
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
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center space-x-3 text-red-600">
            <FileText className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Erro ao gerar relatório</h3>
              <p className="text-sm mt-1">{error.message}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}