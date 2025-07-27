// Demonstração do sistema de relatórios com dados mockados
'use client'

import { useEffect } from 'react'
import { ReportsCenter } from '../components/ReportsCenter'
import { ReceitasReport } from '../components/ReceitasReport'
import { ReportsServiceSimple } from '../services/reports-service-simple'
import type { 
  RelatorioReceitas,
  RelatorioDespesas,
  RelatorioComissoes,
  DREData
} from '../types'

// Dados mockados para relatórios
const mockRelatorioReceitas = {
  dados: [
    {
      id: '1',
      data: '2024-01-15',
      cliente: 'João Silva',
      barbeiro: 'Pedro Santos',
      servico: 'Corte + Barba',
      valor: 45.00,
      metodoPagamento: 'PIX',
      status: 'CONFIRMADA',
      comissao: 13.50
    },
    {
      id: '2',
      data: '2024-01-15',
      cliente: 'Carlos Lima',
      barbeiro: 'João Silva',
      servico: 'Corte Masculino',
      valor: 30.00,
      metodoPagamento: 'Dinheiro',
      status: 'CONFIRMADA',
      comissao: 9.00
    },
    {
      id: '3',
      data: '2024-01-14',
      cliente: 'Rafael Costa',
      barbeiro: 'Pedro Santos',
      servico: 'Barba',
      valor: 20.00,
      metodoPagamento: 'Cartão',
      status: 'CONFIRMADA',
      comissao: 6.00
    },
    {
      id: '4',
      data: '2024-01-14',
      cliente: 'Lucas Oliveira',
      barbeiro: 'João Silva',
      servico: 'Corte + Barba',
      valor: 45.00,
      metodoPagamento: 'PIX',
      status: 'PENDENTE',
      comissao: 0
    },
    {
      id: '5',
      data: '2024-01-13',
      cliente: 'André Souza',
      barbeiro: 'Carlos Oliveira',
      servico: 'Sobrancelha',
      valor: 15.00,
      metodoPagamento: 'Dinheiro',
      status: 'CONFIRMADA',
      comissao: 4.50
    }
  ] as RelatorioReceitas[],
  resumo: {
    totalReceitas: 155.00,
    numeroTransacoes: 5,
    ticketMedio: 31.00,
    receitaPorBarbeiro: {
      'Pedro Santos': 65.00,
      'João Silva': 75.00,
      'Carlos Oliveira': 15.00
    },
    receitaPorMetodo: {
      'PIX': 90.00,
      'Dinheiro': 45.00,
      'Cartão': 20.00
    }
  }
}

const mockRelatorioDespesas = {
  dados: [
    {
      id: '1',
      data: '2024-01-15',
      categoria: 'Aluguel',
      descricao: 'Aluguel do salão - Janeiro 2024',
      valor: 1500.00,
      comprovante: 'comprovante-aluguel-jan.pdf',
      recorrente: true
    },
    {
      id: '2',
      data: '2024-01-10',
      categoria: 'Produtos',
      descricao: 'Shampoo e condicionador profissional',
      valor: 280.00,
      comprovante: 'nota-produtos-jan.pdf',
      recorrente: false
    },
    {
      id: '3',
      data: '2024-01-08',
      categoria: 'Energia Elétrica',
      descricao: 'Conta de luz - Dezembro 2023',
      valor: 320.00,
      comprovante: 'conta-luz-dez.pdf',
      recorrente: true
    }
  ] as RelatorioDespesas[],
  resumo: {
    totalDespesas: 2100.00,
    numeroDespesas: 3,
    despesaMedia: 700.00,
    despesasPorCategoria: {
      'Aluguel': { total: 1500.00, quantidade: 1 },
      'Produtos': { total: 280.00, quantidade: 1 },
      'Energia Elétrica': { total: 320.00, quantidade: 1 }
    },
    despesasRecorrentes: 2
  }
}

const mockRelatorioComissoes = {
  dados: [
    {
      id: '1',
      barbeiro: 'Pedro Santos',
      periodo: '01/01/2024 - 31/01/2024',
      servicosRealizados: 25,
      receitaGerada: 1125.00,
      percentualComissao: 30,
      valorComissao: 337.50,
      valorPago: 337.50,
      saldoPendente: 0
    },
    {
      id: '2',
      barbeiro: 'João Silva',
      periodo: '01/01/2024 - 31/01/2024',
      servicosRealizados: 20,
      receitaGerada: 900.00,
      percentualComissao: 30,
      valorComissao: 270.00,
      valorPago: 200.00,
      saldoPendente: 70.00
    },
    {
      id: '3',
      barbeiro: 'Carlos Oliveira',
      periodo: '01/01/2024 - 31/01/2024',
      servicosRealizados: 15,
      receitaGerada: 675.00,
      percentualComissao: 25,
      valorComissao: 168.75,
      valorPago: 168.75,
      saldoPendente: 0
    }
  ] as RelatorioComissoes[],
  resumo: {
    totalComissoes: 776.25,
    comissoesPagas: 706.25,
    comissoesPendentes: 70.00,
    numeroServicos: 60
  }
}

const mockDRE: DREData = {
  receitaOperacional: 15000.00,
  custosVariaveis: 4500.00, // Comissões
  margemContribuicao: 10500.00,
  despesasFixas: 3200.00,
  ebitda: 7300.00,
  depreciacoes: 200.00,
  lucroOperacional: 7100.00,
  lucroLiquido: 7100.00
}

// Mock do serviço de relatórios usando o serviço simplificado
export const mockReportsService = () => {
  // Não precisa fazer nada, o ReportsServiceSimple já tem dados mockados
  return () => {
    // Função vazia para manter compatibilidade
  }
}

// Componente de demonstração do centro de relatórios
export const ReportsCenterDemo = () => {
  useEffect(() => {
    const restoreMocks = mockReportsService()
    return restoreMocks
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sistema de Relatórios - Demonstração
          </h1>
          <p className="text-gray-600">
            Demonstração do sistema de relatórios financeiros com dados mockados.
          </p>
        </div>

        <ReportsCenter />
      </div>
    </div>
  )
}

// Componente de demonstração do relatório de receitas
export const ReceitasReportDemo = () => {
  useEffect(() => {
    const restoreMocks = mockReportsService()
    return restoreMocks
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Relatório de Receitas - Demonstração
          </h1>
          <p className="text-gray-600">
            Demonstração do relatório de receitas com dados mockados.
          </p>
        </div>

        <ReceitasReport 
          showFilters={true}
          autoLoad={true}
        />
      </div>
    </div>
  )
}

export default ReportsCenterDemo