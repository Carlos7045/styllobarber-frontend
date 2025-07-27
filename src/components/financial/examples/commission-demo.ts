// Demonstração do sistema de cálculo de comissões

import { commissionService } from '../services/commission-service'
import { formatCurrency, formatPercentage } from '../utils'

// Classe para demonstrar funcionalidades de comissão
export class CommissionDemo {
  // Demo completa do sistema de comissões
  async runCompleteDemo(): Promise<void> {
    console.log('🧮 Iniciando demo do sistema de comissões...')
    
    try {
      // 1. Configurar comissões para barbeiros
      await this.demoCommissionConfiguration()
      
      // 2. Calcular comissões para serviços
      await this.demoCommissionCalculation()
      
      // 3. Processar comissões automáticas
      await this.demoAutomaticCommission()
      
      // 4. Gerar relatórios
      await this.demoCommissionReports()
      
      // 5. Aplicar ajustes
      await this.demoCommissionAdjustments()
      
      console.log('\n🎉 Demo do sistema de comissões finalizada!')
      
    } catch (error) {
      console.error('❌ Erro na demo de comissões:', error)
    }
  }

  // Demo de configuração de comissões
  async demoCommissionConfiguration(): Promise<void> {
    console.log('\n⚙️ Configurando comissões para barbeiros...')
    
    try {
      // Configuração geral para barbeiro
      const configGeral = {
        barbeiroId: 'barbeiro_123',
        percentual: 15,
        valorMinimo: 5,
        valorMaximo: 50,
        ativo: true
      }
      
      console.log('📝 Configurando comissão geral:', {
        barbeiro: configGeral.barbeiroId,
        percentual: `${configGeral.percentual}%`,
        limites: `${formatCurrency(configGeral.valorMinimo!)} - ${formatCurrency(configGeral.valorMaximo!)}`
      })
      
      const resultGeral = await commissionService.setCommissionConfig(configGeral)
      console.log('✅ Configuração geral salva:', resultGeral.id)
      
      // Configuração específica para serviço premium
      const configPremium = {
        barbeiroId: 'barbeiro_123',
        servicoId: 'servico_premium',
        percentual: 20,
        valorMinimo: 10,
        valorMaximo: 100,
        ativo: true
      }
      
      console.log('📝 Configurando comissão premium:', {
        barbeiro: configPremium.barbeiroId,
        servico: configPremium.servicoId,
        percentual: `${configPremium.percentual}%`
      })
      
      const resultPremium = await commissionService.setCommissionConfig(configPremium)
      console.log('✅ Configuração premium salva:', resultPremium.id)
      
      // Configurar outro barbeiro
      const configBarbeiro2 = {
        barbeiroId: 'barbeiro_456',
        percentual: 12,
        valorMinimo: 3,
        ativo: true
      }
      
      const resultBarbeiro2 = await commissionService.setCommissionConfig(configBarbeiro2)
      console.log('✅ Configuração barbeiro 2 salva:', resultBarbeiro2.id)
      
    } catch (error) {
      console.error('❌ Erro na configuração:', error)
    }
  }

  // Demo de cálculo de comissões
  async demoCommissionCalculation(): Promise<void> {
    console.log('\n🧮 Calculando comissões para diferentes cenários...')
    
    const cenarios = [
      {
        nome: 'Corte simples',
        barbeiroId: 'barbeiro_123',
        valorServico: 30,
        agendamentoId: 'agend_001'
      },
      {
        nome: 'Serviço premium',
        barbeiroId: 'barbeiro_123',
        servicoId: 'servico_premium',
        valorServico: 80,
        agendamentoId: 'agend_002'
      },
      {
        nome: 'Serviço de baixo valor',
        barbeiroId: 'barbeiro_123',
        valorServico: 20,
        agendamentoId: 'agend_003'
      },
      {
        nome: 'Serviço de alto valor',
        barbeiroId: 'barbeiro_123',
        valorServico: 500,
        agendamentoId: 'agend_004'
      },
      {
        nome: 'Barbeiro 2',
        barbeiroId: 'barbeiro_456',
        valorServico: 40,
        agendamentoId: 'agend_005'
      }
    ]

    for (const cenario of cenarios) {
      try {
        console.log(`\n📊 Cenário: ${cenario.nome}`)
        console.log(`   Valor: ${formatCurrency(cenario.valorServico)}`)
        
        const comissao = await commissionService.calculateServiceCommission({
          barbeiroId: cenario.barbeiroId,
          servicoId: cenario.servicoId,
          valorServico: cenario.valorServico,
          agendamentoId: cenario.agendamentoId,
          dataTransacao: new Date().toISOString().split('T')[0]
        })
        
        console.log(`   Percentual: ${formatPercentage(comissao.percentualComissao)}`)
        console.log(`   Comissão: ${formatCurrency(comissao.valorComissao)}`)
        console.log(`   Status: ${comissao.status}`)
        
      } catch (error) {
        console.error(`❌ Erro no cenário ${cenario.nome}:`, error)
      }
    }
  }

  // Demo de processamento automático
  async demoAutomaticCommission(): Promise<void> {
    console.log('\n🤖 Simulando processamento automático de comissões...')
    
    // Simular transações de receita
    const transacoes = [
      {
        id: 'trans_001',
        tipo: 'RECEITA' as const,
        valor: 50,
        barbeiro_id: 'barbeiro_123',
        agendamento_id: 'agend_auto_001',
        data_transacao: '2024-01-15',
        status: 'CONFIRMADA' as const,
        descricao: 'Corte + Barba',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 'trans_002',
        tipo: 'RECEITA' as const,
        valor: 35,
        barbeiro_id: 'barbeiro_456',
        agendamento_id: 'agend_auto_002',
        data_transacao: '2024-01-15',
        status: 'CONFIRMADA' as const,
        descricao: 'Corte Masculino',
        created_at: '2024-01-15T11:00:00Z',
        updated_at: '2024-01-15T11:00:00Z'
      },
      {
        id: 'trans_003',
        tipo: 'DESPESA' as const, // Esta não deve gerar comissão
        valor: 100,
        barbeiro_id: 'barbeiro_123',
        agendamento_id: null,
        data_transacao: '2024-01-15',
        status: 'CONFIRMADA' as const,
        descricao: 'Material de limpeza',
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z'
      }
    ]

    for (const transacao of transacoes) {
      console.log(`\n💰 Processando transação: ${transacao.descricao}`)
      console.log(`   Tipo: ${transacao.tipo}`)
      console.log(`   Valor: ${formatCurrency(transacao.valor)}`)
      
      try {
        const comissao = await commissionService.processAutomaticCommission(transacao)
        
        if (comissao) {
          console.log(`✅ Comissão processada:`)
          console.log(`   Barbeiro: ${comissao.barbeiroId}`)
          console.log(`   Valor: ${formatCurrency(comissao.valorComissao)}`)
          console.log(`   Percentual: ${formatPercentage(comissao.percentualComissao)}`)
        } else {
          console.log('ℹ️  Nenhuma comissão gerada (normal para despesas)')
        }
        
      } catch (error) {
        console.error('❌ Erro no processamento automático:', error)
      }
    }
  }

  // Demo de relatórios
  async demoCommissionReports(): Promise<void> {
    console.log('\n📊 Gerando relatórios de comissões...')
    
    const periodo = {
      inicio: '2024-01-01',
      fim: '2024-01-31'
    }

    try {
      console.log(`📅 Período: ${periodo.inicio} a ${periodo.fim}`)
      
      // Relatório do barbeiro 123
      console.log('\n👤 Relatório - Barbeiro 123:')
      const relatorio123 = await commissionService.generateCommissionReport('barbeiro_123', periodo)
      
      console.log(`   Nome: ${relatorio123.barbeiroNome}`)
      console.log(`   Total Comissões: ${formatCurrency(relatorio123.totalComissoes)}`)
      console.log(`   Total Serviços: ${relatorio123.totalServicos}`)
      console.log(`   Ticket Médio: ${formatCurrency(relatorio123.ticketMedio)}`)
      console.log(`   Comissões Pagas: ${relatorio123.comissoesPagas}`)
      console.log(`   Comissões Pendentes: ${relatorio123.comissoesPendentes}`)
      
      // Relatório do barbeiro 456
      console.log('\n👤 Relatório - Barbeiro 456:')
      const relatorio456 = await commissionService.generateCommissionReport('barbeiro_456', periodo)
      
      console.log(`   Nome: ${relatorio456.barbeiroNome}`)
      console.log(`   Total Comissões: ${formatCurrency(relatorio456.totalComissoes)}`)
      console.log(`   Total Serviços: ${relatorio456.totalServicos}`)
      console.log(`   Ticket Médio: ${formatCurrency(relatorio456.ticketMedio)}`)
      
    } catch (error) {
      console.error('❌ Erro na geração de relatórios:', error)
    }
  }

  // Demo de ajustes de comissão
  async demoCommissionAdjustments(): Promise<void> {
    console.log('\n🔧 Aplicando ajustes de comissão...')
    
    const ajustes = [
      {
        agendamentoId: 'agend_auto_001',
        valorAjuste: 5,
        motivo: 'Bônus por excelente atendimento',
        tipo: 'BONUS' as const
      },
      {
        agendamentoId: 'agend_auto_002',
        valorAjuste: 2,
        motivo: 'Desconto por reclamação do cliente',
        tipo: 'DESCONTO' as const
      }
    ]

    for (const ajuste of ajustes) {
      try {
        console.log(`\n🔄 Aplicando ${ajuste.tipo.toLowerCase()}:`)
        console.log(`   Agendamento: ${ajuste.agendamentoId}`)
        console.log(`   Valor: ${formatCurrency(ajuste.valorAjuste)}`)
        console.log(`   Motivo: ${ajuste.motivo}`)
        
        const resultado = await commissionService.applyCommissionAdjustment(
          ajuste.agendamentoId,
          ajuste.valorAjuste,
          ajuste.motivo,
          ajuste.tipo,
          'admin_demo'
        )
        
        console.log(`✅ Ajuste aplicado:`)
        console.log(`   Valor Original: ${formatCurrency(resultado.valorOriginal)}`)
        console.log(`   Valor Ajustado: ${formatCurrency(resultado.valorAjustado)}`)
        console.log(`   Diferença: ${formatCurrency(resultado.valorAjustado - resultado.valorOriginal)}`)
        
      } catch (error) {
        console.error(`❌ Erro no ajuste ${ajuste.tipo}:`, error)
      }
    }
  }

  // Demo de validações
  async demoValidations(): Promise<void> {
    console.log('\n🔍 Testando validações de comissão...')
    
    const configsInvalidas = [
      {
        nome: 'Barbeiro ausente',
        config: { barbeiroId: '', percentual: 15 }
      },
      {
        nome: 'Percentual inválido',
        config: { barbeiroId: 'barbeiro_123', percentual: 150 }
      },
      {
        nome: 'Valor mínimo negativo',
        config: { barbeiroId: 'barbeiro_123', percentual: 15, valorMinimo: -5 }
      },
      {
        nome: 'Valor máximo menor que mínimo',
        config: { barbeiroId: 'barbeiro_123', percentual: 15, valorMinimo: 50, valorMaximo: 20 }
      }
    ]

    for (const teste of configsInvalidas) {
      console.log(`\n❌ Testando: ${teste.nome}`)
      const validacao = commissionService.validateCommissionConfig(teste.config as any)
      console.log(`   Válido: ${validacao.isValid}`)
      if (!validacao.isValid) {
        console.log(`   Erros: ${validacao.errors.join(', ')}`)
      }
    }

    // Teste de configuração válida
    console.log('\n✅ Testando configuração válida:')
    const configValida = {
      barbeiroId: 'barbeiro_123',
      percentual: 15,
      valorMinimo: 5,
      valorMaximo: 50
    }
    
    const validacaoValida = commissionService.validateCommissionConfig(configValida)
    console.log(`   Válido: ${validacaoValida.isValid}`)
    console.log(`   Erros: ${validacaoValida.errors.length}`)
  }

  // Demo de cancelamento de comissão
  async demoCancellation(): Promise<void> {
    console.log('\n❌ Testando cancelamento de comissão...')
    
    try {
      const agendamentoId = 'agend_auto_001'
      const motivo = 'Cliente cancelou o agendamento'
      
      console.log(`📅 Cancelando comissão do agendamento: ${agendamentoId}`)
      console.log(`📝 Motivo: ${motivo}`)
      
      await commissionService.cancelCommission(agendamentoId, motivo)
      
      console.log('✅ Comissão cancelada com sucesso')
      
    } catch (error) {
      console.error('❌ Erro no cancelamento:', error)
    }
  }

  // Demo interativa
  async runInteractiveDemo(): Promise<void> {
    console.log('🎮 Demo Interativa - Sistema de Comissões')
    console.log('=========================================')
    
    console.log('\nFuncionalidades disponíveis:')
    console.log('1. Configuração de comissões')
    console.log('2. Cálculo de comissões')
    console.log('3. Processamento automático')
    console.log('4. Relatórios')
    console.log('5. Ajustes de comissão')
    console.log('6. Validações')
    console.log('7. Cancelamentos')
    
    console.log('\n💡 Execute os métodos individualmente:')
    console.log('- demo.demoCommissionConfiguration()')
    console.log('- demo.demoCommissionCalculation()')
    console.log('- demo.demoAutomaticCommission()')
    console.log('- demo.demoCommissionReports()')
    console.log('- demo.demoCommissionAdjustments()')
    console.log('- demo.demoValidations()')
    console.log('- demo.demoCancellation()')
  }
}

// Instância singleton para uso
export const commissionDemo = new CommissionDemo()

// Função utilitária para executar demo rápida
export async function runQuickCommissionDemo(): Promise<void> {
  console.log('⚡ Executando demo rápida do sistema de comissões...')
  await commissionDemo.runCompleteDemo()
}

// Função para testar cálculo específico
export async function testCommissionCalculation(
  barbeiroId: string,
  valorServico: number,
  servicoId?: string
): Promise<void> {
  try {
    console.log('🧮 Testando cálculo de comissão:')
    console.log(`   Barbeiro: ${barbeiroId}`)
    console.log(`   Serviço: ${servicoId || 'Geral'}`)
    console.log(`   Valor: ${formatCurrency(valorServico)}`)
    
    const comissao = await commissionService.calculateServiceCommission({
      barbeiroId,
      servicoId,
      valorServico,
      agendamentoId: `test_${Date.now()}`,
      dataTransacao: new Date().toISOString().split('T')[0]
    })
    
    console.log('✅ Resultado:')
    console.log(`   Percentual: ${formatPercentage(comissao.percentualComissao)}`)
    console.log(`   Comissão: ${formatCurrency(comissao.valorComissao)}`)
    console.log(`   Valor Líquido: ${formatCurrency(comissao.valorLiquido)}`)
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}