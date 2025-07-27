'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Container } from '@/components/layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  Target,
  PieChart,
  Activity,
  Briefcase
} from 'lucide-react'

/**
 * Hub Central de Relatórios
 * Organiza e direciona para os diferentes centros especializados de relatórios
 */
export default function RelatoriosHubPage() {
  const router = useRouter()

  // Centros de relatórios disponíveis
  const centrosRelatorios = [
    {
      id: 'financeiro',
      titulo: 'Relatórios Financeiros',
      descricao: 'Receitas, despesas, comissões e DRE completo',
      icon: DollarSign,
      color: 'bg-green-500',
      colorLight: 'bg-green-50',
      colorText: 'text-green-600',
      href: '/dashboard/financeiro/relatorios',
      recursos: ['Receitas detalhadas', 'Controle de despesas', 'Comissões por barbeiro', 'DRE automático'],
      status: 'Disponível',
      ultimaAtualizacao: 'Hoje, 14:30'
    },
    {
      id: 'clientes',
      titulo: 'Relatórios de Clientes',
      descricao: 'Análise de clientes, frequência e fidelização',
      icon: Users,
      color: 'bg-blue-500',
      colorLight: 'bg-blue-50',
      colorText: 'text-blue-600',
      href: '/dashboard/clientes/relatorios',
      recursos: ['Perfil de clientes', 'Frequência de visitas', 'Análise de fidelização', 'Segmentação'],
      status: 'Em breve',
      ultimaAtualizacao: '-'
    },
    {
      id: 'agendamentos',
      titulo: 'Relatórios de Agendamentos',
      descricao: 'Estatísticas de horários, ocupação e performance',
      icon: Calendar,
      color: 'bg-purple-500',
      colorLight: 'bg-purple-50',
      colorText: 'text-purple-600',
      href: '/dashboard/agenda/relatorios',
      recursos: ['Taxa de ocupação', 'Horários mais procurados', 'Performance por barbeiro', 'Cancelamentos'],
      status: 'Em breve',
      ultimaAtualizacao: '-'
    },
    {
      id: 'operacional',
      titulo: 'Relatórios Operacionais',
      descricao: 'Produtividade, serviços e análise operacional',
      icon: Activity,
      color: 'bg-orange-500',
      colorLight: 'bg-orange-50',
      colorText: 'text-orange-600',
      href: '/dashboard/operacional/relatorios',
      recursos: ['Produtividade por barbeiro', 'Serviços mais vendidos', 'Tempo médio de atendimento', 'Eficiência'],
      status: 'Em breve',
      ultimaAtualizacao: '-'
    }
  ]

  // Estatísticas gerais
  const estatisticas = [
    {
      titulo: 'Relatórios Gerados',
      valor: '24',
      subtitulo: 'Este mês',
      icon: FileText,
      trend: '+12%',
      trendUp: true
    },
    {
      titulo: 'Downloads Realizados',
      valor: '156',
      subtitulo: 'Total',
      icon: Download,
      trend: '+8%',
      trendUp: true
    },
    {
      titulo: 'Centro Mais Usado',
      valor: 'Financeiro',
      subtitulo: '45% dos acessos',
      icon: Target,
      trend: 'Estável',
      trendUp: null
    },
    {
      titulo: 'Última Atualização',
      valor: 'Agora',
      subtitulo: 'Sistema online',
      icon: Clock,
      trend: 'Online',
      trendUp: null
    }
  ]

  return (
    <Container className="py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Hub de Relatórios
              </h1>
              <p className="text-gray-600 mt-1">
                Centro de análises e relatórios especializados da barbearia
              </p>
            </div>
          </div>
        </motion.div>

        {/* Estatísticas Rápidas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {estatisticas.map((stat, index) => {
              const Icon = stat.icon
              return (
                <Card key={index} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {stat.titulo}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mb-1">
                        {stat.valor}
                      </p>
                      <div className="flex items-center space-x-2">
                        {stat.trendUp !== null && (
                          <>
                            {stat.trendUp ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <span className={`text-sm font-medium ${
                              stat.trendUp ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {stat.trend}
                            </span>
                          </>
                        )}
                        <span className="text-sm text-gray-500">
                          {stat.subtitulo}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-full">
                      <Icon className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </motion.div>

        {/* Centros de Relatórios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Centros Especializados
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {centrosRelatorios.map((centro, index) => {
              const Icon = centro.icon
              const isDisponivel = centro.status === 'Disponível'
              
              return (
                <motion.div
                  key={centro.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                >
                  <Card className={`p-6 h-full transition-all duration-200 ${
                    isDisponivel 
                      ? 'hover:shadow-lg hover:scale-105 cursor-pointer' 
                      : 'opacity-75'
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 ${centro.colorLight} rounded-full`}>
                          <Icon className={`h-6 w-6 ${centro.colorText}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {centro.titulo}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {centro.descricao}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          isDisponivel 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {centro.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {centro.ultimaAtualizacao}
                        </span>
                      </div>
                    </div>

                    {/* Recursos */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Recursos disponíveis:
                      </h4>
                      <ul className="space-y-1">
                        {centro.recursos.map((recurso, idx) => (
                          <li key={idx} className="flex items-center space-x-2 text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                            <span>{recurso}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Ação */}
                    <div className="mt-auto">
                      {isDisponivel ? (
                        <Button
                          onClick={() => router.push(centro.href)}
                          className="w-full flex items-center justify-center space-x-2"
                        >
                          <span>Acessar Centro</span>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          disabled
                          variant="outline"
                          className="w-full"
                        >
                          Em Desenvolvimento
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Acesso Rápido */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Dashboard Executivo
                  </h3>
                  <p className="text-gray-600">
                    Visão consolidada de todos os indicadores em um só lugar
                  </p>
                </div>
              </div>
              
              <Button
                onClick={() => router.push('/dashboard/financeiro')}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <PieChart className="h-4 w-4" />
                <span>Ver Dashboard</span>
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </Container>
  )
}