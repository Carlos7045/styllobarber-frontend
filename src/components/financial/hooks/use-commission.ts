// Hook para gerenciar comissões no React

import { useState, useEffect, useCallback } from 'react'
import { commissionService } from '../services/commission-service'
import { ComissaoConfig, ComissaoCalculada } from '../types'
import { ComissionConfigInput, ComissionReport } from '../services/commission-service'

// Tipos para o hook
export interface UseCommissionReturn {
  // Estado
  configs: ComissaoConfig[]
  report: ComissionReport | null
  loading: boolean
  error: string | null

  // Ações
  setCommissionConfig: (config: ComissionConfigInput) => Promise<void>
  getCommissionConfig: (barbeiroId: string, servicoId?: string) => Promise<ComissaoConfig | null>
  calculateCommission: (params: {
    barbeiroId: string
    servicoId?: string
    valorServico: number
    agendamentoId: string
    dataTransacao: string
  }) => Promise<ComissaoCalculada>
  generateReport: (barbeiroId: string, periodo: { inicio: string; fim: string }) => Promise<void>
  applyAdjustment: (
    agendamentoId: string,
    valorAjuste: number,
    motivo: string,
    tipo: 'BONUS' | 'DESCONTO' | 'CORRECAO'
  ) => Promise<void>
  cancelCommission: (agendamentoId: string, motivo: string) => Promise<void>
  loadBarbeiroConfigs: (barbeiroId: string) => Promise<void>
  clearError: () => void
  refresh: () => Promise<void>
}

export interface UseCommissionOptions {
  barbeiroId?: string
  autoLoad?: boolean
  onError?: (error: string) => void
  onSuccess?: (message: string) => void
}

// Hook principal para gerenciar comissões
export function useCommission(options: UseCommissionOptions = {}): UseCommissionReturn {
  const { barbeiroId, autoLoad = true, onError, onSuccess } = options

  // Estado
  const [configs, setConfigs] = useState<ComissaoConfig[]>([])
  const [report, setReport] = useState<ComissionReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Função para tratar erros
  const handleError = useCallback((err: unknown, defaultMessage: string) => {
    const errorMessage = err instanceof Error ? err.message : defaultMessage
    setError(errorMessage)
    onError?.(errorMessage)
    console.error(defaultMessage, err)
  }, [onError])

  // Função para tratar sucesso
  const handleSuccess = useCallback((message: string) => {
    setError(null)
    onSuccess?.(message)
  }, [onSuccess])

  // Configurar comissão
  const setCommissionConfig = useCallback(async (config: ComissionConfigInput) => {
    try {
      setLoading(true)
      setError(null)

      // Validar dados
      const validation = commissionService.validateCommissionConfig(config)
      if (!validation.isValid) {
        throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`)
      }

      const newConfig = await commissionService.setCommissionConfig(config)
      
      // Atualizar lista de configurações
      setConfigs(prev => {
        const filtered = prev.filter(c => 
          !(c.barbeiro_id === newConfig.barbeiro_id && c.servico_id === newConfig.servico_id)
        )
        return [...filtered, newConfig]
      })

      handleSuccess('Configuração de comissão salva com sucesso')
    } catch (err) {
      handleError(err, 'Erro ao configurar comissão')
    } finally {
      setLoading(false)
    }
  }, [handleError, handleSuccess])

  // Buscar configuração de comissão
  const getCommissionConfig = useCallback(async (
    barbeiroId: string, 
    servicoId?: string
  ): Promise<ComissaoConfig | null> => {
    try {
      setError(null)
      return await commissionService.getCommissionConfig(barbeiroId, servicoId)
    } catch (err) {
      handleError(err, 'Erro ao buscar configuração de comissão')
      return null
    }
  }, [handleError])

  // Calcular comissão
  const calculateCommission = useCallback(async (params: {
    barbeiroId: string
    servicoId?: string
    valorServico: number
    agendamentoId: string
    dataTransacao: string
  }): Promise<ComissaoCalculada> => {
    try {
      setError(null)
      const result = await commissionService.calculateServiceCommission(params)
      return result
    } catch (err) {
      handleError(err, 'Erro ao calcular comissão')
      throw err
    }
  }, [handleError])

  // Gerar relatório
  const generateReport = useCallback(async (
    barbeiroId: string, 
    periodo: { inicio: string; fim: string }
  ) => {
    try {
      setLoading(true)
      setError(null)
      
      const reportData = await commissionService.generateCommissionReport(barbeiroId, periodo)
      setReport(reportData)
      
      handleSuccess('Relatório gerado com sucesso')
    } catch (err) {
      handleError(err, 'Erro ao gerar relatório de comissões')
    } finally {
      setLoading(false)
    }
  }, [handleError, handleSuccess])

  // Aplicar ajuste
  const applyAdjustment = useCallback(async (
    agendamentoId: string,
    valorAjuste: number,
    motivo: string,
    tipo: 'BONUS' | 'DESCONTO' | 'CORRECAO'
  ) => {
    try {
      setLoading(true)
      setError(null)
      
      // Assumir usuário atual como aprovador (seria obtido do contexto de auth)
      const aprovadoPor = 'current_user' // TODO: Obter do contexto de autenticação
      
      await commissionService.applyCommissionAdjustment(
        agendamentoId, 
        valorAjuste, 
        motivo, 
        tipo, 
        aprovadoPor
      )
      
      handleSuccess(`Ajuste de comissão (${tipo}) aplicado com sucesso`)
    } catch (err) {
      handleError(err, 'Erro ao aplicar ajuste de comissão')
    } finally {
      setLoading(false)
    }
  }, [handleError, handleSuccess])

  // Cancelar comissão
  const cancelCommission = useCallback(async (agendamentoId: string, motivo: string) => {
    try {
      setLoading(true)
      setError(null)
      
      await commissionService.cancelCommission(agendamentoId, motivo)
      
      handleSuccess('Comissão cancelada com sucesso')
    } catch (err) {
      handleError(err, 'Erro ao cancelar comissão')
    } finally {
      setLoading(false)
    }
  }, [handleError, handleSuccess])

  // Carregar configurações do barbeiro
  const loadBarbeiroConfigs = useCallback(async (barbeiroId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const configsList = await commissionService.listBarbeiroCommissionConfigs(barbeiroId)
      setConfigs(configsList)
    } catch (err) {
      handleError(err, 'Erro ao carregar configurações de comissão')
    } finally {
      setLoading(false)
    }
  }, [handleError])

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Atualizar dados
  const refresh = useCallback(async () => {
    if (barbeiroId) {
      await loadBarbeiroConfigs(barbeiroId)
    }
  }, [barbeiroId, loadBarbeiroConfigs])

  // Carregar dados iniciais
  useEffect(() => {
    if (autoLoad && barbeiroId) {
      loadBarbeiroConfigs(barbeiroId)
    }
  }, [autoLoad, barbeiroId, loadBarbeiroConfigs])

  return {
    // Estado
    configs,
    report,
    loading,
    error,

    // Ações
    setCommissionConfig,
    getCommissionConfig,
    calculateCommission,
    generateReport,
    applyAdjustment,
    cancelCommission,
    loadBarbeiroConfigs,
    clearError,
    refresh
  }
}

// Hook específico para barbeiros visualizarem suas próprias comissões
export function useBarbeiroCommissions(barbeiroId: string) {
  const commission = useCommission({ 
    barbeiroId, 
    autoLoad: true 
  })

  // Função para gerar relatório do mês atual
  const generateCurrentMonthReport = useCallback(async () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    await commission.generateReport(barbeiroId, {
      inicio: firstDay.toISOString().split('T')[0],
      fim: lastDay.toISOString().split('T')[0]
    })
  }, [barbeiroId, commission])

  // Função para gerar relatório personalizado
  const generateCustomReport = useCallback(async (
    startDate: string, 
    endDate: string
  ) => {
    await commission.generateReport(barbeiroId, {
      inicio: startDate,
      fim: endDate
    })
  }, [barbeiroId, commission])

  return {
    ...commission,
    generateCurrentMonthReport,
    generateCustomReport
  }
}

// Hook para administradores gerenciarem comissões
export function useAdminCommissions() {
  const commission = useCommission({ autoLoad: false })

  // Função para configurar comissão padrão para todos os barbeiros
  const setDefaultCommissionForAllBarbers = useCallback(async (
    percentual: number,
    valorMinimo?: number,
    valorMaximo?: number
  ) => {
    try {
      commission.clearError()
      
      // TODO: Buscar lista de barbeiros ativos
      // const barbeiros = await getBarbeirosAtivos()
      
      // Por enquanto, simular com array vazio
      const barbeiros: string[] = []
      
      const promises = barbeiros.map(barbeiroId =>
        commission.setCommissionConfig({
          barbeiroId,
          percentual,
          valorMinimo,
          valorMaximo,
          ativo: true
        })
      )

      await Promise.all(promises)
    } catch (err) {
      console.error('Erro ao configurar comissão padrão:', err)
    }
  }, [commission])

  // Função para gerar relatório consolidado
  const generateConsolidatedReport = useCallback(async (
    periodo: { inicio: string; fim: string }
  ) => {
    try {
      // TODO: Implementar relatório consolidado de todos os barbeiros
      console.log('Gerando relatório consolidado para período:', periodo)
    } catch (err) {
      console.error('Erro ao gerar relatório consolidado:', err)
    }
  }, [])

  return {
    ...commission,
    setDefaultCommissionForAllBarbers,
    generateConsolidatedReport
  }
}

// Hook para cálculos rápidos de comissão
export function useCommissionCalculator() {
  const [result, setResult] = useState<ComissaoCalculada | null>(null)
  const [loading, setLoading] = useState(false)

  const calculate = useCallback(async (
    barbeiroId: string,
    valorServico: number,
    servicoId?: string
  ) => {
    try {
      setLoading(true)
      
      const calculatedCommission = await commissionService.calculateServiceCommission({
        barbeiroId,
        servicoId,
        valorServico,
        agendamentoId: `calc_${Date.now()}`, // ID temporário para cálculo
        dataTransacao: new Date().toISOString().split('T')[0]
      })
      
      setResult(calculatedCommission)
      return calculatedCommission
    } catch (err) {
      console.error('Erro no cálculo de comissão:', err)
      setResult(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setResult(null)
  }, [])

  return {
    result,
    loading,
    calculate,
    clear
  }
}
