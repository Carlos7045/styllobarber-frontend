'use client'

import { useState } from 'react'
import { Metadata } from 'next'
import { Container } from '@/shared/components/layout'
import { Card, Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui'
import { Clock, Calendar, Settings, AlertCircle } from 'lucide-react'
import { useAdminHorarios } from '@/domains/users/hooks/use-admin-horarios'
import { HorariosManager } from '@/domains/users/components/admin/HorariosManager'
import { LoadingSpinner } from '@/shared/components/ui'

export default function HorariosPage() {
  const [activeTab, setActiveTab] = useState<'funcionamento' | 'bloqueios'>('funcionamento')
  const { horariosFuncionamento, bloqueiosHorario, loading, error } = useAdminHorarios()

  if (loading) {
    return (
      <Container className="py-8">
        <div className="flex h-96 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="py-8">
        <div className="mx-auto max-w-md">
          <Card className="p-12 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              Erro ao carregar horários
            </h3>
            <p className="text-gray-500 dark:text-gray-400">{error}</p>
          </Card>
        </div>
      </Container>
    )
  }

  return (
    <Container className="py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header Moderno */}
        <div className="text-center">
          <div className="mb-6 flex items-center justify-center space-x-4">
            <div className="rounded-2xl bg-gradient-to-br from-primary-gold to-primary-gold-dark p-4 shadow-xl">
              <Clock className="h-10 w-10 text-primary-black" />
            </div>
            <div>
              <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
                Gerenciamento de Horários
              </h1>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                Configure horários de funcionamento e gerencie bloqueios
              </p>
            </div>
          </div>
          <div className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-primary-gold to-primary-gold-dark"></div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border-l-4 border-l-primary-gold bg-gradient-to-br from-white to-gray-50 p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-secondary-graphite-light dark:to-secondary-graphite">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                  Dias Configurados
                </div>
                <div className="mb-1 text-3xl font-bold text-primary-gold">
                  {horariosFuncionamento.filter((h) => h.ativo).length}/7
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  dias da semana ativos
                </div>
              </div>
              <div className="rounded-xl bg-primary-gold/10 p-4">
                <Clock className="h-8 w-8 text-primary-gold" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-gray-50 p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-secondary-graphite-light dark:to-secondary-graphite">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                  Bloqueios Ativos
                </div>
                <div className="mb-1 text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {bloqueiosHorario.filter((b) => new Date(b.data_fim) >= new Date()).length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">bloqueios vigentes</div>
              </div>
              <div className="rounded-xl bg-blue-100 p-4 dark:bg-blue-900/30">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border-l-4 border-l-purple-500 bg-gradient-to-br from-white to-gray-50 p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-secondary-graphite-light dark:to-secondary-graphite">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                  Total de Bloqueios
                </div>
                <div className="mb-1 text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {bloqueiosHorario.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  bloqueios cadastrados
                </div>
              </div>
              <div className="rounded-xl bg-purple-100 p-4 dark:bg-purple-900/30">
                <Settings className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-lg transition-all duration-300 hover:shadow-2xl dark:border-secondary-graphite dark:from-secondary-graphite-light dark:to-secondary-graphite">
          <div className="border-b border-gray-200 bg-gradient-to-r from-primary-gold/5 to-transparent px-8 py-6 dark:border-secondary-graphite-card/30">
            <h2 className="flex items-center gap-3 text-xl font-bold text-gray-900 dark:text-white">
              <div className="rounded-lg bg-primary-gold/10 p-2">
                <Clock className="h-6 w-6 text-primary-gold" />
              </div>
              Configuração de Horários
            </h2>
          </div>

          <div className="p-6">
            {/* Tabs para alternar entre funcionalidades */}
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as 'funcionamento' | 'bloqueios')}
            >
              <TabsList className="mb-6 grid w-full grid-cols-2">
                <TabsTrigger value="funcionamento" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horários de Funcionamento
                </TabsTrigger>
                <TabsTrigger value="bloqueios" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Bloqueios de Horário
                </TabsTrigger>
              </TabsList>

              <TabsContent value="funcionamento">
                <HorariosManager
                  activeTab="funcionamento"
                  horariosFuncionamento={horariosFuncionamento}
                  bloqueiosHorario={bloqueiosHorario}
                />
              </TabsContent>

              <TabsContent value="bloqueios">
                <HorariosManager
                  activeTab="bloqueios"
                  horariosFuncionamento={horariosFuncionamento}
                  bloqueiosHorario={bloqueiosHorario}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Container>
  )
}
