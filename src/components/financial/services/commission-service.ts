// Serviço para cálculo e gerenciamento de comissões

import { mcp_supabase_execute_sql } from '../../../lib/supabase'
import { ComissaoConfig, ComissaoCalculada, TransacaoFinanceira } from '../types'
import { calculateCommission, formatCurrency } from '../utils'

// Tipos específicos para o serviço de comissões
export interface ComissionCalculationParams {
  barbeiroId: string
  servicoId?: string
  valorServico: number
  agendamentoId: string
  dataTransacao: string
}

export interface ComissionConfigInput {
  barbeiroId: string
  servicoId?: string
  percentual: number
  valorMinimo?: number
  valorMaximo?: number
  ativo?: boolean
}

export interface ComissionReport {
  barbeiroId: string
  barbeiroNome: string
  periodo: {
    inicio: string
    fim: string
  }
  totalComissoes: number
  totalServicos: number
  comissoesPendentes: number
  comissoesPagas: number
  ticketMedio: number
  detalhes: ComissaoCalculada[]
}

export interface ComissionAdjustment {
  id: string
  comissaoId: string
  valorOriginal: number
  valorAjustado: number
  motivo: string
  tipo: 'BONUS' | 'DESCONTO' | 'CORRECAO'
  aprovadoPor: string
  dataAjuste: string
}

// Serviço principal de comissões
export class CommissionService {
  // Configurar percentual de comissão para barbeiro
  async setCommissionConfig(config: ComissionConfigInput): Promise<ComissaoConfig> {
    try {
      const query = `
        INSERT INTO comissoes_config (
          barbeiro_id, servico_id, percentual, valor_minimo, valor_maximo, ativo
        ) VALUES (
          $1, $2, $3, $4, $5, $6
        )
        ON CONFLICT (barbeiro_id, servico_id) 
        DO UPDATE SET 
          percentual = EXCLUDED.percentual,
          valor_minimo = EXCLUDED.valor_minimo,
          valor_maximo = EXCLUDED.valor_maximo,
          ativo = EXCLUDED.ativo,
          updated_at = NOW()
        RETURNING *
      `

      const result = await mcp_supabase_execute_sql(query, [
        config.barbeiroId,
        config.servicoId || null,
        config.percentual,
        config.valorMinimo || null,
        config.valorMaximo || null,
        config.ativo ?? true
      ])

      if (result.data && result.data.length > 0) {
        return result.data[0] as ComissaoConfig
      }

      throw new Error('Falha ao configurar comissão')
    } catch (error) {
      console.error('Erro ao configurar comissão:', error)
      throw error
    }
  }

  // Obter configuração de comissão para barbeiro/serviço
  async getCommissionConfig(barbeiroId: string, servicoId?: string): Promise<ComissaoConfig | null> {
    try {
      let query: string
      let params: any[]

      if (servicoId) {
        // Buscar configuração específica para o serviço
        query = `
          SELECT * FROM comissoes_config 
          WHERE barbeiro_id = $1 AND servico_id = $2 AND ativo = true
        `
        params = [barbeiroId, servicoId]
      } else {
        // Buscar configuração geral do barbeiro
        query = `
          SELECT * FROM comissoes_config 
          WHERE barbeiro_id = $1 AND servico_id IS NULL AND ativo = true
        `
        params = [barbeiroId]
      }

      const result = await mcp_supabase_execute_sql(query, params)

      if (result.data && result.data.length > 0) {
        return result.data[0] as ComissaoConfig
      }

      // Se não encontrou configuração específica e foi solicitada, buscar geral
      if (servicoId) {
        return await this.getCommissionConfig(barbeiroId)
      }

      return null
    } catch (error) {
      console.error('Erro ao buscar configuração de comissão:', error)
      throw error
    }
  }

  // Calcular comissão para um serviço
  async calculateServiceCommission(params: ComissionCalculationParams): Promise<ComissaoCalculada> {
    try {
      // Buscar configuração de comissão
      const config = await this.getCommissionConfig(params.barbeiroId, params.servicoId)
      
      if (!config) {
        throw new Error(`Configuração de comissão não encontrada para barbeiro ${params.barbeiroId}`)
      }

      // Calcular valor da comissão
      const valorComissao = calculateCommission(
        params.valorServico,
        config.percentual,
        config.valorMinimo,
        config.valorMaximo
      )

      // Criar objeto de comissão calculada
      const comissaoCalculada: ComissaoCalculada = {
        agendamentoId: params.agendamentoId,
        barbeiroId: params.barbeiroId,
        valorServico: params.valorServico,
        percentualComissao: config.percentual,
        valorComissao,
        descontos: 0, // Será calculado posteriormente se houver
        valorLiquido: valorComissao,
        status: 'CALCULADA'
      }

      // Log para desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('Comissão calculada:', {
          barbeiro: params.barbeiroId,
          valorServico: formatCurrency(params.valorServico),
          percentual: `${config.percentual}%`,
          valorComissao: formatCurrency(valorComissao)
        })
      }

      return comissaoCalculada
    } catch (error) {
      console.error('Erro ao calcular comissão:', error)
      throw error
    }
  }

  // Processar comissão automática para transação
  async processAutomaticCommission(transacao: TransacaoFinanceira): Promise<ComissaoCalculada | null> {
    try {
      // Só processar comissões para receitas confirmadas com barbeiro
      if (transacao.tipo !== 'RECEITA' || 
          transacao.status !== 'CONFIRMADA' || 
          !transacao.barbeiro_id ||
          !transacao.agendamento_id) {
        return null
      }

      // Verificar se já existe comissão para este agendamento
      const existingCommission = await this.getCommissionByAppointment(transacao.agendamento_id)
      if (existingCommission) {
        console.log('Comissão já existe para agendamento:', transacao.agendamento_id)
        return existingCommission
      }

      // Buscar informações do serviço se disponível
      let servicoId: string | undefined
      if (transacao.agendamento_id) {
        const appointmentQuery = `
          SELECT service_id FROM appointments WHERE id = $1
        `
        const appointmentResult = await mcp_supabase_execute_sql(appointmentQuery, [transacao.agendamento_id])
        if (appointmentResult.data && appointmentResult.data.length > 0) {
          servicoId = appointmentResult.data[0].service_id
        }
      }

      // Calcular comissão
      const comissaoCalculada = await this.calculateServiceCommission({
        barbeiroId: transacao.barbeiro_id,
        servicoId,
        valorServico: transacao.valor,
        agendamentoId: transacao.agendamento_id,
        dataTransacao: transacao.data_transacao
      })

      // Criar transação de comissão no banco
      await this.createCommissionTransaction(comissaoCalculada, transacao.data_transacao)

      return comissaoCalculada
    } catch (error) {
      console.error('Erro ao processar comissão automática:', error)
      throw error
    }
  }

  // Criar transação de comissão no banco
  private async createCommissionTransaction(
    comissao: ComissaoCalculada, 
    dataTransacao: string
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO transacoes_financeiras (
          tipo, valor, descricao, agendamento_id, barbeiro_id, 
          data_transacao, status, observacoes
        ) VALUES (
          'COMISSAO', $1, $2, $3, $4, $5, 'CONFIRMADA', $6
        )
      `

      const descricao = `Comissão ${comissao.percentualComissao}% - Agendamento ${comissao.agendamentoId}`
      const observacoes = `Valor serviço: ${formatCurrency(comissao.valorServico)} | Comissão: ${formatCurrency(comissao.valorComissao)}`

      await mcp_supabase_execute_sql(query, [
        comissao.valorComissao,
        descricao,
        comissao.agendamentoId,
        comissao.barbeiroId,
        dataTransacao,
        observacoes
      ])

      console.log('Transação de comissão criada:', {
        barbeiro: comissao.barbeiroId,
        valor: formatCurrency(comissao.valorComissao),
        agendamento: comissao.agendamentoId
      })
    } catch (error) {
      console.error('Erro ao criar transação de comissão:', error)
      throw error
    }
  }

  // Buscar comissão por agendamento
  async getCommissionByAppointment(agendamentoId: string): Promise<ComissaoCalculada | null> {
    try {
      const query = `
        SELECT 
          tf.*,
          a.service_id,
          cc.percentual as percentual_comissao
        FROM transacoes_financeiras tf
        LEFT JOIN appointments a ON tf.agendamento_id = a.id
        LEFT JOIN comissoes_config cc ON tf.barbeiro_id = cc.barbeiro_id 
          AND (cc.servico_id = a.service_id OR cc.servico_id IS NULL)
        WHERE tf.agendamento_id = $1 AND tf.tipo = 'COMISSAO'
        ORDER BY cc.servico_id NULLS LAST
        LIMIT 1
      `

      const result = await mcp_supabase_execute_sql(query, [agendamentoId])

      if (result.data && result.data.length > 0) {
        const row = result.data[0]
        return {
          agendamentoId: row.agendamento_id,
          barbeiroId: row.barbeiro_id,
          valorServico: 0, // Seria necessário buscar da transação original
          percentualComissao: row.percentual_comissao || 0,
          valorComissao: row.valor,
          descontos: 0,
          valorLiquido: row.valor,
          status: row.status === 'CONFIRMADA' ? 'PAGA' : 'CALCULADA'
        }
      }

      return null
    } catch (error) {
      console.error('Erro ao buscar comissão por agendamento:', error)
      throw error
    }
  }

  // Listar configurações de comissão de um barbeiro
  async listBarbeiroCommissionConfigs(barbeiroId: string): Promise<ComissaoConfig[]> {
    try {
      const query = `
        SELECT 
          cc.*,
          s.nome as servico_nome
        FROM comissoes_config cc
        LEFT JOIN services s ON cc.servico_id = s.id
        WHERE cc.barbeiro_id = $1
        ORDER BY cc.servico_id NULLS FIRST, cc.created_at DESC
      `

      const result = await mcp_supabase_execute_sql(query, [barbeiroId])
      return result.data || []
    } catch (error) {
      console.error('Erro ao listar configurações de comissão:', error)
      throw error
    }
  }

  // Gerar relatório de comissões por barbeiro
  async generateCommissionReport(
    barbeiroId: string,
    periodo: { inicio: string; fim: string }
  ): Promise<ComissionReport> {
    try {
      // Buscar dados do barbeiro
      const barbeiroQuery = `
        SELECT nome FROM profiles WHERE id = $1
      `
      const barbeiroResult = await mcp_supabase_execute_sql(barbeiroQuery, [barbeiroId])
      const barbeiroNome = barbeiroResult.data?.[0]?.nome || 'Barbeiro Desconhecido'

      // Buscar comissões do período
      const comissoesQuery = `
        SELECT 
          tf.*,
          a.service_id,
          s.nome as servico_nome,
          cc.percentual as percentual_comissao
        FROM transacoes_financeiras tf
        LEFT JOIN appointments a ON tf.agendamento_id = a.id
        LEFT JOIN services s ON a.service_id = s.id
        LEFT JOIN comissoes_config cc ON tf.barbeiro_id = cc.barbeiro_id 
          AND (cc.servico_id = a.service_id OR cc.servico_id IS NULL)
        WHERE tf.barbeiro_id = $1 
          AND tf.tipo = 'COMISSAO'
          AND tf.data_transacao BETWEEN $2 AND $3
        ORDER BY tf.data_transacao DESC
      `

      const comissoesResult = await mcp_supabase_execute_sql(comissoesQuery, [
        barbeiroId,
        periodo.inicio,
        periodo.fim
      ])

      const comissoes = comissoesResult.data || []

      // Calcular métricas
      const totalComissoes = comissoes.reduce((sum, c) => sum + (c.valor || 0), 0)
      const totalServicos = comissoes.length
      const comissoesPendentes = comissoes.filter(c => c.status === 'PENDENTE').length
      const comissoesPagas = comissoes.filter(c => c.status === 'CONFIRMADA').length
      const ticketMedio = totalServicos > 0 ? totalComissoes / totalServicos : 0

      // Mapear detalhes
      const detalhes: ComissaoCalculada[] = comissoes.map(c => ({
        agendamentoId: c.agendamento_id,
        barbeiroId: c.barbeiro_id,
        valorServico: 0, // Seria necessário buscar da transação original
        percentualComissao: c.percentual_comissao || 0,
        valorComissao: c.valor,
        descontos: 0,
        valorLiquido: c.valor,
        status: c.status === 'CONFIRMADA' ? 'PAGA' : 'CALCULADA'
      }))

      return {
        barbeiroId,
        barbeiroNome,
        periodo,
        totalComissoes,
        totalServicos,
        comissoesPendentes,
        comissoesPagas,
        ticketMedio,
        detalhes
      }
    } catch (error) {
      console.error('Erro ao gerar relatório de comissões:', error)
      throw error
    }
  }

  // Aplicar ajuste manual em comissão
  async applyCommissionAdjustment(
    agendamentoId: string,
    valorAjuste: number,
    motivo: string,
    tipo: 'BONUS' | 'DESCONTO' | 'CORRECAO',
    aprovadoPor: string
  ): Promise<ComissionAdjustment> {
    try {
      // Buscar comissão existente
      const comissao = await this.getCommissionByAppointment(agendamentoId)
      if (!comissao) {
        throw new Error('Comissão não encontrada para este agendamento')
      }

      // Calcular novo valor
      const valorOriginal = comissao.valorComissao
      let valorAjustado: number

      switch (tipo) {
        case 'BONUS':
          valorAjustado = valorOriginal + Math.abs(valorAjuste)
          break
        case 'DESCONTO':
          valorAjustado = Math.max(0, valorOriginal - Math.abs(valorAjuste))
          break
        case 'CORRECAO':
          valorAjustado = Math.abs(valorAjuste)
          break
      }

      // Atualizar transação de comissão
      const updateQuery = `
        UPDATE transacoes_financeiras 
        SET valor = $1, 
            observacoes = COALESCE(observacoes, '') || ' | Ajuste: ' || $2,
            updated_at = NOW()
        WHERE agendamento_id = $3 AND tipo = 'COMISSAO'
        RETURNING id
      `

      const updateResult = await mcp_supabase_execute_sql(updateQuery, [
        valorAjustado,
        `${tipo}: ${motivo}`,
        agendamentoId
      ])

      if (!updateResult.data || updateResult.data.length === 0) {
        throw new Error('Falha ao atualizar comissão')
      }

      // Criar registro de ajuste (seria uma nova tabela)
      const ajuste: ComissionAdjustment = {
        id: `adj_${Date.now()}`,
        comissaoId: updateResult.data[0].id,
        valorOriginal,
        valorAjustado,
        motivo,
        tipo,
        aprovadoPor,
        dataAjuste: new Date().toISOString()
      }

      console.log('Ajuste de comissão aplicado:', {
        agendamento: agendamentoId,
        valorOriginal: formatCurrency(valorOriginal),
        valorAjustado: formatCurrency(valorAjustado),
        tipo,
        motivo
      })

      return ajuste
    } catch (error) {
      console.error('Erro ao aplicar ajuste de comissão:', error)
      throw error
    }
  }

  // Cancelar comissão (para cancelamentos de agendamento)
  async cancelCommission(agendamentoId: string, motivo: string): Promise<void> {
    try {
      const query = `
        UPDATE transacoes_financeiras 
        SET status = 'CANCELADA',
            observacoes = COALESCE(observacoes, '') || ' | Cancelada: ' || $1,
            updated_at = NOW()
        WHERE agendamento_id = $2 AND tipo = 'COMISSAO'
      `

      await mcp_supabase_execute_sql(query, [motivo, agendamentoId])

      console.log('Comissão cancelada:', {
        agendamento: agendamentoId,
        motivo
      })
    } catch (error) {
      console.error('Erro ao cancelar comissão:', error)
      throw error
    }
  }

  // Validar configuração de comissão
  validateCommissionConfig(config: ComissionConfigInput): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Barbeiro é obrigatório
    if (!config.barbeiroId) {
      errors.push('ID do barbeiro é obrigatório')
    }

    // Percentual deve estar entre 0 e 100
    if (config.percentual < 0 || config.percentual > 100) {
      errors.push('Percentual deve estar entre 0% e 100%')
    }

    // Valor mínimo não pode ser negativo
    if (config.valorMinimo && config.valorMinimo < 0) {
      errors.push('Valor mínimo não pode ser negativo')
    }

    // Valor máximo deve ser maior que mínimo
    if (config.valorMinimo && config.valorMaximo && config.valorMaximo < config.valorMinimo) {
      errors.push('Valor máximo deve ser maior que valor mínimo')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Instância singleton do serviço
export const commissionService = new CommissionService()
