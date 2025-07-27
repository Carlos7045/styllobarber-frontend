// Demonstração do sistema de gestão de despesas

import { expenseService } from '../services/expense-service'
import { categoryService } from '../services/category-service'
import { formatCurrency, formatDate } from '../utils'

// Classe para demonstrar funcionalidades de despesas
export class ExpenseDemo {
  // Demo completa do sistema de despesas
  async runCompleteDemo(): Promise<void> {
    console.log('💰 Iniciando demo do sistema de despesas...')
    
    try {
      // 1. Configurar categorias
      await this.demoCategoryManagement()
      
      // 2. Criar despesas variadas
      await this.demoExpenseCreation()
      
      // 3. Gerenciar despesas recorrentes
      await this.demoRecurringExpenses()
      
      // 4. Gerar relatórios
      await this.demoExpenseReports()
      
      // 5. Verificar alertas de orçamento
      await this.demoBudgetAlerts()
      
      // 6. Upload de comprovantes
      await this.demoReceiptManagement()
      
      console.log('\n🎉 Demo do sistema de despesas finalizada!')
      
    } catch (error) {
      console.error('❌ Erro na demo de despesas:', error)
    }
  }

  // Demo de gerenciamento de categorias
  async demoCategoryManagement(): Promise<void> {
    console.log('\n📂 Gerenciando categorias financeiras...')
    
    try {
      // Importar categorias padrão
      console.log('📥 Importando categorias padrão...')
      const importResult = await categoryService.importDefaultCategories()
      console.log(`✅ Importação concluída: ${importResult.created} criadas, ${importResult.skipped} ignoradas`)
      
      // Criar categoria personalizada
      console.log('\n📝 Criando categoria personalizada...')
      const customCategory = await categoryService.createCategory({
        nome: 'Manutenção de Equipamentos',
        tipo: 'DESPESA',
        cor: '#FF6B6B',
        orcamentoMensal: 800
      })
      console.log('✅ Categoria criada:', customCategory.nome)
      
      // Listar categorias de despesa
      console.log('\n📋 Listando categorias de despesa...')
      const categories = await categoryService.listCategories({ tipo: 'DESPESA', ativo: true })
      console.log(`✅ ${categories.length} categorias encontradas:`)
      categories.forEach(cat => {
        console.log(`   - ${cat.nome} (${cat.orcamento_mensal ? formatCurrency(cat.orcamento_mensal) : 'Sem orçamento'})`)
      })
      
      // Obter uso das categorias
      console.log('\n📊 Analisando uso das categorias...')
      const usage = await categoryService.getCategoryUsage()
      console.log('✅ Análise de uso:')
      usage.slice(0, 5).forEach(u => {
        console.log(`   - ${u.categoria_nome}: ${u.total_transacoes} transações, ${formatCurrency(u.valor_total)}`)
      })
      
    } catch (error) {
      console.error('❌ Erro no gerenciamento de categorias:', error)
    }
  }

  // Demo de criação de despesas
  async demoExpenseCreation(): Promise<void> {
    console.log('\n💸 Criando despesas variadas...')
    
    // Buscar categorias disponíveis
    const categories = await categoryService.listCategories({ tipo: 'DESPESA', ativo: true })
    if (categories.length === 0) {
      console.log('⚠️  Nenhuma categoria disponível')
      return
    }

    const despesasExemplo = [
      {
        descricao: 'Conta de energia elétrica - Janeiro',
        valor: 450.80,
        categoriaId: categories.find(c => c.nome.includes('Energia'))?.id || categories[0].id,
        dataDespesa: '2024-01-15',
        observacoes: 'Conta com aumento devido ao verão'
      },
      {
        descricao: 'Produtos de limpeza',
        valor: 120.50,
        categoriaId: categories.find(c => c.nome.includes('Limpeza'))?.id || categories[0].id,
        dataDespesa: '2024-01-10',
        observacoes: 'Compra mensal de produtos de limpeza'
      },
      {
        descricao: 'Aluguel do salão',
        valor: 2800.00,
        categoriaId: categories.find(c => c.nome.includes('Aluguel'))?.id || categories[0].id,
        dataDespesa: '2024-01-05',
        recorrente: true,
        frequencia: 'MENSAL' as const,
        observacoes: 'Aluguel mensal do espaço'
      },
      {
        descricao: 'Manutenção da máquina de corte',
        valor: 180.00,
        categoriaId: categories.find(c => c.nome.includes('Equipamento') || c.nome.includes('Manutenção'))?.id || categories[0].id,
        dataDespesa: '2024-01-12',
        observacoes: 'Revisão e troca de peças'
      },
      {
        descricao: 'Campanha no Instagram',
        valor: 300.00,
        categoriaId: categories.find(c => c.nome.includes('Marketing'))?.id || categories[0].id,
        dataDespesa: '2024-01-08',
        observacoes: 'Impulsionamento de posts promocionais'
      }
    ]

    for (const despesaData of despesasExemplo) {
      try {
        console.log(`\n💳 Criando despesa: ${despesaData.descricao}`)
        console.log(`   Valor: ${formatCurrency(despesaData.valor)}`)
        console.log(`   Data: ${formatDate(despesaData.dataDespesa)}`)
        
        const despesa = await expenseService.createExpense(despesaData)
        console.log(`✅ Despesa criada: ${despesa.id}`)
        
        if (despesa.recorrente) {
          console.log(`   🔄 Despesa recorrente (${despesa.frequencia})`)
        }
        
      } catch (error) {
        console.error(`❌ Erro ao criar despesa ${despesaData.descricao}:`, error)
      }
    }
  }

  // Demo de despesas recorrentes
  async demoRecurringExpenses(): Promise<void> {
    console.log('\n🔄 Processando despesas recorrentes...')
    
    try {
      const result = await expenseService.processRecurringExpenses()
      
      console.log(`📊 Processamento concluído:`)
      console.log(`   - Despesas processadas: ${result.processed}`)
      console.log(`   - Novas despesas criadas: ${result.created.length}`)
      console.log(`   - Erros: ${result.errors.length}`)
      
      if (result.created.length > 0) {
        console.log('\n✅ Despesas recorrentes criadas:')
        result.created.forEach(despesa => {
          console.log(`   - ${despesa.descricao}: ${formatCurrency(despesa.valor)} (${formatDate(despesa.data_despesa)})`)
        })
      }
      
      if (result.errors.length > 0) {
        console.log('\n❌ Erros no processamento:')
        result.errors.forEach(error => console.log(`   - ${error}`))
      }
      
    } catch (error) {
      console.error('❌ Erro no processamento de despesas recorrentes:', error)
    }
  }

  // Demo de relatórios de despesas
  async demoExpenseReports(): Promise<void> {
    console.log('\n📊 Gerando relatórios de despesas...')
    
    try {
      const periodo = {
        inicio: '2024-01-01',
        fim: '2024-01-31'
      }
      
      console.log(`📅 Período: ${formatDate(periodo.inicio)} a ${formatDate(periodo.fim)}`)
      
      const report = await expenseService.generateExpenseReport(periodo)
      
      console.log('\n📈 Resumo do Relatório:')
      console.log(`   Total de Despesas: ${formatCurrency(report.totalDespesas)}`)
      console.log(`   Número de Despesas: ${report.numeroDespesas}`)
      console.log(`   Despesa Média: ${formatCurrency(report.despesaMedia)}`)
      console.log(`   Despesas Recorrentes: ${report.despesasRecorrentes}`)
      console.log(`   Despesas Avulsas: ${report.despesasAvulsas}`)
      
      console.log('\n📂 Despesas por Categoria:')
      report.categorias.forEach(categoria => {
        console.log(`   - ${categoria.nome}: ${formatCurrency(categoria.totalGasto)}`)
        if (categoria.orcamentoMensal && categoria.percentualOrcamento) {
          console.log(`     Orçamento: ${formatCurrency(categoria.orcamentoMensal)} (${categoria.percentualOrcamento.toFixed(1)}% usado)`)
        }
        console.log(`     Número de despesas: ${categoria.numeroDespesas}`)
      })
      
      if (report.evolucaoMensal.length > 0) {
        console.log('\n📈 Evolução Mensal:')
        report.evolucaoMensal.forEach(mes => {
          console.log(`   - ${mes.mes}: ${formatCurrency(mes.valor)}`)
        })
      }
      
    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error)
    }
  }

  // Demo de alertas de orçamento
  async demoBudgetAlerts(): Promise<void> {
    console.log('\n🚨 Verificando alertas de orçamento...')
    
    try {
      const alerts = await expenseService.checkBudgetAlerts()
      
      if (alerts.length === 0) {
        console.log('✅ Nenhum alerta de orçamento encontrado')
        return
      }
      
      console.log(`⚠️  ${alerts.length} alerta${alerts.length !== 1 ? 's' : ''} encontrado${alerts.length !== 1 ? 's' : ''}:`)
      
      alerts.forEach(alert => {
        const statusIcon = {
          'ATENCAO': '⚠️ ',
          'EXCEDIDO': '🚨',
          'OK': '✅'
        }[alert.status]
        
        console.log(`\n${statusIcon} ${alert.categoriaNome}:`)
        console.log(`   Orçamento Mensal: ${formatCurrency(alert.orcamentoMensal)}`)
        console.log(`   Gasto Atual: ${formatCurrency(alert.gastoAtual)}`)
        console.log(`   Percentual Usado: ${alert.percentualGasto.toFixed(1)}%`)
        console.log(`   Dias Restantes: ${alert.diasRestantes}`)
        
        if (alert.status === 'EXCEDIDO') {
          const excesso = alert.gastoAtual - alert.orcamentoMensal
          console.log(`   💸 Excesso: ${formatCurrency(excesso)}`)
        }
      })
      
    } catch (error) {
      console.error('❌ Erro ao verificar alertas:', error)
    }
  }

  // Demo de gerenciamento de comprovantes
  async demoReceiptManagement(): Promise<void> {
    console.log('\n📎 Gerenciando comprovantes...')
    
    try {
      // Buscar uma despesa para adicionar comprovante
      const expenses = await expenseService.listExpenses({ limit: 1 })
      
      if (expenses.despesas.length === 0) {
        console.log('⚠️  Nenhuma despesa encontrada para adicionar comprovante')
        return
      }
      
      const expense = expenses.despesas[0]
      console.log(`📄 Adicionando comprovante à despesa: ${expense.descricao}`)
      
      // Simular upload de comprovante
      const fakeReceiptUrl = `uploads/receipts/${expense.id}/comprovante_${Date.now()}.pdf`
      await expenseService.uploadReceipt(expense.id, fakeReceiptUrl)
      console.log(`✅ Comprovante adicionado: ${fakeReceiptUrl}`)
      
      // Buscar despesa atualizada
      const updatedExpense = await expenseService.getExpense(expense.id)
      if (updatedExpense) {
        console.log(`📋 Comprovantes da despesa: ${updatedExpense.comprovantes?.length || 0}`)
        updatedExpense.comprovantes?.forEach((receipt, index) => {
          console.log(`   ${index + 1}. ${receipt}`)
        })
      }
      
      // Simular remoção de comprovante
      if (updatedExpense?.comprovantes && updatedExpense.comprovantes.length > 0) {
        console.log('\n🗑️  Removendo comprovante...')
        await expenseService.removeReceipt(expense.id, updatedExpense.comprovantes[0])
        console.log('✅ Comprovante removido')
      }
      
    } catch (error) {
      console.error('❌ Erro no gerenciamento de comprovantes:', error)
    }
  }

  // Demo de validações
  async demoValidations(): Promise<void> {
    console.log('\n🔍 Testando validações...')
    
    const invalidExpenses = [
      {
        nome: 'Descrição muito curta',
        data: { descricao: 'AB', valor: 100, categoriaId: 'cat_123', dataDespesa: '2024-01-01' }
      },
      {
        nome: 'Valor inválido',
        data: { descricao: 'Despesa teste', valor: -50, categoriaId: 'cat_123', dataDespesa: '2024-01-01' }
      },
      {
        nome: 'Categoria ausente',
        data: { descricao: 'Despesa teste', valor: 100, categoriaId: '', dataDespesa: '2024-01-01' }
      },
      {
        nome: 'Recorrente sem frequência',
        data: { descricao: 'Despesa teste', valor: 100, categoriaId: 'cat_123', dataDespesa: '2024-01-01', recorrente: true }
      }
    ]

    for (const teste of invalidExpenses) {
      console.log(`\n❌ Testando: ${teste.nome}`)
      const validation = expenseService.validateExpenseData(teste.data as any)
      console.log(`   Válido: ${validation.isValid}`)
      if (!validation.isValid) {
        console.log(`   Erros: ${validation.errors.join(', ')}`)
      }
    }

    // Teste de dados válidos
    console.log('\n✅ Testando dados válidos:')
    const validData = {
      descricao: 'Despesa de teste válida',
      valor: 150.50,
      categoriaId: 'cat_123',
      dataDespesa: '2024-01-15',
      recorrente: true,
      frequencia: 'MENSAL' as const
    }
    
    const validValidation = expenseService.validateExpenseData(validData)
    console.log(`   Válido: ${validValidation.isValid}`)
    console.log(`   Erros: ${validValidation.errors.length}`)
  }

  // Demo de análise de orçamento
  async demoBudgetAnalysis(): Promise<void> {
    console.log('\n📊 Analisando orçamentos por categoria...')
    
    try {
      const analysis = await categoryService.getBudgetAnalysis()
      
      if (analysis.length === 0) {
        console.log('ℹ️  Nenhuma categoria com orçamento configurado')
        return
      }
      
      console.log(`📈 Análise de ${analysis.length} categoria${analysis.length !== 1 ? 's' : ''}:`)
      
      analysis.forEach(cat => {
        console.log(`\n📂 ${cat.categoriaNome}:`)
        console.log(`   Orçamento: ${formatCurrency(cat.orcamentoMensal)}`)
        console.log(`   Gasto Atual: ${formatCurrency(cat.gastoAtual)} (${cat.percentualAtual.toFixed(1)}%)`)
        console.log(`   Gasto Anterior: ${formatCurrency(cat.gastoAnterior)} (${cat.percentualAnterior.toFixed(1)}%)`)
        console.log(`   Tendência: ${cat.tendencia}`)
        console.log(`   Projeção do Mês: ${formatCurrency(cat.projecaoMes)}`)
        console.log(`   Média Diária: ${formatCurrency(cat.mediaGastoDiario)}`)
        console.log(`   Dias Restantes: ${cat.diasRestantes}`)
        
        if (cat.projecaoMes > cat.orcamentoMensal) {
          const excesso = cat.projecaoMes - cat.orcamentoMensal
          console.log(`   ⚠️  Projeção excede orçamento em ${formatCurrency(excesso)}`)
        }
      })
      
    } catch (error) {
      console.error('❌ Erro na análise de orçamento:', error)
    }
  }

  // Demo interativa
  async runInteractiveDemo(): Promise<void> {
    console.log('🎮 Demo Interativa - Sistema de Despesas')
    console.log('======================================')
    
    console.log('\nFuncionalidades disponíveis:')
    console.log('1. Gerenciamento de categorias')
    console.log('2. Criação de despesas')
    console.log('3. Despesas recorrentes')
    console.log('4. Relatórios de despesas')
    console.log('5. Alertas de orçamento')
    console.log('6. Gerenciamento de comprovantes')
    console.log('7. Validações')
    console.log('8. Análise de orçamento')
    
    console.log('\n💡 Execute os métodos individualmente:')
    console.log('- demo.demoCategoryManagement()')
    console.log('- demo.demoExpenseCreation()')
    console.log('- demo.demoRecurringExpenses()')
    console.log('- demo.demoExpenseReports()')
    console.log('- demo.demoBudgetAlerts()')
    console.log('- demo.demoReceiptManagement()')
    console.log('- demo.demoValidations()')
    console.log('- demo.demoBudgetAnalysis()')
  }
}

// Instância singleton para uso
export const expenseDemo = new ExpenseDemo()

// Função utilitária para executar demo rápida
export async function runQuickExpenseDemo(): Promise<void> {
  console.log('⚡ Executando demo rápida do sistema de despesas...')
  await expenseDemo.runCompleteDemo()
}

// Função para testar criação de despesa específica
export async function testExpenseCreation(
  descricao: string,
  valor: number,
  categoriaId: string
): Promise<void> {
  try {
    console.log('💸 Testando criação de despesa:')
    console.log(`   Descrição: ${descricao}`)
    console.log(`   Valor: ${formatCurrency(valor)}`)
    console.log(`   Categoria: ${categoriaId}`)
    
    const despesa = await expenseService.createExpense({
      descricao,
      valor,
      categoriaId,
      dataDespesa: new Date().toISOString().split('T')[0]
    })
    
    console.log('✅ Despesa criada:')
    console.log(`   ID: ${despesa.id}`)
    console.log(`   Data: ${formatDate(despesa.data_despesa)}`)
    console.log(`   Recorrente: ${despesa.recorrente ? 'Sim' : 'Não'}`)
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}

// Função para testar processamento de recorrentes
export async function testRecurringProcessing(): Promise<void> {
  try {
    console.log('🔄 Testando processamento de despesas recorrentes...')
    
    const result = await expenseService.processRecurringExpenses()
    
    console.log('✅ Resultado:')
    console.log(`   Processadas: ${result.processed}`)
    console.log(`   Criadas: ${result.created.length}`)
    console.log(`   Erros: ${result.errors.length}`)
    
    if (result.created.length > 0) {
      console.log('\n📋 Despesas criadas:')
      result.created.forEach(despesa => {
        console.log(`   - ${despesa.descricao}: ${formatCurrency(despesa.valor)}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}