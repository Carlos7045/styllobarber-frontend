'use client'

import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/use-permissions'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Container } from '@/components/layout'
import { FullPageLoading } from '@/components/auth/AuthLoadingState'
import { useDashboardData, useBarberDashboardData } from '@/hooks/use-dashboard-data'
import { formatarMoeda } from '@/lib/utils'

// Dashboard principal - Redireciona baseado no role do usuário
export default function DashboardRedirect() {
  const { profile, user, loading, hasRole, hasPermission } = useAuth()
  const permissions = usePermissions()
  const router = useRouter()

  // Debug temporário - remover em produção
  useEffect(() => {
    if (profile && process.env.NODE_ENV === 'development') {
      console.log('🔐 Dashboard - Debug de Permissões:', {
        profile,
        hasRole: typeof hasRole,
        hasPermission: typeof hasPermission,
        permissions,
        isAdmin: hasRole('admin'),
        canManageUsers: hasPermission('manage_users'),
      })
    }
  }, [profile, hasRole, hasPermission, permissions])

  useEffect(() => {
    if (loading) return // Aguardar carregar

    const userRole = profile?.role || user?.user_metadata?.role || 'client'

    // console.log('🔄 Redirecionando usuário baseado no role:', userRole)

    // Redirecionar baseado no role
    switch (userRole) {
      case 'saas_owner':
        // console.log('👑 SaaS Owner → /saas-admin')
        router.replace('/saas-admin')
        break

      case 'admin':
      case 'barber':
        // console.log('👨‍💼 Admin/Barbeiro → Dashboard administrativo')
        // Manter na mesma página, mas mostrar dashboard administrativo
        break

      case 'client':
        // console.log('👥 Cliente → /dashboard/agendamentos')
        router.replace('/dashboard/agendamentos')
        break

      default:
        // console.log('❓ Role desconhecido, redirecionando para agendamentos')
        router.replace('/dashboard/agendamentos')
    }
  }, [profile, user, loading, router])

  // Mostrar loading enquanto carrega ou redireciona
  if (loading) {
    return <FullPageLoading message="Carregando dashboard..." />
  }

  const userRole = profile?.role || user?.user_metadata?.role || 'client'

  // Se é admin ou barber, mostrar dashboard administrativo
  if (userRole === 'admin' || userRole === 'barber') {
    return <AdminBarberDashboard userRole={userRole} profile={profile} />
  }

  // Para outros casos, mostrar loading (enquanto redireciona)
  return <FullPageLoading message="Redirecionando..." />
}

// Componente do Dashboard para Admin e Barbeiro
function AdminBarberDashboard({
  userRole,
  profile,
}: {
  userRole: string
  profile: Record<string, unknown>
}) {
  // Usar hook de dados reais - diferente para admin e barbeiro
  const dashboardData = useDashboardData()
  const barberData = useBarberDashboardData(profile?.id as string)

  // Debug: verificar dados
  console.log('AdminBarberDashboard - userRole:', userRole)
  console.log('AdminBarberDashboard - profile.id:', profile?.id)
  console.log('AdminBarberDashboard - barberData:', barberData)

  // Selecionar dados baseado no papel do usuário
  const isBarber = userRole === 'barber'
  const currentData = isBarber ? barberData : dashboardData

  const metrics = isBarber
    ? [
        // Métricas específicas do barbeiro
        {
          title: 'Agendamentos Hoje',
          value: barberData.loading ? '...' : barberData.agendaHoje.length.toString(),
          change: 'Seus agendamentos',
          icon: '📅',
          color: 'text-amber-500',
          error: barberData.error,
        },
        {
          title: 'Clientes Ativos',
          value: barberData.loading ? '...' : '0', // Será implementado no hook
          change: 'Seus clientes',
          icon: '👥',
          color: 'text-blue-500',
          error: barberData.error,
        },
        {
          title: 'Receita Hoje',
          value: barberData.loading ? '...' : formatarMoeda(barberData.ganhos.hoje),
          change: 'Seus serviços',
          icon: '💰',
          color: 'text-green-500',
          error: barberData.error,
        },
        {
          title: 'Receita Semana',
          value: barberData.loading ? '...' : formatarMoeda(barberData.ganhos.semana),
          change: 'Esta semana',
          icon: '📊',
          color: 'text-purple-500',
          error: barberData.error,
        },
      ]
    : [
        // Métricas para admin (dados gerais da barbearia)
        {
          title: 'Agendamentos Hoje',
          value: dashboardData.loading ? '...' : dashboardData.agendamentosHoje.toString(),
          change: 'Agendamentos confirmados',
          icon: '📅',
          color: 'text-amber-500',
          error: dashboardData.error,
        },
        {
          title: 'Clientes Ativos',
          value: dashboardData.loading ? '...' : dashboardData.clientesAtivos.toString(),
          change: 'Base de clientes',
          icon: '👥',
          color: 'text-blue-500',
          error: dashboardData.error,
        },
        {
          title: 'Receita Hoje',
          value: dashboardData.loading ? '...' : formatarMoeda(dashboardData.receitaHoje),
          change: 'Serviços concluídos',
          icon: '💰',
          color: 'text-green-500',
          error: dashboardData.error,
        },
        {
          title: 'Taxa de Ocupação',
          value: dashboardData.loading ? '...' : `${Math.round(dashboardData.taxaOcupacao)}%`,
          change: 'Capacidade utilizada',
          icon: '📊',
          color: 'text-purple-500',
          error: dashboardData.error,
        },
      ]

  return (
    <Container className="py-6">
      <div className="space-y-6">
        {/* Header Moderno */}
        <div className="mb-8 text-center">
          <div className="mb-6 flex items-center justify-center space-x-4">
            <div className="rounded-2xl bg-gradient-to-br from-primary-gold to-primary-gold-dark p-4 shadow-xl">
              <svg
                className="h-10 w-10 text-primary-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
                Dashboard {userRole === 'admin' ? 'Administrativo' : 'do Barbeiro'}
              </h1>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                Bem-vindo, {profile?.nome || 'Usuário'}! Visão geral das atividades de hoje.
              </p>
            </div>
          </div>
          <div className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-primary-gold to-primary-gold-dark"></div>
        </div>

        {/* Métricas principais */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => {
            const borderColors = [
              'border-l-amber-500',
              'border-l-blue-500',
              'border-l-green-500',
              'border-l-purple-500',
            ]
            const iconBgColors = [
              'bg-amber-100 dark:bg-amber-900/30',
              'bg-blue-100 dark:bg-blue-900/30',
              'bg-green-100 dark:bg-green-900/30',
              'bg-purple-100 dark:bg-purple-900/30',
            ]
            const iconColors = [
              'text-amber-600',
              'text-blue-600',
              'text-green-600',
              'text-purple-600',
            ]

            return (
              <div
                key={index}
                className={`border-l-4 bg-gradient-to-br from-white to-gray-50 dark:from-secondary-graphite-light dark:to-secondary-graphite ${borderColors[index]} rounded-lg p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                      {metric.title}
                    </div>
                    <div className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
                      {dashboardData.loading ? (
                        <div className="h-8 animate-pulse rounded bg-gray-200 dark:bg-secondary-graphite" />
                      ) : (
                        metric.value
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{metric.change}</div>
                  </div>
                  <div className={`p-4 ${iconBgColors[index]} rounded-xl`}>
                    <span className={`text-2xl ${iconColors[index]}`}>{metric.icon}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Conteúdo específico por role */}
        {userRole === 'admin' ? (
          <AdminSpecificContent />
        ) : (
          <BarberSpecificContent profile={profile} />
        )}
      </div>
    </Container>
  )
}

// Conteúdo específico para Admin
function AdminSpecificContent() {
  const dashboardData = useDashboardData()

  // Calcular faturamento mensal baseado nos dados do dashboard
  const faturamentoMensal = dashboardData.receitaHoje * 30 // Estimativa baseada na receita diária

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-lg border border-gray-200 bg-white p-6 transition-all duration-200 hover:border-primary-gold/50 hover:shadow-lg dark:border-secondary-graphite dark:bg-secondary-graphite-light dark:hover:shadow-xl">
        <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          🏪 Gestão da Barbearia
        </h3>
        <div className="space-y-3">
          <a
            href="/dashboard/funcionarios"
            className="block w-full rounded-lg bg-gray-100 p-3 text-left text-gray-900 transition-colors dark:bg-secondary-graphite dark:text-white"
          >
            👨‍💼 Gerenciar Funcionários
          </a>
          <a
            href="/dashboard/servicos"
            className="block w-full rounded-lg bg-gray-100 p-3 text-left text-gray-900 transition-colors dark:bg-secondary-graphite dark:text-white"
          >
            ⚙️ Configurar Serviços
          </a>
          <a
            href="/dashboard/relatorios"
            className="block w-full rounded-lg bg-gray-100 p-3 text-left text-gray-900 transition-colors dark:bg-secondary-graphite dark:text-white"
          >
            📊 Relatórios Financeiros
          </a>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 transition-all duration-200 hover:border-primary-gold/50 hover:shadow-lg dark:border-secondary-graphite dark:bg-secondary-graphite-light dark:hover:shadow-xl">
        <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">📈 Análises</h3>
        <div className="space-y-3 text-gray-600 dark:text-gray-300">
          <div className="flex justify-between">
            <span>Faturamento Mensal:</span>
            <span className="font-bold text-green-400">
              {dashboardData.loading ? '...' : formatarMoeda(faturamentoMensal)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Clientes Ativos:</span>
            <span className="font-bold text-blue-400">
              {dashboardData.loading ? '...' : dashboardData.clientesAtivos}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Funcionários:</span>
            <span className="font-bold text-purple-400">
              {dashboardData.loading ? '...' : dashboardData.funcionariosAtivos}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Serviços Ativos:</span>
            <span className="font-bold text-amber-400">
              {dashboardData.loading ? '...' : dashboardData.totalServicos}
            </span>
          </div>
          {dashboardData.error && (
            <div className="mt-2 rounded bg-orange-50 p-2 text-xs text-orange-500 dark:bg-orange-900/20">
              ⚠️ {dashboardData.error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Conteúdo específico para Barbeiro
function BarberSpecificContent({ profile }: { profile: Record<string, unknown> }) {
  // Usar hook de dados reais para barbeiro
  const barberData = useBarberDashboardData(profile?.id as string)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-lg border border-gray-200 bg-white p-6 transition-all duration-200 hover:border-primary-gold/50 hover:shadow-lg dark:border-secondary-graphite dark:bg-secondary-graphite-light dark:hover:shadow-xl">
        <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          ✂️ Minha Agenda Hoje
        </h3>
        <div className="space-y-3">
          {barberData.loading ? (
            <div className="py-4 text-center text-gray-600 dark:text-gray-300">
              Carregando agenda...
            </div>
          ) : barberData.agendaHoje.length === 0 ? (
            <p className="py-4 text-center text-gray-600 dark:text-gray-300">
              Nenhum agendamento para hoje
            </p>
          ) : (
            barberData.agendaHoje.slice(0, 5).map((agendamento) => (
              <div
                key={agendamento.id}
                className="rounded-lg bg-gray-100 p-3 dark:bg-secondary-graphite"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 dark:text-white">
                    {agendamento.cliente?.nome || 'Cliente'}
                  </span>
                  <span className="text-amber-400">
                    {new Date(agendamento.data_agendamento).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {agendamento.service?.nome || 'Serviço'}
                </span>
                <span
                  className={`ml-2 rounded-full px-2 py-1 text-xs ${
                    agendamento.status === 'confirmado'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}
                >
                  {agendamento.status}
                </span>
              </div>
            ))
          )}
          {barberData.agendaHoje.length > 5 && (
            <p className="text-center text-sm text-gray-600 dark:text-gray-300">
              +{barberData.agendaHoje.length - 5} agendamentos...
            </p>
          )}
          {barberData.error && (
            <div className="mt-2 rounded bg-orange-50 p-2 text-xs text-orange-500 dark:bg-orange-900/20">
              ⚠️ {barberData.error}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 transition-all duration-200 hover:border-primary-gold/50 hover:shadow-lg dark:border-secondary-graphite dark:bg-secondary-graphite-light dark:hover:shadow-xl">
        <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">💰 Meus Ganhos</h3>
        <div className="space-y-3 text-gray-600 dark:text-gray-300">
          <div className="flex justify-between">
            <span>Hoje:</span>
            <span className="font-bold text-green-400">
              {barberData.loading ? '...' : formatarMoeda(barberData.ganhos.hoje)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Esta Semana:</span>
            <span className="font-bold text-green-400">
              {barberData.loading ? '...' : formatarMoeda(barberData.ganhos.semana)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Este Mês:</span>
            <span className="font-bold text-green-400">
              {barberData.loading ? '...' : formatarMoeda(barberData.ganhos.mes)}
            </span>
          </div>
          {barberData.error && (
            <div className="mt-2 rounded bg-orange-50 p-2 text-xs text-orange-500 dark:bg-orange-900/20">
              ⚠️ {barberData.error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
