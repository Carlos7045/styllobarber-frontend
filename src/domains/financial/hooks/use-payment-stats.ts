/**
 * Hook para estatísticas de pagamento do cliente
 * Calcula métricas financeiras e de pagamento
 */

import { useMemo } from 'react'
import { useClientAppointments } from '@/domains/appointments/hooks/use-client-appointments'
import type { ClientAppointment } from '@/types/appointments'

interface PaymentStats {
  // Totais
  totalGasto: number
  totalEconomizado: number
  totalPendente: number
  
  // Contadores
  totalAgendamentos: number
  agendamentosPagos: number
  agendamentosPendentes: number
  pagamentosAntecipados: number
  
  // Listas
  pagamentosPendentes: ClientAppointment[]
  ultimosPagamentos: ClientAppointment[]
  
  // Métricas
  percentualPago: number
  economiaMedia: number
  ticketMedio: number
  
  // Métodos de pagamento
  metodosUsados: {
    advance: number
    local: number
    cash: number
    card: number
    pix: number
  }
}

export function usePaymentStats(): PaymentStats {
  const { appointments } = useClientAppointments()

  return useMemo(() => {
    // Filtros básicos
    const agendamentosCompletos = appointments.filter(apt => apt.status === 'concluido')
    const agendamentosPagos = appointments.filter(apt => 
      apt.payment_status === 'paid' || apt.payment_method === 'advance'
    )
    const agendamentosPendentes = appointments.filter(apt => 
      apt.status === 'concluido' && 
      (!apt.payment_status || apt.payment_status === 'pending') &&
      apt.payment_method !== 'advance'
    )
    const pagamentosAntecipados = appointments.filter(apt => apt.payment_method === 'advance')

    // Cálculos de valores
    const totalGasto = agendamentosPagos.reduce((sum, apt) => 
      sum + (apt.preco_final || apt.service?.preco || 0), 0
    )

    const totalPendente = agendamentosPendentes.reduce((sum, apt) => 
      sum + (apt.preco_final || apt.service?.preco || 0), 0
    )

    const totalEconomizado = pagamentosAntecipados.reduce((sum, apt) => 
      sum + ((apt.service?.preco || 0) * 0.1), 0
    )

    // Métricas
    const percentualPago = agendamentosCompletos.length > 0 
      ? (agendamentosPagos.length / agendamentosCompletos.length) * 100 
      : 0

    const economiaMedia = pagamentosAntecipados.length > 0 
      ? totalEconomizado / pagamentosAntecipados.length 
      : 0

    const ticketMedio = agendamentosPagos.length > 0 
      ? totalGasto / agendamentosPagos.length 
      : 0

    // Métodos de pagamento
    const metodosUsados = appointments.reduce((acc, apt) => {
      if (apt.payment_method) {
        acc[apt.payment_method] = (acc[apt.payment_method] || 0) + 1
      }
      return acc
    }, {
      advance: 0,
      local: 0,
      cash: 0,
      card: 0,
      pix: 0,
    } as PaymentStats['metodosUsados'])

    // Listas ordenadas
    const ultimosPagamentos = agendamentosPagos
      .sort((a, b) => new Date(b.data_agendamento).getTime() - new Date(a.data_agendamento).getTime())
      .slice(0, 5)

    const pagamentosPendentes = agendamentosPendentes
      .sort((a, b) => new Date(a.data_agendamento).getTime() - new Date(b.data_agendamento).getTime())

    return {
      // Totais
      totalGasto,
      totalEconomizado,
      totalPendente,
      
      // Contadores
      totalAgendamentos: appointments.length,
      agendamentosPagos: agendamentosPagos.length,
      agendamentosPendentes: agendamentosPendentes.length,
      pagamentosAntecipados: pagamentosAntecipados.length,
      
      // Listas
      pagamentosPendentes,
      ultimosPagamentos,
      
      // Métricas
      percentualPago: Math.round(percentualPago),
      economiaMedia,
      ticketMedio,
      
      // Métodos de pagamento
      metodosUsados,
    }
  }, [appointments])
}

export default usePaymentStats