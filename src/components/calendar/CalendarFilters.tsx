'use client'

import { useState, useEffect } from 'react'
import { Filter, X, User, Calendar, Clock } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input } from '@/components/ui'
// import { formatDate } from '@/lib/date-utils' // Não usado no momento
import { APPOINTMENT_STATUS_LABELS } from '@/types/appointments'
import type { CalendarFilters, AppointmentStatus } from '@/types/appointments'

interface CalendarFiltersProps {
  filters: CalendarFilters
  onFiltersChange: (filters: CalendarFilters) => void
  barbeiros?: Array<{ id: string; nome: string }>
  className?: string
}

export function CalendarFiltersComponent({
  filters,
  onFiltersChange,
  barbeiros = [],
  className
}: CalendarFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<CalendarFilters>(filters)

  // Sincronizar filtros locais com props
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  // Aplicar filtros
  const applyFilters = () => {
    onFiltersChange(localFilters)
    setIsOpen(false)
  }

  // Limpar filtros
  const clearFilters = () => {
    const emptyFilters: CalendarFilters = {}
    setLocalFilters(emptyFilters)
    onFiltersChange(emptyFilters)
  }

  // Contar filtros ativos
  const activeFiltersCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof CalendarFilters]
    return value !== undefined && value !== null && 
           (Array.isArray(value) ? value.length > 0 : true)
  }).length

  // Toggle status no filtro
  const toggleStatus = (status: AppointmentStatus) => {
    const currentStatus = localFilters.status || []
    const newStatus = currentStatus.includes(status)
      ? currentStatus.filter(s => s !== status)
      : [...currentStatus, status]
    
    setLocalFilters(prev => ({
      ...prev,
      status: newStatus.length > 0 ? newStatus : undefined
    }))
  }

  return (
    <div className={className}>
      {/* Botão de filtros */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="relative bg-white dark:bg-secondary-graphite-light border-2 border-gray-300 dark:border-secondary-graphite-card hover:border-primary-gold hover:bg-gradient-to-r hover:from-primary-gold/10 hover:to-primary-gold/20 dark:hover:bg-primary-gold/20 text-gray-700 dark:text-gray-300 font-semibold px-6 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge 
              className="ml-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-sm"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {/* Filtros ativos */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {filters.barbeiro_id && (
              <Badge variant="secondary" className="gap-1">
                <User className="h-3 w-3" />
                {barbeiros.find(b => b.id === filters.barbeiro_id)?.nome || 'Barbeiro'}
                <button
                  onClick={() => onFiltersChange({ ...filters, barbeiro_id: undefined })}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filters.status && filters.status.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                {filters.status.length === 1 
                  ? APPOINTMENT_STATUS_LABELS[filters.status[0]]
                  : `${filters.status.length} status`
                }
                <button
                  onClick={() => onFiltersChange({ ...filters, status: undefined })}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {(filters.date_start || filters.date_end) && (
              <Badge variant="secondary" className="gap-1">
                <Calendar className="h-3 w-3" />
                Período personalizado
                <button
                  onClick={() => onFiltersChange({ 
                    ...filters, 
                    date_start: undefined, 
                    date_end: undefined 
                  })}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 px-2 text-xs"
            >
              Limpar todos
            </Button>
          </div>
        )}
      </div>

      {/* Painel de filtros */}
      {isOpen && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Filtros de Agendamentos
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Filtro por barbeiro */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Barbeiro
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Button
                  variant={!localFilters.barbeiro_id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLocalFilters(prev => ({ ...prev, barbeiro_id: undefined }))}
                  className={`justify-start font-semibold px-4 py-2 rounded-lg transition-all duration-300 ${
                    !localFilters.barbeiro_id 
                      ? 'bg-gradient-to-r from-primary-gold to-primary-gold-dark text-primary-black shadow-lg transform scale-105' 
                      : 'bg-white dark:bg-secondary-graphite-light border-2 border-gray-300 dark:border-secondary-graphite-card hover:border-primary-gold hover:bg-primary-gold/10 dark:hover:bg-primary-gold/20 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Todos
                </Button>
                {barbeiros.map((barbeiro) => (
                  <Button
                    key={barbeiro.id}
                    variant={localFilters.barbeiro_id === barbeiro.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLocalFilters(prev => ({ ...prev, barbeiro_id: barbeiro.id }))}
                    className={`justify-start font-semibold px-4 py-2 rounded-lg transition-all duration-300 ${
                      localFilters.barbeiro_id === barbeiro.id 
                        ? 'bg-gradient-to-r from-primary-gold to-primary-gold-dark text-primary-black shadow-lg transform scale-105' 
                        : 'bg-white dark:bg-secondary-graphite-light border-2 border-gray-300 dark:border-secondary-graphite-card hover:border-primary-gold hover:bg-primary-gold/10 dark:hover:bg-primary-gold/20 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {barbeiro.nome}
                  </Button>
                ))}
              </div>
            </div>

            {/* Filtro por status */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Status do Agendamento
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(Object.keys(APPOINTMENT_STATUS_LABELS) as AppointmentStatus[]).map((status) => (
                  <Button
                    key={status}
                    variant={(localFilters.status || []).includes(status) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleStatus(status)}
                    className={`justify-start font-semibold px-4 py-2 rounded-lg transition-all duration-300 ${
                      (localFilters.status || []).includes(status) 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105' 
                        : 'bg-white dark:bg-secondary-graphite-light border-2 border-gray-300 dark:border-secondary-graphite-card hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {APPOINTMENT_STATUS_LABELS[status]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Filtro por período */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Período Personalizado
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Data inicial
                  </label>
                  <Input
                    type="date"
                    value={localFilters.date_start || ''}
                    onChange={(e) => setLocalFilters(prev => ({ 
                      ...prev, 
                      date_start: e.target.value || undefined 
                    }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Data final
                  </label>
                  <Input
                    type="date"
                    value={localFilters.date_end || ''}
                    onChange={(e) => setLocalFilters(prev => ({ 
                      ...prev, 
                      date_end: e.target.value || undefined 
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-secondary-graphite-card/30">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="bg-white dark:bg-secondary-graphite-light border-2 border-red-300 dark:border-red-700 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
              >
                Limpar Filtros
              </Button>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="bg-white dark:bg-secondary-graphite-light border-2 border-gray-300 dark:border-secondary-graphite-card hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-secondary-graphite-hover text-gray-700 dark:text-gray-300 font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={applyFilters}
                  className="bg-gradient-to-r from-primary-gold to-primary-gold-dark hover:from-primary-gold-dark hover:to-primary-gold text-primary-black font-bold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}