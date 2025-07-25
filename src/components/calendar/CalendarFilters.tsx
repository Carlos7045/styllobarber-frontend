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
          className="relative"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Button
                  variant={!localFilters.barbeiro_id ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setLocalFilters(prev => ({ ...prev, barbeiro_id: undefined }))}
                  className="justify-start"
                >
                  Todos
                </Button>
                {barbeiros.map((barbeiro) => (
                  <Button
                    key={barbeiro.id}
                    variant={localFilters.barbeiro_id === barbeiro.id ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setLocalFilters(prev => ({ ...prev, barbeiro_id: barbeiro.id }))}
                    className="justify-start"
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(Object.keys(APPOINTMENT_STATUS_LABELS) as AppointmentStatus[]).map((status) => (
                  <Button
                    key={status}
                    variant={(localFilters.status || []).includes(status) ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => toggleStatus(status)}
                    className="justify-start"
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
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={clearFilters}
              >
                Limpar Filtros
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={applyFilters}>
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