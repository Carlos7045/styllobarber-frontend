'use client'

import React from 'react'
import { Scissors, DollarSign, Star, Calendar, TrendingUp, User } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { cn, formatarMoeda } from '@/shared/utils/utils'
import { useClientStats } from '@/domains/users/hooks/use-client-stats'

interface ClientStatsProps {
  className?: string
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  loading?: boolean
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  loading,
}) => (
  <Card className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="mb-2 text-sm font-medium text-text-muted">{title}</p>
          {loading ? (
            <div className="h-8 w-16 animate-pulse rounded bg-neutral-light-gray" />
          ) : (
            <p className={cn('mb-1 text-3xl font-bold', color)}>{value}</p>
          )}
          {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
        </div>
        <div className={cn('rounded-xl p-4', color.replace('text-', 'bg-').replace('-600', '/10'))}>
          <Icon className={cn('h-8 w-8', color)} />
        </div>
      </div>
    </CardContent>
  </Card>
)

export const ClientStats: React.FC<ClientStatsProps> = ({ className }) => {
  const { stats, loading, error } = useClientStats()
  
  const {
    totalCortes,
    valorTotalGasto,
    pontosFidelidade,
    frequenciaMedia,
    servicoFavorito,
    barbeiroFavorito,
  } = stats

  // Mostrar erro se houver
  if (error) {
    return (
      <div className={cn('space-y-6', className)}>
        <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <div className="text-center">
            <h3 className="font-semibold text-red-900 dark:text-red-200 mb-2">
              Erro ao Carregar Estatísticas
            </h3>
            <p className="text-red-700 dark:text-red-300">
              {error}
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Título da seção */}
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-text-primary">Suas Estatísticas</h2>
        <p className="text-text-muted">Acompanhe seu histórico e conquistas</p>
      </div>

      {/* Grid de estatísticas principais */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Cortes"
          value={totalCortes}
          subtitle="Serviços realizados"
          icon={Scissors}
          color="text-primary-gold"
          loading={loading}
        />

        <StatCard
          title="Valor Investido"
          value={loading ? '...' : formatarMoeda(valorTotalGasto)}
          subtitle="Total gasto"
          icon={DollarSign}
          color="text-green-600"
          loading={loading}
        />

        <StatCard
          title="Pontos de Fidelidade"
          value={pontosFidelidade}
          subtitle="Pontos acumulados"
          icon={Star}
          color="text-primary-gold"
          loading={loading}
        />

        <StatCard
          title="Frequência"
          value={loading ? '...' : frequenciaMedia > 0 ? `${frequenciaMedia} dias` : 'N/A'}
          subtitle="Média entre visitas"
          icon={Calendar}
          color="text-blue-600"
          loading={loading}
        />
      </div>

      {/* Informações adicionais */}
      {!loading && (servicoFavorito || barbeiroFavorito) && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {servicoFavorito && (
            <Card className="border-l-4 border-l-primary-gold">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary-gold/10 p-2">
                    <TrendingUp className="h-5 w-5 text-primary-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-muted">Serviço Favorito</p>
                    <p className="text-lg font-semibold text-text-primary">{servicoFavorito}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {barbeiroFavorito && (
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-muted">Barbeiro Favorito</p>
                    <p className="text-lg font-semibold text-text-primary">{barbeiroFavorito}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Mensagem motivacional baseada nas estatísticas */}
      {!loading && totalCortes > 0 && (
        <Card className="border-primary-gold/20 bg-gradient-to-r from-primary-gold/5 to-primary-gold/10">
          <CardContent className="p-6 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <Star className="h-5 w-5 text-primary-gold" />
              <p className="font-semibold text-text-primary">
                {totalCortes >= 10
                  ? 'Cliente VIP!'
                  : totalCortes >= 5
                    ? 'Cliente Fiel!'
                    : 'Bem-vindo!'}
              </p>
            </div>
            <p className="text-sm text-text-muted">
              {totalCortes >= 10
                ? 'Você é um dos nossos clientes mais fiéis! Continue assim!'
                : totalCortes >= 5
                  ? 'Obrigado pela sua fidelidade! Você está no caminho certo.'
                  : 'Continue conosco e desbloqueie benefícios exclusivos!'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ClientStats
