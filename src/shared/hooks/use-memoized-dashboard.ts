import { useMemo, useCallback } from 'react'
import { useExpensiveMemo, useAggregation } from '@/shared/utils/memoization'

interface DashboardMetric {
  id: string
  label: string
  value: number | string
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  format?: 'currency' | 'percentage' | 'number'
  icon?: React.ComponentType<{ className?: string }>
}

interface DashboardData {
  appointments: any[]
  clients: any[]
  services: any[]
  transactions: any[]
  dateRange: { start: Date; end: Date }
}

/**
 * Hook para memoização de métricas do dashboard
 */
export function useMemoizedDashboardMetrics(data: DashboardData): DashboardMetric[] {
  return useExpensiveMemo(() => {
    const { appointments, clients, services, transactions } = data

    // Calcular métricas principais
    const totalAppointments = appointments.length
    const totalClients = clients.length
    const totalServices = services.length
    
    const totalRevenue = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const averageTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0

    // Calcular mudanças (comparar com período anterior - simulado)
    const previousRevenue = totalRevenue * 0.9 // Simulação
    const revenueChange = ((totalRevenue - previousRevenue) / previousRevenue) * 100

    return [
      {
        id: 'appointments',
        label: 'Agendamentos',
        value: totalAppointments,
        change: 12,
        changeType: 'increase' as const,
        format: 'number' as const
      },
      {
        id: 'clients',
        label: 'Clientes',
        value: totalClients,
        change: 8,
        changeType: 'increase' as const,
        format: 'number' as const
      },
      {
        id: 'revenue',
        label: 'Receita',
        value: totalRevenue,
        change: revenueChange,
        changeType: revenueChange > 0 ? 'increase' as const : 'decrease' as const,
        format: 'currency' as const
      },
      {
        id: 'average_ticket',
        label: 'Ticket Médio',
        value: averageTicket,
        change: 5,
        changeType: 'increase' as const,
        format: 'currency' as const
      }
    ]
  }, [data.appointments, data.clients, data.services, data.transactions], 'dashboard-metrics')
}

/**
 * Hook para memoização de dados de gráficos
 */
export function useMemoizedChartData(
  transactions: any[],
  groupBy: 'day' | 'week' | 'month' = 'day'
) {
  return useExpensiveMemo(() => {
    const groupedData = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date)
      let key: string

      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0]
          break
        case 'week':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        default:
          key = date.toISOString().split('T')[0]
      }

      if (!acc[key]) {
        acc[key] = { income: 0, expense: 0, date: key }
      }

      if (transaction.type === 'income') {
        acc[key].income += transaction.amount
      } else {
        acc[key].expense += transaction.amount
      }

      return acc
    }, {} as Record<string, { income: number; expense: number; date: string }>)

    return Object.values(groupedData).sort((a, b) => a.date.localeCompare(b.date))
  }, [transactions, groupBy], `chart-data-${groupBy}`)
}

/**
 * Hook para memoização de estatísticas de serviços
 */
export function useMemoizedServiceStats(appointments: any[], services: any[]) {
  return useAggregation(appointments, (appointments) => {
    const serviceStats = services.map(service => {
      const serviceAppointments = appointments.filter(apt => apt.service_id === service.id)
      const totalRevenue = serviceAppointments.reduce((sum, apt) => sum + (apt.price || service.price), 0)
      
      return {
        id: service.id,
        name: service.name,
        appointments: serviceAppointments.length,
        revenue: totalRevenue,
        averagePrice: serviceAppointments.length > 0 ? totalRevenue / serviceAppointments.length : 0
      }
    })

    return serviceStats.sort((a, b) => b.revenue - a.revenue)
  })
}

/**
 * Hook para memoização de dados de performance de barbeiros
 */
export function useMemoizedBarberPerformance(appointments: any[], barbers: any[]) {
  return useExpensiveMemo(() => {
    return barbers.map(barber => {
      const barberAppointments = appointments.filter(apt => apt.barber_id === barber.id)
      const totalRevenue = barberAppointments.reduce((sum, apt) => sum + (apt.price || 0), 0)
      const completedAppointments = barberAppointments.filter(apt => apt.status === 'completed')
      
      return {
        id: barber.id,
        name: barber.name,
        appointments: barberAppointments.length,
        completedAppointments: completedAppointments.length,
        revenue: totalRevenue,
        completionRate: barberAppointments.length > 0 
          ? (completedAppointments.length / barberAppointments.length) * 100 
          : 0,
        averageTicket: completedAppointments.length > 0 
          ? totalRevenue / completedAppointments.length 
          : 0
      }
    }).sort((a, b) => b.revenue - a.revenue)
  }, [appointments, barbers], 'barber-performance')
}

/**
 * Hook para memoização de filtros de dashboard
 */
export function useMemoizedDashboardFilters<T>(
  data: T[],
  filters: Record<string, any>
) {
  const filterFn = useCallback((item: T) => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === null || value === undefined || value === '') return true
      
      const itemValue = (item as any)[key]
      
      if (Array.isArray(value)) {
        return value.includes(itemValue)
      }
      
      if (typeof value === 'string') {
        return String(itemValue).toLowerCase().includes(value.toLowerCase())
      }
      
      return itemValue === value
    })
  }, [filters])

  return useMemo(() => {
    return data.filter(filterFn)
  }, [data, filterFn])
}

/**
 * Hook para memoização de dados de tendências
 */
export function useMemoizedTrends(
  currentData: number[],
  previousData: number[]
) {
  return useMemo(() => {
    if (currentData.length !== previousData.length) {
      return { trend: 'neutral' as const, change: 0 }
    }

    const currentSum = currentData.reduce((sum, val) => sum + val, 0)
    const previousSum = previousData.reduce((sum, val) => sum + val, 0)
    
    if (previousSum === 0) {
      return { trend: 'neutral' as const, change: 0 }
    }

    const change = ((currentSum - previousSum) / previousSum) * 100
    const trend = change > 5 ? 'up' : change < -5 ? 'down' : 'neutral'

    return { trend: trend as 'up' | 'down' | 'neutral', change }
  }, [currentData, previousData])
}