// Hook para gerenciar transações rápidas do PDV
'use client'

import { useState, useEffect, useCallback } from 'react'
import { QuickTransactionService, QuickTransactionData, TransactionResponse } from '../services/quick-transaction-service'

interface UseQuickTransactionsOptions {
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseQuickTransactionsReturn {
  // Estado
  historicoRecente: any[]
  estatisticasDia: {
    totalEntradas: number
    totalSaidas: number
    numeroTransacoes: number
    metodoPagamentoMaisUsado: string
  }
  
  // Status
  loading: boolean
  saving: boolean
  error: string | null
  lastUpdate: Date | null
  
  // Ações
  registrarTransacao: (data: QuickTransactionData) => Promise<TransactionResponse>
  cancelarTransacao: (id: string) => Promise<TransactionResponse>
  refresh: () => Promise<void>
  validarTransacao: (data: QuickTransactionData) => { valid: boolean; errors: string[] }
}

export const useQuickTransactions = (options: UseQuickTransactionsOptions = {}): UseQuickTransactionsReturn => {
  const {
    autoRefresh = true,
    refreshInterval = 10000 // 10 segundos
  } = options

  // Estado
  const [historicoRecente, setHistoricoRecente] = useState<any[]>([])
  const [estatisticasDia, setEstatisticasDia] = useState({
    totalEntradas: 0,
    totalSaidas: 0,
    numeroTransacoes: 0,
    metodoPagamentoMaisUsado: 'DINHEIRO'
  })
  
  // Status
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Carregar histórico recente
  const carregarHistorico = useCallback(async () => {
    try {
      setError(null)
      const historico = await QuickTransactionService.obterHistoricoRecente(20)
      setHistoricoRecente(historico)
    } catch (err) {
      console.error('Erro ao carregar histórico:', err)
      // Em caso de erro, usar dados mockados
      setHistoricoRecente([])
      // Não definir erro para não quebrar a interface
    }
  }, [])

  // Carregar estatísticas do dia
  const carregarEstatisticas = useCallback(async () => {
    try {
      setError(null)
      const stats = await QuickTransactionService.obterEstatisticasDia()
      setEstatisticasDia(stats)
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err)
      // Em caso de erro, usar estatísticas padrão
      setEstatisticasDia({
        totalEntradas: 0,
        totalSaidas: 0,
        numeroTransacoes: 0,
        metodoPagamentoMaisUsado: 'DINHEIRO'
      })
    }
  }, [])

  // Registrar nova transação
  const registrarTransacao = useCallback(async (data: QuickTransactionData): Promise<TransactionResponse> => {
    setSaving(true)
    setError(null)
    
    try {
      // Validar dados antes de enviar
      const validation = QuickTransactionService.validarTransacao(data)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        }
      }

      const response = await QuickTransactionService.registrarTransacao(data)
      
      if (response.success) {
        // Atualizar dados locais
        await Promise.all([
          carregarHistorico(),
          carregarEstatisticas()
        ])
        setLastUpdate(new Date())
      }
      
      return response
      
    } catch (err) {
      const errorMessage = 'Erro ao registrar transação'
      setError(errorMessage)
      console.error('Erro ao registrar transação:', err)
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setSaving(false)
    }
  }, [carregarHistorico, carregarEstatisticas])

  // Cancelar transação
  const cancelarTransacao = useCallback(async (id: string): Promise<TransactionResponse> => {
    setSaving(true)
    setError(null)
    
    try {
      const response = await QuickTransactionService.cancelarTransacao(id)
      
      if (response.success) {
        // Atualizar dados locais
        await Promise.all([
          carregarHistorico(),
          carregarEstatisticas()
        ])
        setLastUpdate(new Date())
      }
      
      return response
      
    } catch (err) {
      const errorMessage = 'Erro ao cancelar transação'
      setError(errorMessage)
      console.error('Erro ao cancelar transação:', err)
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setSaving(false)
    }
  }, [carregarHistorico, carregarEstatisticas])

  // Validar transação
  const validarTransacao = useCallback((data: QuickTransactionData) => {
    return QuickTransactionService.validarTransacao(data)
  }, [])

  // Função de refresh completo
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([
        carregarHistorico(),
        carregarEstatisticas()
      ])
      setLastUpdate(new Date())
    } catch (err) {
      setError('Erro ao atualizar dados')
      console.error('Erro no refresh:', err)
    } finally {
      setLoading(false)
    }
  }, [carregarHistorico, carregarEstatisticas])

  // Carregar dados iniciais
  useEffect(() => {
    refresh()
  }, [refresh])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      // Só atualiza se não estiver salvando
      if (!saving) {
        carregarEstatisticas()
      }
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, saving, carregarEstatisticas])

  return {
    // Estado
    historicoRecente,
    estatisticasDia,
    
    // Status
    loading,
    saving,
    error,
    lastUpdate,
    
    // Ações
    registrarTransacao,
    cancelarTransacao,
    refresh,
    validarTransacao
  }
}

// Hook específico para estatísticas em tempo real
export const useRealtimeStats = () => {
  const [stats, setStats] = useState({
    transacoesHoje: 0,
    valorTotalHoje: 0,
    ultimaTransacao: null as any,
    tendenciaHoraria: [] as Array<{ hora: number; valor: number }>
  })

  const [loading, setLoading] = useState(true)

  const atualizarStats = useCallback(async () => {
    try {
      // Implementar lógica para estatísticas em tempo real
      // Por enquanto, usar dados mockados
      setStats({
        transacoesHoje: 15,
        valorTotalHoje: 1250.00,
        ultimaTransacao: {
          tipo: 'ENTRADA',
          valor: 45.00,
          descricao: 'Corte + Barba',
          tempo: new Date()
        },
        tendenciaHoraria: [
          { hora: 9, valor: 150 },
          { hora: 10, valor: 280 },
          { hora: 11, valor: 320 },
          { hora: 12, valor: 180 },
          { hora: 13, valor: 90 },
          { hora: 14, valor: 230 }
        ]
      })
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    atualizarStats()
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(atualizarStats, 30000)
    
    return () => clearInterval(interval)
  }, [atualizarStats])

  return { stats, loading, refresh: atualizarStats }
}

// Hook para notificações de transações
export const useTransactionNotifications = () => {
  const [notifications, setNotifications] = useState<Array<{
    id: string
    tipo: 'success' | 'error' | 'info'
    titulo: string
    mensagem: string
    timestamp: Date
    lida: boolean
  }>>([])

  const adicionarNotificacao = useCallback((notification: Omit<typeof notifications[0], 'id' | 'timestamp' | 'lida'>) => {
    const novaNotificacao = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      lida: false
    }
    
    setNotifications(prev => [novaNotificacao, ...prev.slice(0, 9)]) // Manter apenas 10 notificações
    
    // Auto-remover após 5 segundos se for sucesso
    if (notification.tipo === 'success') {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== novaNotificacao.id))
      }, 5000)
    }
  }, [])

  const marcarComoLida = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, lida: true } : n
    ))
  }, [])

  const removerNotificacao = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const limparTodas = useCallback(() => {
    setNotifications([])
  }, [])

  const notificacaosPendentes = notifications.filter(n => !n.lida)

  return {
    notifications,
    notificacaosPendentes,
    adicionarNotificacao,
    marcarComoLida,
    removerNotificacao,
    limparTodas
  }
}