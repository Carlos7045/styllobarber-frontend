// Hook personalizado para gerenciamento de fluxo de caixa
'use client'

import { useState, useEffect, useCallback } from 'react'
import { CashFlowService } from '../services/cash-flow-service'
import type { 
  MovimentacaoFluxoCaixa, 
  FluxoCaixaResumo,
  DateRange 
} from '../types'

interface UseCashFlowOptions {
  autoRefresh?: boolean
  refreshInterval?: number // em milissegundos
  incluirProjecoes?: boolean
}

interface UseCashFlowReturn {
  // Estado
  resumo: FluxoCaixaResumo | null
  movimentacoes: MovimentacaoFluxoCaixa[]
  projecoes: Array<{
    data: string
    entradasProjetadas: number
    saidasProjetadas: number
    saldoProjetado: number
  }>
  
  // Status
  loading: boolean
  error: string | null
  lastUpdate: Date | null
  
  // Alertas
  alertaSaldoBaixo: boolean
  
  // Ações
  refresh: () => Promise<void>
  obterMovimentacoes: (periodo: DateRange, categoria?: string) => Promise<void>
  calcularProjecoes: (dias?: number) => Promise<void>
  configurarAlerta: (limite: number) => Promise<boolean>
}

export const useCashFlow = (options: UseCashFlowOptions = {}): UseCashFlowReturn => {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 segundos
    incluirProjecoes = true
  } = options

  // Estado
  const [resumo, setResumo] = useState<FluxoCaixaResumo | null>(null)
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoFluxoCaixa[]>([])
  const [projecoes, setProjecoes] = useState<Array<{
    data: string
    entradasProjetadas: number
    saidasProjetadas: number
    saldoProjetado: number
  }>>([])
  
  // Status
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [alertaSaldoBaixo, setAlertaSaldoBaixo] = useState(false)

  // Carregar resumo do fluxo de caixa
  const carregarResumo = useCallback(async () => {
    try {
      setError(null)
      const resumoData = await CashFlowService.obterResumoFluxoCaixa()
      setResumo(resumoData)
      
      // Verificar alerta de saldo baixo
      const alerta = await CashFlowService.verificarAlertaSaldoBaixo()
      setAlertaSaldoBaixo(alerta.alertaAtivo)
      
      setLastUpdate(new Date())
    } catch (err) {
      setError('Erro ao carregar resumo do fluxo de caixa')
      console.error('Erro ao carregar resumo:', err)
    }
  }, [])

  // Carregar movimentações
  const obterMovimentacoes = useCallback(async (
    periodo: DateRange, 
    categoria?: string
  ) => {
    try {
      setError(null)
      const movimentacoesData = await CashFlowService.obterMovimentacoes(
        periodo, 
        categoria, 
        incluirProjecoes
      )
      setMovimentacoes(movimentacoesData)
    } catch (err) {
      setError('Erro ao carregar movimentações')
      console.error('Erro ao carregar movimentações:', err)
    }
  }, [incluirProjecoes])

  // Calcular projeções
  const calcularProjecoes = useCallback(async (dias = 30) => {
    try {
      setError(null)
      const projecoesData = await CashFlowService.calcularProjecoes(dias)
      setProjecoes(projecoesData.projecoesDiarias)
    } catch (err) {
      setError('Erro ao calcular projeções')
      console.error('Erro ao calcular projeções:', err)
    }
  }, [])

  // Configurar alerta de saldo baixo
  const configurarAlerta = useCallback(async (limite: number): Promise<boolean> => {
    try {
      setError(null)
      const sucesso = await CashFlowService.configurarAlertaSaldoBaixo(limite)
      
      if (sucesso) {
        // Atualizar resumo para refletir o novo limite
        await carregarResumo()
      }
      
      return sucesso
    } catch (err) {
      setError('Erro ao configurar alerta')
      console.error('Erro ao configurar alerta:', err)
      return false
    }
  }, [carregarResumo])

  // Função de refresh completo
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([
        carregarResumo(),
        obterMovimentacoes({
          inicio: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias atrás
          fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias à frente
        }),
        calcularProjecoes(30)
      ])
    } catch (err) {
      setError('Erro ao atualizar dados')
      console.error('Erro no refresh:', err)
    } finally {
      setLoading(false)
    }
  }, [carregarResumo, obterMovimentacoes, calcularProjecoes])

  // Carregar dados iniciais
  useEffect(() => {
    refresh()
  }, [refresh])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      carregarResumo() // Só atualiza o resumo no auto-refresh
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, carregarResumo])

  // Monitorar mudanças no saldo para alertas
  useEffect(() => {
    if (resumo && resumo.saldoAtual < resumo.limiteMinimoAlerta) {
      setAlertaSaldoBaixo(true)
      
      // Opcional: Disparar notificação do sistema
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('StylloBarber - Saldo Baixo', {
          body: `Saldo atual (R$ ${resumo.saldoAtual.toFixed(2)}) está abaixo do limite mínimo`,
          icon: '/favicon.ico'
        })
      }
    } else {
      setAlertaSaldoBaixo(false)
    }
  }, [resumo])

  return {
    // Estado
    resumo,
    movimentacoes,
    projecoes,
    
    // Status
    loading,
    error,
    lastUpdate,
    
    // Alertas
    alertaSaldoBaixo,
    
    // Ações
    refresh,
    obterMovimentacoes,
    calcularProjecoes,
    configurarAlerta
  }
}

// Hook específico para alertas de fluxo de caixa
export const useCashFlowAlerts = () => {
  const [alertas, setAlertas] = useState<Array<{
    id: string
    tipo: 'SALDO_BAIXO' | 'PROJECAO_NEGATIVA' | 'META_ATINGIDA'
    titulo: string
    mensagem: string
    data: Date
    lido: boolean
  }>>([])

  const adicionarAlerta = useCallback((alerta: Omit<typeof alertas[0], 'id' | 'data' | 'lido'>) => {
    const novoAlerta = {
      ...alerta,
      id: Date.now().toString(),
      data: new Date(),
      lido: false
    }
    
    setAlertas(prev => [novoAlerta, ...prev])
  }, [])

  const marcarComoLido = useCallback((id: string) => {
    setAlertas(prev => prev.map(alerta => 
      alerta.id === id ? { ...alerta, lido: true } : alerta
    ))
  }, [])

  const removerAlerta = useCallback((id: string) => {
    setAlertas(prev => prev.filter(alerta => alerta.id !== id))
  }, [])

  const alertasNaoLidos = alertas.filter(a => !a.lido)

  return {
    alertas,
    alertasNaoLidos,
    adicionarAlerta,
    marcarComoLido,
    removerAlerta
  }
}

// Hook para métricas de performance do fluxo de caixa
export const useCashFlowMetrics = (periodo: DateRange) => {
  const [metricas, setMetricas] = useState<{
    velocidadeEntradas: number // Média de dias para recebimento
    velocidadeSaidas: number // Média de dias para pagamento
    cicloOperacional: number // Dias do ciclo completo
    eficienciaCobranca: number // % de cobranças recebidas no prazo
    previsibilidade: number // % de acerto nas projeções
  } | null>(null)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const calcularMetricas = async () => {
      setLoading(true)
      try {
        // Implementação simplificada - em produção seria mais complexa
        const movimentacoes = await CashFlowService.obterMovimentacoes(periodo)
        
        // Calcular métricas baseadas nas movimentações
        const entradas = movimentacoes.filter(m => m.tipo === 'ENTRADA')
        const saidas = movimentacoes.filter(m => m.tipo === 'SAIDA')
        
        setMetricas({
          velocidadeEntradas: 2.5, // Mockado
          velocidadeSaidas: 1.8, // Mockado
          cicloOperacional: 4.3, // Mockado
          eficienciaCobranca: 85.2, // Mockado
          previsibilidade: 78.9 // Mockado
        })
      } catch (error) {
        console.error('Erro ao calcular métricas:', error)
      } finally {
        setLoading(false)
      }
    }

    calcularMetricas()
  }, [periodo])

  return { metricas, loading }
}