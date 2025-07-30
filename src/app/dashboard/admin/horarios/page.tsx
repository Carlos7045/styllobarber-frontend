'use client'

import { useState } from 'react'
import { Container } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Button } from '@/components/ui'
import { Clock, Calendar, Plus, Settings, AlertTriangle } from 'lucide-react'
import { useAdminHorarios } from '@/hooks/use-admin-horarios'
import { HorariosManager } from '@/components/admin'

/**
 * Página de configuração de horários e disponibilidade
 * Permite gerenciar horários de funcionamento e bloqueios
 */
export default function HorariosPage() {
  const [activeTab, setActiveTab] = useState<'funcionamento' | 'bloqueios'>('funcionamento')
  const { horariosFuncionamento, bloqueiosHorario, loading, error } = useAdminHorarios()

  if (loading) {
    return (
      <Container className="py-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <Clock className="mx-auto mb-4 h-12 w-12 animate-spin text-primary-gold" />
            <p className="text-text-muted">Carregando configurações de horários...</p>
          </div>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="py-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <p className="mb-4 text-red-600">Erro ao carregar configurações de horários</p>
            <p className="text-sm text-text-muted">{error}</p>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container className="py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-6 flex items-center justify-center space-x-4">
            <div className="rounded-2xl bg-gradient-to-br from-primary-gold to-primary-gold-dark p-4 shadow-xl">
              <Clock className="h-10 w-10 text-primary-black" />
            </div>
            <div>
              <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
                Configuração de Horários
              </h1>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                Gerencie horários de funcionamento e disponibilidade
              </p>
            </div>
          </div>
          <div className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-primary-gold to-primary-gold-dark"></div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 dark:bg-secondary-graphite-light">
            <button
              onClick={() => setActiveTab('funcionamento')}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                activeTab === 'funcionamento'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-secondary-graphite dark:text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <Settings className="mr-2 inline h-4 w-4" />
              Horários de Funcionamento
            </button>
            <button
              onClick={() => setActiveTab('bloqueios')}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                activeTab === 'bloqueios'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-secondary-graphite dark:text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <Calendar className="mr-2 inline h-4 w-4" />
              Bloqueios de Horário
            </button>
          </div>
        </div>

        {/* Componente principal */}
        <HorariosManager
          activeTab={activeTab}
          horariosFuncionamento={horariosFuncionamento}
          bloqueiosHorario={bloqueiosHorario}
        />
      </div>
    </Container>
  )
}
