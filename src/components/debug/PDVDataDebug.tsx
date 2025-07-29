// Componente de debug para mostrar origem dos dados do PDV
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'
import { usePDVData } from '@/hooks/use-pdv-data'
import { useQuickTransactions } from '@/components/financial/hooks/use-quick-transactions'

export const PDVDataDebug = () => {
  const [isVisible, setIsVisible] = useState(false)
  const { servicos, barbeiros, stats, loading, error } = usePDVData()
  const { historicoRecente, estatisticasDia } = useQuickTransactions()

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-blue-500 text-white hover:bg-blue-600"
        >
          <Eye className="h-4 w-4 mr-2" />
          Debug PDV
        </Button>
      </div>
    )
  }

  const getDataSourceBadge = (hasData: boolean, isLoading: boolean, hasError: boolean) => {
    if (isLoading) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Carregando...</Badge>
    }
    
    if (hasError) {
      return <Badge variant="outline" className="bg-red-100 text-red-800">Erro - Fallback</Badge>
    }
    
    if (hasData) {
      return <Badge variant="outline" className="bg-green-100 text-green-800">Dados Reais</Badge>
    }
    
    return <Badge variant="outline" className="bg-gray-100 text-gray-800">Sem Dados</Badge>
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="p-4 bg-white dark:bg-secondary-graphite shadow-xl border-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Debug PDV - Origem dos Dados
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {/* Serviços */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Serviços</span>
              <span className="text-xs text-gray-500">({servicos.length})</span>
            </div>
            {getDataSourceBadge(servicos.length > 0, loading, !!error)}
          </div>

          {/* Barbeiros */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Barbeiros</span>
              <span className="text-xs text-gray-500">({barbeiros.length})</span>
            </div>
            {getDataSourceBadge(barbeiros.length > 0, loading, !!error)}
          </div>

          {/* Estatísticas */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Stats Hoje</span>
              <span className="text-xs text-gray-500">({stats.transacoesHoje})</span>
            </div>
            {getDataSourceBadge(stats.transacoesHoje > 0, loading, !!error)}
          </div>

          {/* Histórico */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Histórico</span>
              <span className="text-xs text-gray-500">({historicoRecente.length})</span>
            </div>
            {getDataSourceBadge(historicoRecente.length > 0, loading, !!error)}
          </div>

          {/* Última Transação */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Última Transação</span>
            </div>
            {getDataSourceBadge(!!stats.ultimaTransacao, loading, !!error)}
          </div>
        </div>

        {/* Detalhes dos Dados */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div>
              <strong>Valor Total Hoje:</strong> R$ {stats.valorTotalHoje.toFixed(2)}
            </div>
            <div>
              <strong>Transações:</strong> {estatisticasDia.numeroTransacoes}
            </div>
            <div>
              <strong>Método Mais Usado:</strong> {estatisticasDia.metodoPagamentoMaisUsado}
            </div>
            {stats.ultimaTransacao && (
              <div>
                <strong>Última:</strong> {stats.ultimaTransacao.descricao} - R$ {stats.ultimaTransacao.valor.toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* Status Geral */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status Geral:</span>
            {error ? (
              <div className="flex items-center space-x-1 text-red-600">
                <XCircle className="h-4 w-4" />
                <span className="text-xs">Erro</span>
              </div>
            ) : loading ? (
              <div className="flex items-center space-x-1 text-yellow-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-xs">Carregando</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs">OK</span>
              </div>
            )}
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-100 rounded"></div>
              <span>Dados Reais (Supabase)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-100 rounded"></div>
              <span>Dados de Fallback</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-100 rounded"></div>
              <span>Sem Dados</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}