// Testes unitários para o serviço de comissões

import { CommissionService } from '../commission-service'
import { mcp_supabase_execute_sql } from '../../../../lib/supabase'

// Mock do Supabase
jest.mock('../../../../lib/supabase')

describe('CommissionService', () => {
  let commissionService: CommissionService
  const mockExecuteSQL = mcp_supabase_execute_sql as jest.MockedFunction<typeof mcp_supabase_execute_sql>

  beforeEach(() => {
    commissionService = new CommissionService()
    jest.clearAllMocks()
  })

  describe('setCommissionConfig', () => {
    it('deve configurar comissão para barbeiro', async () => {
      const config = {
        barbeiroId: 'barbeiro_123',
        percentual: 15,
        valorMinimo: 5,
        valorMaximo: 100,
        ativo: true
      }

      const mockResult = {
        data: [{
          id: 'config_123',
          barbeiro_id: 'barbeiro_123',
          servico_id: null,
          percentual: 15,
          valor_minimo: 5,
          valor_maximo: 100,
          ativo: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }]
      }

      mockExecuteSQL.mockResolvedValueOnce(mockResult)

      const result = await commissionService.setCommissionConfig(config)

      expect(mockExecuteSQL).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO comissoes_config'),
        [config.barbeiroId, null, config.percentual, config.valorMinimo, config.valorMaximo, config.ativo]
      )
      expect(result.barbeiro_id).toBe(config.barbeiroId)
      expect(result.percentual).toBe(config.percentual)
    })

    it('deve configurar comissão específica para serviço', async () => {
      const config = {
        barbeiroId: 'barbeiro_123',
        servicoId: 'servico_456',
        percentual: 20,
        ativo: true
      }

      const mockResult = {
        data: [{
          id: 'config_123',
          barbeiro_id: 'barbeiro_123',
          servico_id: 'servico_456',
          percentual: 20,
          ativo: true
        }]
      }

      mockExecuteSQL.mockResolvedValueOnce(mockResult)

      const result = await commissionService.setCommissionConfig(config)

      expect(mockExecuteSQL).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO comissoes_config'),
        [config.barbeiroId, config.servicoId, config.percentual, null, null, config.ativo]
      )
      expect(result.servico_id).toBe(config.servicoId)
    })

    it('deve lançar erro quando falha na configuração', async () => {
      const config = {
        barbeiroId: 'barbeiro_123',
        percentual: 15
      }

      mockExecuteSQL.mockResolvedValueOnce({ data: [] })

      await expect(commissionService.setCommissionConfig(config)).rejects.toThrow('Falha ao configurar comissão')
    })
  })

  describe('getCommissionConfig', () => {
    it('deve buscar configuração específica para serviço', async () => {
      const mockConfig = {
        id: 'config_123',
        barbeiro_id: 'barbeiro_123',
        servico_id: 'servico_456',
        percentual: 20,
        ativo: true
      }

      mockExecuteSQL.mockResolvedValueOnce({ data: [mockConfig] })

      const result = await commissionService.getCommissionConfig('barbeiro_123', 'servico_456')

      expect(mockExecuteSQL).toHaveBeenCalledWith(
        expect.stringContaining('WHERE barbeiro_id = $1 AND servico_id = $2'),
        ['barbeiro_123', 'servico_456']
      )
      expect(result).toEqual(mockConfig)
    })

    it('deve buscar configuração geral quando específica não existe', async () => {
      const mockGeneralConfig = {
        id: 'config_general',
        barbeiro_id: 'barbeiro_123',
        servico_id: null,
        percentual: 15,
        ativo: true
      }

      // Primeira chamada (específica) retorna vazio
      mockExecuteSQL.mockResolvedValueOnce({ data: [] })
      // Segunda chamada (geral) retorna configuração
      mockExecuteSQL.mockResolvedValueOnce({ data: [mockGeneralConfig] })

      const result = await commissionService.getCommissionConfig('barbeiro_123', 'servico_456')

      expect(mockExecuteSQL).toHaveBeenCalledTimes(2)
      expect(result).toEqual(mockGeneralConfig)
    })

    it('deve retornar null quando não encontra configuração', async () => {
      mockExecuteSQL.mockResolvedValueOnce({ data: [] })

      const result = await commissionService.getCommissionConfig('barbeiro_inexistente')

      expect(result).toBeNull()
    })
  })

  describe('calculateServiceCommission', () => {
    it('deve calcular comissão corretamente', async () => {
      const params = {
        barbeiroId: 'barbeiro_123',
        servicoId: 'servico_456',
        valorServico: 100,
        agendamentoId: 'agendamento_789',
        dataTransacao: '2024-01-01'
      }

      const mockConfig = {
        id: 'config_123',
        barbeiro_id: 'barbeiro_123',
        servico_id: 'servico_456',
        percentual: 15,
        valor_minimo: 5,
        valor_maximo: 50,
        ativo: true
      }

      mockExecuteSQL.mockResolvedValueOnce({ data: [mockConfig] })

      const result = await commissionService.calculateServiceCommission(params)

      expect(result.agendamentoId).toBe(params.agendamentoId)
      expect(result.barbeiroId).toBe(params.barbeiroId)
      expect(result.valorServico).toBe(params.valorServico)
      expect(result.percentualComissao).toBe(15)
      expect(result.valorComissao).toBe(15) // 15% de 100
      expect(result.status).toBe('CALCULADA')
    })

    it('deve aplicar valor mínimo quando comissão calculada é menor', async () => {
      const params = {
        barbeiroId: 'barbeiro_123',
        valorServico: 20, // 15% = 3, mas mínimo é 5
        agendamentoId: 'agendamento_789',
        dataTransacao: '2024-01-01'
      }

      const mockConfig = {
        percentual: 15,
        valor_minimo: 5,
        valor_maximo: 50
      }

      mockExecuteSQL.mockResolvedValueOnce({ data: [mockConfig] })

      const result = await commissionService.calculateServiceCommission(params)

      expect(result.valorComissao).toBe(5) // Valor mínimo aplicado
    })

    it('deve aplicar valor máximo quando comissão calculada é maior', async () => {
      const params = {
        barbeiroId: 'barbeiro_123',
        valorServico: 1000, // 15% = 150, mas máximo é 50
        agendamentoId: 'agendamento_789',
        dataTransacao: '2024-01-01'
      }

      const mockConfig = {
        percentual: 15,
        valor_minimo: 5,
        valor_maximo: 50
      }

      mockExecuteSQL.mockResolvedValueOnce({ data: [mockConfig] })

      const result = await commissionService.calculateServiceCommission(params)

      expect(result.valorComissao).toBe(50) // Valor máximo aplicado
    })

    it('deve lançar erro quando não encontra configuração', async () => {
      const params = {
        barbeiroId: 'barbeiro_inexistente',
        valorServico: 100,
        agendamentoId: 'agendamento_789',
        dataTransacao: '2024-01-01'
      }

      mockExecuteSQL.mockResolvedValueOnce({ data: [] })

      await expect(commissionService.calculateServiceCommission(params)).rejects.toThrow(
        'Configuração de comissão não encontrada'
      )
    })
  })

  describe('processAutomaticCommission', () => {
    it('deve processar comissão automática para receita confirmada', async () => {
      const transacao = {
        id: 'trans_123',
        tipo: 'RECEITA' as const,
        valor: 50,
        barbeiro_id: 'barbeiro_123',
        agendamento_id: 'agendamento_789',
        data_transacao: '2024-01-01',
        status: 'CONFIRMADA' as const,
        descricao: 'Corte de cabelo',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      // Mock para verificar se comissão já existe
      mockExecuteSQL.mockResolvedValueOnce({ data: [] })
      
      // Mock para buscar service_id do agendamento
      mockExecuteSQL.mockResolvedValueOnce({ 
        data: [{ service_id: 'servico_456' }] 
      })
      
      // Mock para buscar configuração de comissão
      mockExecuteSQL.mockResolvedValueOnce({ 
        data: [{ percentual: 15, valor_minimo: 5, valor_maximo: 50 }] 
      })
      
      // Mock para criar transação de comissão
      mockExecuteSQL.mockResolvedValueOnce({ data: [{ id: 'comissao_123' }] })

      const result = await commissionService.processAutomaticCommission(transacao)

      expect(result).not.toBeNull()
      expect(result?.valorServico).toBe(50)
      expect(result?.valorComissao).toBe(7.5) // 15% de 50
      expect(mockExecuteSQL).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO transacoes_financeiras'),
        expect.arrayContaining([7.5, expect.stringContaining('Comissão 15%')])
      )
    })

    it('deve retornar null para transação que não é receita confirmada', async () => {
      const transacao = {
        id: 'trans_123',
        tipo: 'DESPESA' as const,
        valor: 50,
        barbeiro_id: 'barbeiro_123',
        agendamento_id: 'agendamento_789',
        data_transacao: '2024-01-01',
        status: 'CONFIRMADA' as const,
        descricao: 'Despesa',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = await commissionService.processAutomaticCommission(transacao)

      expect(result).toBeNull()
      expect(mockExecuteSQL).not.toHaveBeenCalled()
    })

    it('deve retornar comissão existente se já processada', async () => {
      const transacao = {
        id: 'trans_123',
        tipo: 'RECEITA' as const,
        valor: 50,
        barbeiro_id: 'barbeiro_123',
        agendamento_id: 'agendamento_789',
        data_transacao: '2024-01-01',
        status: 'CONFIRMADA' as const,
        descricao: 'Corte de cabelo',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const existingCommission = {
        agendamentoId: 'agendamento_789',
        barbeiroId: 'barbeiro_123',
        valorComissao: 7.5,
        status: 'PAGA'
      }

      // Mock retorna comissão existente
      mockExecuteSQL.mockResolvedValueOnce({ 
        data: [{ 
          agendamento_id: 'agendamento_789',
          barbeiro_id: 'barbeiro_123',
          valor: 7.5,
          status: 'CONFIRMADA'
        }] 
      })

      const result = await commissionService.processAutomaticCommission(transacao)

      expect(result).not.toBeNull()
      expect(result?.agendamentoId).toBe('agendamento_789')
      // Deve ter chamado apenas a verificação de existência
      expect(mockExecuteSQL).toHaveBeenCalledTimes(1)
    })
  })

  describe('validateCommissionConfig', () => {
    it('deve validar configuração correta', () => {
      const config = {
        barbeiroId: 'barbeiro_123',
        percentual: 15,
        valorMinimo: 5,
        valorMaximo: 50
      }

      const result = commissionService.validateCommissionConfig(config)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('deve detectar barbeiro ausente', () => {
      const config = {
        barbeiroId: '',
        percentual: 15
      }

      const result = commissionService.validateCommissionConfig(config)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('ID do barbeiro é obrigatório')
    })

    it('deve detectar percentual inválido', () => {
      const config = {
        barbeiroId: 'barbeiro_123',
        percentual: 150 // Acima de 100%
      }

      const result = commissionService.validateCommissionConfig(config)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Percentual deve estar entre 0% e 100%')
    })

    it('deve detectar valor mínimo negativo', () => {
      const config = {
        barbeiroId: 'barbeiro_123',
        percentual: 15,
        valorMinimo: -5
      }

      const result = commissionService.validateCommissionConfig(config)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Valor mínimo não pode ser negativo')
    })

    it('deve detectar valor máximo menor que mínimo', () => {
      const config = {
        barbeiroId: 'barbeiro_123',
        percentual: 15,
        valorMinimo: 50,
        valorMaximo: 20
      }

      const result = commissionService.validateCommissionConfig(config)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Valor máximo deve ser maior que valor mínimo')
    })
  })

  describe('applyCommissionAdjustment', () => {
    it('deve aplicar bônus na comissão', async () => {
      const agendamentoId = 'agendamento_789'
      const valorAjuste = 10
      const motivo = 'Bônus por excelente atendimento'
      const tipo = 'BONUS'
      const aprovadoPor = 'admin_123'

      // Mock para buscar comissão existente
      mockExecuteSQL.mockResolvedValueOnce({ 
        data: [{ 
          agendamento_id: agendamentoId,
          barbeiro_id: 'barbeiro_123',
          valor: 15, // Comissão original
          status: 'CONFIRMADA'
        }] 
      })

      // Mock para atualizar transação
      mockExecuteSQL.mockResolvedValueOnce({ 
        data: [{ id: 'trans_123' }] 
      })

      const result = await commissionService.applyCommissionAdjustment(
        agendamentoId, valorAjuste, motivo, tipo, aprovadoPor
      )

      expect(result.valorOriginal).toBe(15)
      expect(result.valorAjustado).toBe(25) // 15 + 10
      expect(result.tipo).toBe('BONUS')
      expect(result.motivo).toBe(motivo)
      
      expect(mockExecuteSQL).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE transacoes_financeiras'),
        [25, expect.stringContaining('BONUS'), agendamentoId]
      )
    })

    it('deve aplicar desconto na comissão', async () => {
      const agendamentoId = 'agendamento_789'
      const valorAjuste = 5
      const tipo = 'DESCONTO'

      // Mock para buscar comissão existente
      mockExecuteSQL.mockResolvedValueOnce({ 
        data: [{ valor: 15 }] 
      })

      // Mock para atualizar transação
      mockExecuteSQL.mockResolvedValueOnce({ 
        data: [{ id: 'trans_123' }] 
      })

      const result = await commissionService.applyCommissionAdjustment(
        agendamentoId, valorAjuste, 'Desconto', tipo, 'admin_123'
      )

      expect(result.valorAjustado).toBe(10) // 15 - 5
    })

    it('deve aplicar correção na comissão', async () => {
      const agendamentoId = 'agendamento_789'
      const valorAjuste = 20
      const tipo = 'CORRECAO'

      // Mock para buscar comissão existente
      mockExecuteSQL.mockResolvedValueOnce({ 
        data: [{ valor: 15 }] 
      })

      // Mock para atualizar transação
      mockExecuteSQL.mockResolvedValueOnce({ 
        data: [{ id: 'trans_123' }] 
      })

      const result = await commissionService.applyCommissionAdjustment(
        agendamentoId, valorAjuste, 'Correção de valor', tipo, 'admin_123'
      )

      expect(result.valorAjustado).toBe(20) // Valor absoluto
    })

    it('deve lançar erro quando comissão não existe', async () => {
      mockExecuteSQL.mockResolvedValueOnce({ data: [] })

      await expect(
        commissionService.applyCommissionAdjustment('agendamento_inexistente', 10, 'Teste', 'BONUS', 'admin_123')
      ).rejects.toThrow('Comissão não encontrada')
    })
  })
})