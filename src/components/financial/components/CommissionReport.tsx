// Componente para relatórios de comissão

'use client'

import React, { useState } from 'react'
import { useBarbeiroCommissions } from '../hooks/use-commission'
import { formatCurrency, formatDate } from '../utils'
import { ComissionReport as CommissionReportType } from '../services/commission-service'

interface CommissionReportProps {
  barbeiroId: string
  barbeiroNome?: string
  showControls?: boolean
}

export function CommissionReport({ 
  barbeiroId, 
  barbeiroNome, 
  showControls = true 
}: CommissionReportProps) {
  const { 
    report, 
    loading, 
    error, 
    generateCurrentMonthReport, 
    generateCustomReport,
    clearError 
  } = useBarbeiroCommissions(barbeiroId)

  // Estado para filtros
  const [dateRange, setDateRange] = useState({
    inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fim: new Date().toISOString().split('T')[0]
  })

  // Estado para visualização
  const [viewMode, setViewMode] = useState<'summary' | 'details'>('summary')

  // Gerar relatório personalizado
  const handleCustomReport = async () => {
    await generateCustomReport(dateRange.inicio, dateRange.fim)
  }

  // Exportar relatório (placeholder)
  const handleExport = () => {
    if (!report) return
    
    // TODO: Implementar exportação real
    const data = {
      barbeiro: report.barbeiroNome,
      periodo: report.periodo,
      resumo: {
        totalComissoes: report.totalComissoes,
        totalServicos: report.totalServicos,
        ticketMedio: report.ticketMedio
      },
      detalhes: report.detalhes
    }
    
    console.log('Exportando relatório:', data)
    alert('Funcionalidade de exportação será implementada em breve!')
  }

  return (
    <div className="bg-white dark:bg-background-dark-elevated rounded-lg shadow-md p-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Relatório de Comissões
          </h2>
          {barbeiroNome && (
            <p className="text-sm text-gray-600 mt-1">
              Barbeiro: {barbeiroNome}
            </p>
          )}
        </div>
        
        {showControls && (
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'summary' ? 'details' : 'summary')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {viewMode === 'summary' ? 'Ver Detalhes' : 'Ver Resumo'}
            </button>
            
            {report && (
              <button
                onClick={handleExport}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Exportar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Controles de filtro */}
      {showControls && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={dateRange.inicio}
                onChange={(e) => setDateRange(prev => ({ ...prev, inicio: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={dateRange.fim}
                onChange={(e) => setDateRange(prev => ({ ...prev, fim: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={generateCurrentMonthReport}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Mês Atual
              </button>
              
              <button
                onClick={handleCustomReport}
                disabled={loading}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                Gerar Relatório
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="text-red-800">
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Gerando relatório...</p>
        </div>
      )}

      {/* Conteúdo do relatório */}
      {!loading && report && (
        <div className="space-y-6">
          {/* Resumo executivo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-blue-600 text-sm font-medium">Total de Comissões</div>
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(report.totalComissoes)}
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-green-600 text-sm font-medium">Total de Serviços</div>
              <div className="text-2xl font-bold text-green-900">
                {report.totalServicos}
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-purple-600 text-sm font-medium">Ticket Médio</div>
              <div className="text-2xl font-bold text-purple-900">
                {formatCurrency(report.ticketMedio)}
              </div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-orange-600 text-sm font-medium">Comissões Pagas</div>
              <div className="text-2xl font-bold text-orange-900">
                {report.comissoesPagas}
              </div>
              <div className="text-xs text-orange-600">
                {report.comissoesPendentes} pendentes
              </div>
            </div>
          </div>

          {/* Informações do período */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Período do Relatório</h3>
            <p className="text-sm text-gray-600">
              De {formatDate(report.periodo.inicio)} até {formatDate(report.periodo.fim)}
            </p>
          </div>

          {/* Detalhes das comissões */}
          {viewMode === 'details' && report.detalhes.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Detalhes das Comissões
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Agendamento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Serviço
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentual
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Comissão
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-background-dark-elevated divide-y divide-gray-200 dark:divide-secondary-graphite-card/30">
                    {report.detalhes.map((detalhe, index) => (
                      <tr key={`${detalhe.agendamentoId}-${index}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {detalhe.agendamentoId.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(detalhe.valorServico)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {detalhe.percentualComissao}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatCurrency(detalhe.valorComissao)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              detalhe.status === 'PAGA'
                                ? 'bg-green-100 text-green-800'
                                : detalhe.status === 'CALCULADA'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {detalhe.status === 'PAGA' ? 'Paga' : 
                             detalhe.status === 'CALCULADA' ? 'Calculada' : 'Cancelada'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Gráfico de evolução (placeholder) */}
          {viewMode === 'summary' && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Evolução das Comissões
              </h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <p>Gráfico de evolução será implementado em breve</p>
                  <p className="text-sm mt-1">
                    Mostrará a evolução das comissões ao longo do tempo
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Estado vazio */}
      {!loading && !report && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum relatório gerado
          </h3>
          <p className="text-gray-600 mb-4">
            Selecione um período e clique em &quot;Gerar Relatório&quot; para visualizar as comissões.
          </p>
          {showControls && (
            <button
              onClick={generateCurrentMonthReport}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Gerar Relatório do Mês Atual
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Componente para comparação de períodos
interface CommissionComparisonProps {
  barbeiroId: string
  currentPeriod: { inicio: string; fim: string }
  previousPeriod: { inicio: string; fim: string }
}

export function CommissionComparison({ 
  barbeiroId, 
  currentPeriod, 
  previousPeriod 
}: CommissionComparisonProps) {
  const [currentReport, setCurrentReport] = useState<CommissionReportType | null>(null)
  const [previousReport, setPreviousReport] = useState<CommissionReportType | null>(null)
  const [loading, setLoading] = useState(false)

  // TODO: Implementar lógica de comparação
  // Por enquanto, apenas placeholder

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Comparação de Períodos
      </h2>
      
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-2">📈</div>
        <p>Comparação de períodos será implementada em breve</p>
        <p className="text-sm mt-1">
          Permitirá comparar comissões entre diferentes períodos
        </p>
      </div>
    </div>
  )
}

// Componente para ranking de barbeiros (para administradores)
export function CommissionRanking() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Ranking de Comissões
      </h2>
      
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-2">🏆</div>
        <p>Ranking de barbeiros será implementado em breve</p>
        <p className="text-sm mt-1">
          Mostrará o ranking dos barbeiros por comissões ganhas
        </p>
      </div>
    </div>
  )
}
