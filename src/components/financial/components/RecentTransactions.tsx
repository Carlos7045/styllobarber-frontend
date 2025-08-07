
'use client'

// Mock temporário para motion
const motion = {
  div: 'div' as any,
  span: 'span' as any,
  button: 'button' as any,
}
// Componente para exibir histórico de transações recentes

import { useState } from 'react'

import { Clock, DollarSign, TrendingUp, TrendingDown, User, CreditCard, Smartphone, MoreVertical, X, AlertTriangle } from 'lucide-react'
import { Card } from '@/shared/components/ui'
import { Button } from '@/shared/components/ui'
import { Badge } from '@/shared/components/ui'
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
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'CARTAO_DEBITO':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
      case 'CARTAO_CREDITO':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      case 'DINHEIRO':
      default:
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:shadow-lg hover:border-primary-gold transition-all duration-300 bg-gradient-to-br from-white to-gray-100 dark:from-secondary-graphite dark:to-secondary-graphite-card shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className={`p-2.5 rounded-lg shadow-md ${
            isEntrada 
              ? 'bg-gradient-to-br from-green-500 to-green-600 text-white' 
              : 'bg-gradient-to-br from-red-500 to-red-600 text-white'
          }`}>
            {isEntrada ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Linha 1: Serviço + Cliente */}
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                {transacao.descricao}
              </h4>
              {(transacao.cliente_nome || transacao.cliente) && (
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full shrink-0">
                  {transacao.cliente_nome || transacao.cliente}
                </span>
              )}
            </div>
            
            {/* Linha 2: Data + Funcionário + Método */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>
                  {formatDate(transacao.data_transacao)} às{' '}
                  {new Date(transacao.data_transacao).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </span>
              
              {transacao.funcionarios && (
                <span className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>{transacao.funcionarios.nome}</span>
                </span>
              )}
              
              {transacao.metodo_pagamento && isEntrada && (
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                  getPaymentColor(transacao.metodo_pagamento)
                }`}>
                  {getPaymentIcon(transacao.metodo_pagamento)}
                  <span>{transacao.metodo_pagamento.replace('_', ' ')}</span>
                </div>
              )}
              
              {transacao.categorias_financeiras && !isEntrada && (
                <Badge 
                  variant="outline" 
                  className="text-xs px-2 py-1"
                  style={{ 
                    borderColor: transacao.categorias_financeiras.cor,
                    color: transacao.categorias_financeiras.cor 
                  }}
                >
                  {transacao.categorias_financeiras.nome}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 shrink-0 ml-3">
          <div className="text-right min-w-[100px]">
            <p className={`text-xl font-bold leading-tight ${
              isEntrada ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {isEntrada ? '+' : '-'}{formatCurrency(transacao.valor)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mt-1">
              {transacao.status || 'CONFIRMADA'}
            </p>
          </div>
          
          {onCancel && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowActions(!showActions)}
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-secondary-graphite-card/50"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              
              {showActions && (
                <div className="absolute right-0 top-8 bg-white dark:bg-secondary-graphite-light border border-gray-200 dark:border-secondary-graphite-card/30 rounded-lg shadow-lg z-10 min-w-32">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onCancel(transacao.id)
                      setShowActions(false)
                    }}
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
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
        <div className="mt-3 p-2 bg-gray-50 dark:bg-secondary-graphite-card rounded text-sm text-gray-600 dark:text-gray-300">
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
            <p className="text-gray-600 dark:text-gray-300">Carregando transações...</p>
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
      <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite border-l-4 border-l-primary-gold p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-gold/10 rounded-lg">
              <Receipt className="h-6 w-6 text-primary-gold" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Transações Recentes
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            className="border-primary-gold/30 hover:border-primary-gold/50 hover:bg-primary-gold/10 flex items-center space-x-2"
          >
            <Clock className="h-4 w-4" />
            <span>Atualizar</span>
          </Button>
        </div>
        
        {/* Estatísticas do Dia */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800/40 dark:to-green-900/40 rounded-xl border-2 border-green-300 dark:border-green-700 min-h-[140px] shadow-md">
            <p className="text-sm text-green-700 dark:text-green-300 font-semibold mb-4 text-center">Entradas Hoje</p>
            <p className="text-xl font-bold text-green-800 dark:text-green-200 text-center break-words">
              {formatCurrency(estatisticasDia.totalEntradas)}
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-800/40 dark:to-red-900/40 rounded-xl border-2 border-red-300 dark:border-red-700 min-h-[140px] shadow-md">
            <p className="text-sm text-red-700 dark:text-red-300 font-semibold mb-4 text-center">Saídas Hoje</p>
            <p className="text-xl font-bold text-red-800 dark:text-red-200 text-center break-words">
              {formatCurrency(estatisticasDia.totalSaidas)}
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800/40 dark:to-blue-900/40 rounded-xl border-2 border-blue-300 dark:border-blue-700 min-h-[140px] shadow-md">
            <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold mb-4 text-center">Transações</p>
            <p className="text-2xl font-bold text-blue-800 dark:text-blue-200 text-center">
              {estatisticasDia.numeroTransacoes}
            </p>
          </div>
        </div>
      </Card>

      {/* Lista de Transações */}
      <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite p-6 shadow-lg border-2 border-gray-200 dark:border-secondary-graphite-card/30">
        <div className="space-y-4">
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
              <Receipt className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Nenhuma transação encontrada</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                As transações registradas aparecerão aqui
              </p>
            </div>
          )}
        </div>
        
        {historicoRecente.length > limit && (
          <div className="text-center pt-4 border-t border-gray-200 dark:border-secondary-graphite-card/30 mt-4">
            <Button variant="outline" size="sm">
              Ver todas as transações ({historicoRecente.length})
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
