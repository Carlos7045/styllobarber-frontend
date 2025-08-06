// Componente para exibir estatísticas de cadastros automáticos
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  UserPlus,
  TrendingUp,
  MessageSquare,
  Mail,
  Calendar,
  BarChart3,
  Users,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react'
import { Card, Button, Badge } from '@/shared/components/ui'
import { formatDate } from '@/shared/utils/date-utils'
import { supabase } from '@/lib/api/supabase'

interface CadastroStats {
  totalCadastros: number
  cadastrosPorDia: Record<string, number>
  cadastrosPorFuncionario: Record<string, number>
  taxaSucessoEnvio: number
}

interface CadastroRecente {
  id: string
  clienteNome: string
  funcionarioNome: string
  tipoEnvio: 'SMS' | 'EMAIL'
  statusEnvio: 'enviado' | 'falha' | 'pendente'
  createdAt: string
}

export const CadastroAutomaticoStats = () => {
  const [stats, setStats] = useState<CadastroStats>({
    totalCadastros: 0,
    cadastrosPorDia: {},
    cadastrosPorFuncionario: {},
    taxaSucessoEnvio: 0
  })
  
  const [cadastrosRecentes, setCadastrosRecentes] = useState<CadastroRecente[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<'7d' | '30d' | '90d'>('30d')

  // Carregar estatísticas
  useEffect(() => {
    carregarEstatisticas()
  }, [periodo])

  const carregarEstatisticas = async () => {
    setLoading(true)
    
    try {
      const diasAtras = periodo === '7d' ? 7 : periodo === '30d' ? 30 : 90
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - diasAtras)
      
      // Buscar estatísticas usando a função do banco
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_automatic_registration_stats', {
          start_date: startDate.toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0]
        })

      if (statsError) throw statsError

      if (statsData && statsData.length > 0) {
        const stat = statsData[0]
        setStats({
          totalCadastros: Number(stat.total_cadastros) || 0,
          cadastrosPorDia: stat.cadastros_por_dia && typeof stat.cadastros_por_dia === 'object' 
            ? stat.cadastros_por_dia 
            : {},
          cadastrosPorFuncionario: stat.cadastros_por_funcionario && typeof stat.cadastros_por_funcionario === 'object'
            ? stat.cadastros_por_funcionario 
            : {},
          taxaSucessoEnvio: Number(stat.taxa_sucesso_envio) || 0
        })
      } else {
        // Resetar stats se não houver dados
        setStats({
          totalCadastros: 0,
          cadastrosPorDia: {},
          cadastrosPorFuncionario: {},
          taxaSucessoEnvio: 0
        })
      }

      // Buscar cadastros recentes
      const { data: recentesData, error: recentesError } = await supabase
        .from('logs_cadastro_automatico')
        .select(`
          id,
          created_at,
          cliente:profiles!logs_cadastro_automatico_cliente_id_fkey(nome),
          funcionario:profiles!logs_cadastro_automatico_funcionario_id_fkey(nome),
          logs_envio_credenciais(tipo_envio, status)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (recentesError) throw recentesError

      const cadastrosFormatados: CadastroRecente[] = (recentesData || []).map((item: any) => ({
        id: item.id,
        clienteNome: item.cliente?.nome || 'Cliente',
        funcionarioNome: item.funcionario?.nome || 'Funcionário',
        tipoEnvio: item.logs_envio_credenciais?.[0]?.tipo_envio || 'EMAIL',
        statusEnvio: item.logs_envio_credenciais?.[0]?.status || 'pendente',
        createdAt: item.created_at
      }))

      setCadastrosRecentes(cadastrosFormatados)

    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      
      // Resetar para estado inicial em caso de erro
      setStats({
        totalCadastros: 0,
        cadastrosPorDia: {},
        cadastrosPorFuncionario: {},
        taxaSucessoEnvio: 0
      })
      setCadastrosRecentes([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enviado':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'falha':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'enviado':
        return <CheckCircle className="h-3 w-3" />
      case 'falha':
        return <XCircle className="h-3 w-3" />
      case 'pendente':
        return <RefreshCw className="h-3 w-3" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cadastros Automáticos
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Estatísticas de clientes cadastrados no PDV
          </p>
        </div>

        {/* Filtro de Período */}
        <div className="flex space-x-2">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <Button
              key={p}
              variant={periodo === p ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setPeriodo(p)}
            >
              {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={carregarEstatisticas}
            className="ml-2"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Cadastros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Total de Cadastros
                </p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {stats.totalCadastros}
                </p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-full">
                <UserPlus className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Taxa de Sucesso */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Taxa de Sucesso
                </p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {stats.taxaSucessoEnvio.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Média por Dia */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  Média por Dia
                </p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                  {(() => {
                    const diasNoPeriodo = periodo === '7d' ? 7 : periodo === '30d' ? 30 : 90
                    return stats.totalCadastros > 0 
                      ? (stats.totalCadastros / diasNoPeriodo).toFixed(1)
                      : '0'
                  })()}
                </p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-full">
                <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Funcionários Ativos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                  Funcionários Ativos
                </p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                  {Object.keys(stats.cadastrosPorFuncionario).length}
                </p>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-full">
                <Users className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking de Funcionários */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Ranking de Funcionários
            </h3>
            <BarChart3 className="h-5 w-5 text-gray-500" />
          </div>

          <div className="space-y-4">
            {Object.entries(stats.cadastrosPorFuncionario)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([funcionario, total], index) => (
                <div key={funcionario} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' :
                      index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {funcionario}
                    </span>
                  </div>
                  <Badge variant="secondary">
                    {total} cadastro{total !== 1 ? 's' : ''}
                  </Badge>
                </div>
              ))}

            {Object.keys(stats.cadastrosPorFuncionario).length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhum cadastro encontrado no período
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Cadastros Recentes */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Cadastros Recentes
            </h3>
            <Calendar className="h-5 w-5 text-gray-500" />
          </div>

          <div className="space-y-4">
            {cadastrosRecentes.map((cadastro) => (
              <div key={cadastro.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-secondary-graphite-card rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {cadastro.clienteNome}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    por {cadastro.funcionarioNome}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(cadastro.createdAt)}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {cadastro.tipoEnvio === 'EMAIL' ? (
                      <Mail className="h-3 w-3 text-gray-500" />
                    ) : (
                      <MessageSquare className="h-3 w-3 text-gray-500" />
                    )}
                    <span className="text-xs text-gray-500">
                      {cadastro.tipoEnvio}
                    </span>
                  </div>
                  
                  <Badge className={`text-xs ${getStatusColor(cadastro.statusEnvio)}`}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(cadastro.statusEnvio)}
                      <span>
                        {cadastro.statusEnvio === 'enviado' ? 'Enviado' :
                         cadastro.statusEnvio === 'falha' ? 'Falha' : 'Pendente'}
                      </span>
                    </div>
                  </Badge>
                </div>
              </div>
            ))}

            {cadastrosRecentes.length === 0 && (
              <div className="text-center py-8">
                <UserPlus className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhum cadastro recente
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}