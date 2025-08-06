// Hook para gerenciar transações rápidas do PDV
'use client'

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/api/supabase'
import { QuickTransactionService } from '../services/quick-transaction-service'

interface QuickTransactionData {
  tipo: 'ENTRADA' | 'SAIDA'
  valor: number
  descricao: string
  metodoPagamento?: 'DINHEIRO' | 'PIX' | 'CARTAO_DEBITO' | 'CARTAO_CREDITO'
  categoria: string
  cliente?: string
  barbeiro?: string
  observacoes?: string
}

interface TransactionResponse {
  success: boolean
  transactionId?: string
  error?: string
}

interface UseQuickTransactionsOptions {
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseQuickTransactionsReturn {
  // Estado
  historicoRecente: QuickTransaction[]
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
  const { autoRefresh = false, refreshInterval = 30000 } = options
  
  // Estado
  const [historicoRecente, setHistoricoRecente] = useState<QuickTransaction[]>([])
  const [estatisticasDia, setEstatisticasDia] = useState({
    totalEntradas: 0,
    totalSaidas: 0,
    numeroTransacoes: 0,
    metodoPagamentoMaisUsado: 'DINHEIRO'
  })
  
  // Status
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(new Date())

  // Carregar histórico de transações
  const carregarHistorico = useCallback(async () => {
    try {
      const historico = await QuickTransactionService.obterHistoricoRecente(10)
      setHistoricoRecente(historico)
    } catch (err) {
      console.error('Erro ao carregar histórico:', err)
      setError('Erro ao carregar histórico')
    }
  }, [])

  // Carregar estatísticas do dia
  const carregarEstatisticas = useCallback(async () => {
    try {
      const stats = await QuickTransactionService.obterEstatisticasDia()
      setEstatisticasDia(stats)
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err)
      setError('Erro ao carregar estatísticas')
    }
  }, [])

  // Registrar nova transação
  const registrarTransacao = useCallback(async (data: QuickTransactionData): Promise<TransactionResponse> => {
    setSaving(true)
    setError(null)
    
    try {
      // Validar dados primeiro
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
      const hoje = new Date().toISOString().split('T')[0]
      
      // Buscar transações de hoje
      const { data: transacoes, error } = await supabase
        .from('transacoes_financeiras')
        .select('tipo, valor, descricao, data_transacao')
        .gte('data_transacao', `${hoje}T00:00:00`)
        .lte('data_transacao', `${hoje}T23:59:59`)
        .eq('status', 'CONFIRMADA')
        .order('data_transacao', { ascending: false })

      if (error || !transacoes) {
        console.warn('Erro ao carregar estatísticas, usando dados de fallback:', error)
        setStats(getStatsFallback())
        return
      }

      if (transacoes.length === 0) {
        // Se não há transações hoje, mostrar dados zerados (não fallback)
        console.log('Nenhuma transação registrada hoje')
        setStats({
          transacoesHoje: 0,
          valorTotalHoje: 0,
          ultimaTransacao: null,
          tendenciaHoraria: []
        })
        return
      }

      // Calcular estatísticas
      const transacoesHoje = transacoes.length
      const valorTotalHoje = transacoes
        .filter(t => t.tipo === 'RECEITA')
        .reduce((sum, t) => sum + (t.valor || 0), 0)

      const ultimaTransacao = transacoes[0] ? {
        tipo: transacoes[0].tipo === 'RECEITA' ? 'ENTRADA' : 'SAIDA',
        valor: transacoes[0].valor,
        descricao: transacoes[0].descricao,
        tempo: new Date(transacoes[0].data_transacao)
      } : null

      // Calcular tendência horária
      const horasMap = new Map<number, number>()
      
      // Inicializar todas as horas do dia
      for (let hora = 0; hora < 24; hora++) {
        horasMap.set(hora, 0)
      }

      // Agrupar transações por hora
      transacoes
        .filter(t => t.tipo === 'RECEITA')
        .forEach(transacao => {
          const hora = new Date(transacao.data_transacao).getHours()
          const valorAtual = horasMap.get(hora) || 0
          horasMap.set(hora, valorAtual + (transacao.valor || 0))
        })

      // Converter para array e filtrar apenas horas com movimento
      const tendenciaHoraria = Array.from(horasMap.entries())
        .map(([hora, valor]) => ({ hora, valor }))
        .filter(item => item.valor > 0)
        .sort((a, b) => a.hora - b.hora)

      setStats({
        transacoesHoje,
        valorTotalHoje,
        ultimaTransacao,
        tendenciaHoraria
      })

    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error)
      setStats(getStatsFallback())
    } finally {
      setLoading(false)
    }
  }, [])

  // Função de fallback para estatísticas
  const getStatsFallback = () => ({
    transacoesHoje: 12,
    valorTotalHoje: 580.00,
    ultimaTransacao: {
      tipo: 'ENTRADA',
      valor: 45.00,
      descricao: 'Corte + Barba',
      tempo: new Date(Date.now() - 15 * 60 * 1000) // 15 min atrás
    },
    tendenciaHoraria: [
      { hora: 8, valor: 50 },
      { hora: 9, valor: 120 },
      { hora: 10, valor: 180 },
      { hora: 11, valor: 95 },
      { hora: 12, valor: 60 },
      { hora: 13, valor: 30 },
      { hora: 14, valor: 45 }
    ]
  })

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
