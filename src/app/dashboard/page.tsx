'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Container } from '@/components/layout'
import { FullPageLoading } from '@/components/auth/AuthLoadingState'

// Dashboard principal - Redireciona baseado no role do usuário
export default function DashboardRedirect() {
  const { profile, user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return // Aguardar carregar

    const userRole = profile?.role || user?.user_metadata?.role || 'client'

    console.log('🔄 Redirecionando usuário baseado no role:', userRole)

    // Redirecionar baseado no role
    switch (userRole) {
      case 'saas_owner':
        console.log('👑 SaaS Owner → /saas-admin')
        router.replace('/saas-admin')
        break
        
      case 'admin':
      case 'barber':
        console.log('👨‍💼 Admin/Barbeiro → Dashboard administrativo')
        // Manter na mesma página, mas mostrar dashboard administrativo
        break
        
      case 'client':
        console.log('👥 Cliente → /dashboard/agendamentos')
        router.replace('/dashboard/agendamentos')
        break
        
      default:
        console.log('❓ Role desconhecido, redirecionando para agendamentos')
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
function AdminBarberDashboard({ userRole, profile }: { userRole: string, profile: any }) {
  // Dados mockados para demonstração
  const dashboardData = {
    metrics: [
      {
        title: 'Agendamentos Hoje',
        value: '12',
        change: '+2 desde ontem',
        icon: '📅',
        color: 'text-amber-500',
      },
      {
        title: 'Clientes Ativos',
        value: '248',
        change: '+12 este mês',
        icon: '👥',
        color: 'text-blue-500',
      },
      {
        title: 'Receita Hoje',
        value: 'R$ 1.240',
        change: '+15% vs ontem',
        icon: '💰',
        color: 'text-green-500',
      },
      {
        title: 'Taxa de Ocupação',
        value: '85%',
        change: '+5% esta semana',
        icon: '📊',
        color: 'text-purple-500',
      },
    ]
  }

  return (
    <Container className="py-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Dashboard {userRole === 'admin' ? 'Administrativo' : 'do Barbeiro'}
          </h1>
          <p className="text-gray-400">
            Bem-vindo, {profile?.nome || 'Usuário'}! Visão geral das atividades de hoje.
          </p>
        </div>

        {/* Métricas principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardData.metrics.map((metric, index) => (
            <div
              key={index}
              className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-amber-500/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">{metric.icon}</span>
                <span className={`text-sm ${metric.color}`}>
                  {metric.change}
                </span>
              </div>
              <h3 className="text-gray-400 text-sm font-medium mb-1">
                {metric.title}
              </h3>
              <p className="text-2xl font-bold text-white">
                {metric.value}
              </p>
            </div>
          ))}
        </div>

        {/* Conteúdo específico por role */}
        {userRole === 'admin' ? (
          <AdminSpecificContent />
        ) : (
          <BarberSpecificContent />
        )}
      </div>
    </Container>
  )
}

// Conteúdo específico para Admin
function AdminSpecificContent() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">
          🏪 Gestão da Barbearia
        </h3>
        <div className="space-y-3">
          <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
            👨‍💼 Gerenciar Funcionários
          </button>
          <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
            ⚙️ Configurar Serviços
          </button>
          <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
            📊 Relatórios Financeiros
          </button>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">
          📈 Análises
        </h3>
        <div className="space-y-3 text-gray-300">
          <div className="flex justify-between">
            <span>Faturamento Mensal:</span>
            <span className="text-green-400 font-bold">R$ 15.240</span>
          </div>
          <div className="flex justify-between">
            <span>Clientes Ativos:</span>
            <span className="text-blue-400 font-bold">248</span>
          </div>
          <div className="flex justify-between">
            <span>Funcionários:</span>
            <span className="text-purple-400 font-bold">5</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Conteúdo específico para Barbeiro
function BarberSpecificContent() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">
          ✂️ Minha Agenda
        </h3>
        <div className="space-y-3">
          <div className="p-3 bg-gray-700 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-white">João Silva</span>
              <span className="text-amber-400">09:00</span>
            </div>
            <span className="text-gray-400 text-sm">Corte + Barba</span>
          </div>
          <div className="p-3 bg-gray-700 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-white">Pedro Santos</span>
              <span className="text-amber-400">10:30</span>
            </div>
            <span className="text-gray-400 text-sm">Corte Masculino</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">
          💰 Meus Ganhos
        </h3>
        <div className="space-y-3 text-gray-300">
          <div className="flex justify-between">
            <span>Hoje:</span>
            <span className="text-green-400 font-bold">R$ 320</span>
          </div>
          <div className="flex justify-between">
            <span>Esta Semana:</span>
            <span className="text-green-400 font-bold">R$ 1.840</span>
          </div>
          <div className="flex justify-between">
            <span>Este Mês:</span>
            <span className="text-green-400 font-bold">R$ 6.240</span>
          </div>
        </div>
      </div>
    </div>
  )
}