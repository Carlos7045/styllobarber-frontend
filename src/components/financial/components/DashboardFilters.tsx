
'use client'

import { motion } from 'framer-motion'
// Componente para filtros do dashboard financeiro

import { useState } from 'react'

import { Calendar, User, Filter, X } from 'lucide-react'
import { Card } from '@/shared/components/ui'
import { Button } from '@/shared/components/ui'
import { getMonthRange, getYearRange, generateDateRange } from '../utils'
import type { DateRange } from '../types'

interface DashboardFiltersProps {
  periodo: DateRange
  barbeiroId?: string
  barbeiros: Array<{ id: string; nome: string }>
  onPeriodoChange: (periodo: DateRange) => void
  onBarbeiroChange: (barbeiroId?: string) => void
  isLoading?: boolean
}

type PeriodoPreset = 'hoje' | 'semana' | 'mes' | 'trimestre' | 'ano' | 'custom'

export const DashboardFilters = ({
  periodo,
  barbeiroId,
  barbeiros,
  onPeriodoChange,
  onBarbeiroChange,
  isLoading = false
}: DashboardFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<PeriodoPreset>('mes')
  const [customDates, setCustomDates] = useState({
    inicio: periodo.inicio,
    fim: periodo.fim
  })

  // Presets de período
  const periodPresets = [
    { 
      key: 'hoje' as const, 
      label: 'Hoje',
      getValue: () => {
        const today = new Date().toISOString().split('T')[0]
        return { inicio: today, fim: today }
      }
    },
    { 
      key: 'semana' as const, 
      label: 'Esta Semana',
      getValue: () => generateDateRange(7)
    },
    { 
      key: 'mes' as const, 
      label: 'Este Mês',
      getValue: () => getMonthRange()
    },
    { 
      key: 'trimestre' as const, 
      label: 'Trimestre',
      getValue: () => generateDateRange(90)
    },
    { 
      key: 'ano' as const, 
      label: 'Este Ano',
      getValue: () => getYearRange()
    },
    { 
      key: 'custom' as const, 
      label: 'Personalizado',
      getValue: () => customDates
    }
  ]

  const handlePresetChange = (preset: PeriodoPreset) => {
    setSelectedPreset(preset)
    const presetData = periodPresets.find(p => p.key === preset)
    if (presetData) {
      const newPeriodo = presetData.getValue()
      onPeriodoChange(newPeriodo)
      if (preset !== 'custom') {
        setCustomDates(newPeriodo)
      }
    }
  }

  const handleCustomDateChange = (field: 'inicio' | 'fim', value: string) => {
    const newCustomDates = { ...customDates, [field]: value }
    setCustomDates(newCustomDates)
    
    if (selectedPreset === 'custom') {
      onPeriodoChange(newCustomDates)
    }
  }

  const handleBarbeiroSelect = (barbeiro: { id: string; nome: string } | null) => {
    onBarbeiroChange(barbeiro?.id)
  }

  const clearFilters = () => {
    setSelectedPreset('mes')
    onPeriodoChange(getMonthRange())
    onBarbeiroChange(undefined)
  }

  const selectedBarbeiro = barbeiros.find(b => b.id === barbeiroId)
  const hasActiveFilters = barbeiroId || selectedPreset !== 'mes'

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-700">Filtros</span>
          </div>

          {/* Presets de período */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div className="flex space-x-1">
              {periodPresets.slice(0, 5).map((preset) => (
                <Button
                  key={preset.key}
                  variant={selectedPreset === preset.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePresetChange(preset.key)}
                  disabled={isLoading}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
              <Button
                variant={isExpanded ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                disabled={isLoading}
                className="text-xs"
              >
                {isExpanded ? 'Menos' : 'Mais'}
              </Button>
            </div>
          </div>

          {/* Filtro de barbeiro */}
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-400" />
            <select
              value={barbeiroId || ''}
              onChange={(e) => handleBarbeiroSelect(
                e.target.value ? barbeiros.find(b => b.id === e.target.value) || null : null
              )}
              disabled={isLoading}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os barbeiros</option>
              {barbeiros.map((barbeiro) => (
                <option key={barbeiro.id} value={barbeiro.id}>
                  {barbeiro.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Limpar filtros */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Filtros expandidos */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-4 pt-4 border-t border-gray-200"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Período personalizado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período Personalizado
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={customDates.inicio}
                  onChange={(e) => handleCustomDateChange('inicio', e.target.value)}
                  disabled={isLoading}
                  className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-500 self-center">até</span>
                <input
                  type="date"
                  value={customDates.fim}
                  onChange={(e) => handleCustomDateChange('fim', e.target.value)}
                  disabled={isLoading}
                  className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetChange('custom')}
                disabled={isLoading}
                className="mt-2 w-full text-xs"
              >
                Aplicar Período
              </Button>
            </div>

            {/* Informações do filtro atual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtro Atual
              </label>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Período:</span>{' '}
                  {new Date(periodo.inicio).toLocaleDateString('pt-BR')} até{' '}
                  {new Date(periodo.fim).toLocaleDateString('pt-BR')}
                </p>
                <p>
                  <span className="font-medium">Barbeiro:</span>{' '}
                  {selectedBarbeiro?.nome || 'Todos'}
                </p>
              </div>
            </div>

            {/* Ações rápidas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ações Rápidas
              </label>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetChange('mes')}
                  disabled={isLoading}
                  className="w-full text-xs"
                >
                  Voltar ao Mês Atual
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  disabled={isLoading}
                  className="w-full text-xs"
                >
                  Resetar Todos os Filtros
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </Card>
  )
}
