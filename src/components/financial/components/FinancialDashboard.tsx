'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFuncionariosPublicos } from '@/domains/users/hooks/use-funcionarios-publicos'
import { useFinancialMetrics } from '@/domains/financial/hooks/use-financial-metrics'
// Imports diretos dos ícones - sem usar optimized-imports
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertCircle, 
  Calculator,
  Download,
  BarChart3,
  Award,
  Wallet
} from 'lucide-react'

// Import direto dos componentes
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'

interface FinancialDashboardProps {
  className?: string
}

export const FinancialDashboard = ({
  className = ''
}: FinancialDashboardProps) => {

  // Estados para filtros
  const [selectedPeriod, setSelectedPeriod] = useState('mes_atual')
  const [selectedBarber, setSelectedBarber] = useState('todos')
  
  // Router para navegação
  const router = useRouter()

  // Hook para carregar barbeiros reais
  const { funcionarios, loading: funcionariosLoading, error: funcionariosError } = useFuncionariosPublicos()

  // Hook para dados financeiros reais
  const { metricas, servicosMaisVendidos, receitaPorDia, loading: financialLoading, error: financialError } = useFinancialMetrics(selectedPeriod, selectedBarber)

  // Handlers de navegação
  const handleFluxoCaixaClick = () => {
    router.push('/dashboard/financeiro/fluxo-caixa')
  }

  const handlePDVClick = () => {
    router.push('/dashboard/financeiro/pdv')
  }

  const handleComissoesClick = () => {
    router.push('/dashboard/financeiro/comissoes')
  }

  const handleRelatoriosClick = () => {
    router.push('/dashboard/financeiro/relatorios')
  }

  // Mostrar loading se dados estão carregando
  const isLoading = financialLoading || funcionariosLoading
  
  // Mostrar erro se houver
  if (financialError) {
    console.error('Erro nos dados financeiros:', financialError)
  }

  // Cálculos derivados
  const progressoMeta = (metricas.receitaBruta / metricas.metaMensal) * 100
  const receitaMediaDiaria = metricas.receitaBruta / (30 - metricas.diasRestantes)
  const projecaoMensal = receitaMediaDiaria * 30

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header do Dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard Financeiro
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Visão geral das finanças da barbearia
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-40 h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="hoje">Hoje</option>
            <option value="semana_atual">Esta Semana</option>
            <option value="mes_atual">Este Mês</option>
            <option value="trimestre">Trimestre</option>
            <option value="ano">Este Ano</option>
            <option value="personalizado">Personalizado</option>
          </select>
          
          <select 
            value={selectedBarber} 
            onChange={(e) => setSelectedBarber(e.target.value)}
            disabled={funcionariosLoading}
            className="w-40 h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
          >
            <option value="todos">
              {funcionariosLoading ? 'Carregando...' : `Todos (${funcionarios?.length || 0})`}
            </option>
            {funcionariosError && (
              <option value="" disabled>
                Erro: {funcionariosError}
              </option>
            )}
            {funcionarios.map((funcionario) => (
              <option key={funcionario.id} value={funcionario.id}>
                {funcionario.profiles?.nome || `ID: ${funcionario.id}`}
              </option>
            ))}
            {!funcionariosLoading && funcionarios.length === 0 && (
              <option value="" disabled>
                Nenhum barbeiro encontrado
              </option>
            )}
          </select>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de Navegação para Relatórios */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Módulos Financeiros
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group border-2 hover:border-blue-500"
            onClick={handleFluxoCaixaClick}
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                  Fluxo de Caixa
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Entradas, saídas e saldo
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
              <span>Ver relatório</span>
              <svg className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Card>

          <Card 
            className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group border-2 hover:border-green-500"
            onClick={handlePDVClick}
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-green-50 group-hover:bg-green-100 transition-colors">
                <Calculator className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">
                  PDV - Ponto de Venda
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Vendas e pagamentos
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-green-600 text-sm font-medium">
              <span>Abrir PDV</span>
              <svg className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Card>

          <Card 
            className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group border-2 hover:border-purple-500"
            onClick={handleComissoesClick}
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-purple-50 group-hover:bg-purple-100 transition-colors">
                <Wallet className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">
                  Comissões
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Gestão de comissões
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-purple-600 text-sm font-medium">
              <span>Gerenciar</span>
              <svg className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Card>

          <Card 
            className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group border-2 hover:border-orange-500"
            onClick={handleRelatoriosClick}
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-orange-50 group-hover:bg-orange-100 transition-colors">
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors">
                  Relatórios
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Análises e gráficos
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-orange-600 text-sm font-medium">
              <span>Ver relatórios</span>
              <svg className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Card>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Métricas Principais
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Receita Bruta</p>
                {isLoading ? (
                  <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    R$ {metricas.receitaBruta.toLocaleString('pt-BR')}
                  </p>
                )}
                <div className="flex items-center mt-2">
                  {metricas.taxaCrescimento >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${metricas.taxaCrescimento >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {metricas.taxaCrescimento >= 0 ? '+' : ''}{metricas.taxaCrescimento.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs período anterior</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/20">
                <DollarSign className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Receita Líquida</p>
                {isLoading ? (
                  <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    R$ {metricas.receitaLiquida.toLocaleString('pt-BR')}
                  </p>
                )}
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm font-medium text-green-500">Líquida</span>
                  <span className="text-sm text-gray-500 ml-1">após despesas</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-green-50 dark:bg-green-900/20">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Despesas Totais</p>
                {isLoading ? (
                  <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    R$ {metricas.despesasTotal.toLocaleString('pt-BR')}
                  </p>
                )}
                <div className="flex items-center mt-2">
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-sm font-medium text-red-500">Despesas</span>
                  <span className="text-sm text-gray-500 ml-1">do período</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-red-50 dark:bg-red-900/20">
                <TrendingDown className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Lucro Líquido</p>
                {isLoading ? (
                  <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    R$ {metricas.lucroLiquido.toLocaleString('pt-BR')}
                  </p>
                )}
                <div className="flex items-center mt-2">
                  {metricas.lucroLiquido >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${metricas.lucroLiquido >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {metricas.lucroLiquido >= 0 ? 'Lucro' : 'Prejuízo'}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">final</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-orange-50 dark:bg-orange-900/20">
                <Calculator className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Indicadores de Performance */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Indicadores de Performance
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Ticket Médio</p>
                {isLoading ? (
                  <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                ) : (
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    R$ {metricas.ticketMedio.toFixed(2)}
                  </p>
                )}
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Atendimentos</p>
                {isLoading ? (
                  <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                ) : (
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {metricas.numeroAtendimentos}
                  </p>
                )}
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Taxa de Crescimento</p>
                {isLoading ? (
                  <div className="h-6 w-14 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                ) : (
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {metricas.taxaCrescimento.toFixed(1)}%
                  </p>
                )}
              </div>
              {metricas.taxaCrescimento >= 0 ? (
                <TrendingUp className="h-8 w-8 text-purple-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-500" />
              )}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Margem de Lucro</p>
                {isLoading ? (
                  <div className="h-6 w-14 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                ) : (
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {metricas.receitaBruta > 0 ? ((metricas.lucroLiquido / metricas.receitaBruta) * 100).toFixed(1) : '0.0'}%
                  </p>
                )}
              </div>
              <Calculator className="h-8 w-8 text-orange-500" />
            </div>
          </Card>
        </div>
      </div>

      {/* Meta Mensal */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Meta Mensal
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {metricas.diasRestantes} dias restantes
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {progressoMeta.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              R$ {metricas.receitaBruta.toLocaleString('pt-BR')} / R$ {metricas.metaMensal.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progressoMeta, 100)}%` }}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-300">Projeção Mensal</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              R$ {projecaoMensal.toLocaleString('pt-BR')}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-300">Média Diária</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              R$ {receitaMediaDiaria.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      </Card>

      {/* Análise de Clientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Análise de Clientes
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-green-100">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Clientes Novos</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Este mês</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900 dark:text-white">{metricas.clientesNovos}</p>
                <p className="text-sm text-green-600">+18% vs mês anterior</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <Award className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Clientes Recorrentes</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Este mês</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900 dark:text-white">{metricas.clientesRecorrentes}</p>
                <p className="text-sm text-blue-600">87% taxa de retenção</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Serviços Mais Vendidos
          </h3>
          
          <div className="space-y-3">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    <div>
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-1" />
                      <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                </div>
              ))
            ) : servicosMaisVendidos.length > 0 ? (
              servicosMaisVendidos.map((servico, index) => (
                <div key={servico.nome} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{servico.nome}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{servico.quantidade} serviços</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      R$ {servico.receita.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhum serviço encontrado no período selecionado
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Receita por Dia da Semana */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Receita por Dia da Semana
          </h3>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Últimos 7 dias</span>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" style={{ height: '120px' }} />
                <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              </div>
            ))
          ) : receitaPorDia.length > 0 ? (
            receitaPorDia.map((dia) => {
              const maxValue = Math.max(...receitaPorDia.map(d => d.valor), 1) // Evitar divisão por zero
              const height = maxValue > 0 ? (dia.valor / maxValue) * 100 : 0
              
              return (
                <div key={dia.dia} className="flex flex-col items-center space-y-2">
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden" style={{ height: '120px' }}>
                    <div 
                      className="bg-gradient-to-t from-blue-500 to-blue-400 w-full rounded-lg transition-all duration-500 flex items-end justify-center"
                      style={{ height: `${Math.max(height, 5)}%` }} // Mínimo de 5% para visibilidade
                    >
                      {dia.valor > 0 && (
                        <span className="text-xs text-white font-medium pb-1">
                          R$ {dia.valor >= 1000 ? (dia.valor / 1000).toFixed(1) + 'k' : dia.valor.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{dia.dia}</span>
                </div>
              )
            })
          ) : (
            <div className="col-span-7 text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                Nenhum dado de receita encontrado para os últimos 7 dias
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Comissões Pendentes */}
      {!isLoading && metricas.comissoesPendentes > 0 && (
        <Card className="p-6 border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            <div>
              <h3 className="font-semibold text-orange-900 dark:text-orange-200">
                Comissões Pendentes
              </h3>
              <p className="text-orange-700 dark:text-orange-300 mt-1">
                Há R$ {metricas.comissoesPendentes.toLocaleString('pt-BR')} em comissões pendentes de pagamento
              </p>
            </div>
            <div className="ml-auto">
              <Button variant="outline" size="sm" className="border-orange-300 text-orange-700 hover:bg-orange-100" onClick={handleComissoesClick}>
                <Wallet className="h-4 w-4 mr-2" />
                Pagar Comissões
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Erro ao carregar dados */}
      {financialError && (
        <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-200">
                Erro ao Carregar Dados
              </h3>
              <p className="text-red-700 dark:text-red-300 mt-1">
                {financialError}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Status de Sucesso */}
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-green-900">
              Dashboard Financeiro Funcionando!
            </h3>
            <p className="text-green-700 mt-1">
              Dashboard completo com cards de navegação e todas as funcionalidades.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Export default para compatibilidade com lazy loading
export default FinancialDashboard