// Componente para exibir histórico de transações recentes
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  User,
  CreditCard,
  Smartphone,
  Receipt,
  MoreVertical,
  X,
  AlertTriangle
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '../utils'
import { useQuickTransactions } from '../hooks/use-quick-transactions'

interface RecentTransactionsProps {
  className?: string
  limit?: number
}

// Componente de Item de Transação
const TransactionItem = ({ 
  transacao, 
  onCancel 
}: { 
  transacao: any
  onCancel?: (id: string) => void 
}) => {
  const [showActions, setShowActions] = useState(false)
  const isEntrada = transacao.tipo === 'RECEITA'
  
  const getPaymentIcon = (metodo: string) => {
    switch (metodo) {
      case 'PIX':
        return <Smartphone className="h-4 w-4" />
      case 'CARTAO_DEBITO':
      case 'CARTAO_CREDITO':
        return <CreditCard className="h-4 w-4" />
      case 'DINHEIRO':
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  const getPaymentColor = (metodo: string) => {
    switch (metodo) {
      case 'PIX':
        return 'bg-blue-100 text-blue-700'
      case 'CARTAO_DEBITO':
        return 'bg-purple-100 text-purple-700'
      case 'CARTAO_CREDITO':
        return 'bg-orange-100 text-orange-700'
      case 'DINHEIRO':
      default:
        return 'bg-green-100 text-green-700'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${
            isEntrada ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            {isEntrada ? (
              <TrendingUp className="h-5 w-5" />
            ) : (
              <TrendingDown className="h-5 w-5" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-gray-900">
                {transacao.descricao}
              </h4>
              {transacao.categorias_financeiras && (
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{ 
                    borderColor: transacao.categorias_financeiras.cor,
                    color: transacao.categorias_financeiras.cor 
                  }}
                >
                  {transacao.categorias_financeiras.nome}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-3 mt-1">
              <span className="text-sm text-gray-500">
                {formatDate(transacao.data_transacao)} às{' '}
                {new Date(transacao.data_transacao).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              
              {transacao.funcionarios && (
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {transacao.funcionarios.nome}
                  </span>
                </div>
              )}
              
              {transacao.metodo_pagamento && isEntrada && (
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                  getPaymentColor(transacao.metodo_pagamento)
                }`}>
                  {getPaymentIcon(transacao.metodo_pagamento)}
                  <span>{transacao.metodo_pagamento.replace('_', ' ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className={`text-lg font-bold ${
              isEntrada ? 'text-green-600' : 'text-red-600'
            }`}>
              {isEntrada ? '+' : '-'}{formatCurrency(transacao.valor)}
            </p>
            <p className="text-xs text-gray-500">
              {transacao.status}
            </p>
          </div>
          
          {onCancel && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowActions(!showActions)}
                className="h-8 w-8 p-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              
              {showActions && (
                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onCancel(transacao.id)
                      setShowActions(false)
                    }}
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {transacao.observacoes && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
          <strong>Obs:</strong> {transacao.observacoes}
        </div>
      )}
    </motion.div>
  )
}

export const RecentTransactions = ({ 
  className = '', 
  limit = 10 
}: RecentTransactionsProps) => {
  const { 
    historicoRecente, 
    estatisticasDia, 
    loading, 
    error, 
    cancelarTransacao,
    refresh 
  } = useQuickTransactions()

  const handleCancelTransaction = async (id: string) => {
    if (confirm('Tem certeza que deseja cancelar esta transação?')) {
      const result = await cancelarTransacao(id)
      if (result.success) {
        alert('Transação cancelada com sucesso!')
        refresh()
      } else {
        alert(`Erro ao cancelar transação: ${result.error}`)
      }
    }
  }

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-600">Carregando transações...</p>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 font-medium">Erro ao carregar transações</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              className="mt-3"
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  const transacoesLimitadas = historicoRecente.slice(0, limit)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header com Estatísticas */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Transações Recentes
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            className="flex items-center space-x-2"
          >
            <Clock className="h-4 w-4" />
            <span>Atualizar</span>
          </Button>
        </div>
        
        {/* Estatísticas do Dia */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Entradas Hoje</p>
            <p className="text-xl font-bold text-green-700">
              {formatCurrency(estatisticasDia.totalEntradas)}
            </p>
          </div>
          
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600 font-medium">Saídas Hoje</p>
            <p className="text-xl font-bold text-red-700">
              {formatCurrency(estatisticasDia.totalSaidas)}
            </p>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Transações</p>
            <p className="text-xl font-bold text-blue-700">
              {estatisticasDia.numeroTransacoes}
            </p>
          </div>
        </div>
      </Card>

      {/* Lista de Transações */}
      <Card className="p-6">
        <div className="space-y-3">
          {transacoesLimitadas.length > 0 ? (
            transacoesLimitadas.map((transacao) => (
              <TransactionItem
                key={transacao.id}
                transacao={transacao}
                onCancel={handleCancelTransaction}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma transação encontrada</p>
              <p className="text-sm text-gray-400 mt-1">
                As transações registradas aparecerão aqui
              </p>
            </div>
          )}
        </div>
        
        {historicoRecente.length > limit && (
          <div className="text-center pt-4 border-t border-gray-200 mt-4">
            <Button variant="outline" size="sm">
              Ver todas as transações ({historicoRecente.length})
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}