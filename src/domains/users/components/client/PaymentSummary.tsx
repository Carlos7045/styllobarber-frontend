'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { 
  CreditCard, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  CheckCircle,
  DollarSign
} from 'lucide-react'
import { formatarMoeda } from '@/shared/utils'
import { useClientAppointments } from '@/domains/appointments/hooks/use-client-appointments'
import type { ClientAppointment } from '@/types/appointments'

interface PaymentSummaryProps {
  className?: string
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({ className }) => {
  const { appointments, stats, preparePaymentRedirect } = useClientAppointments()

  // Calcular estatísticas de pagamento
  const paymentStats = React.useMemo(() => {
    const pendingPayments = appointments.filter(apt => 
      apt.status === 'concluido' && 
      (!apt.payment_status || apt.payment_status === 'pending') &&
      apt.payment_method !== 'advance'
    )

    const paidAppointments = appointments.filter(apt => 
      apt.payment_status === 'paid' || apt.payment_method === 'advance'
    )

    const totalPending = pendingPayments.reduce((sum, apt) => 
      sum + (apt.preco_final || apt.service?.preco || 0), 0
    )

    const totalPaid = paidAppointments.reduce((sum, apt) => 
      sum + (apt.preco_final || apt.service?.preco || 0), 0
    )

    const advancePayments = appointments.filter(apt => apt.payment_method === 'advance')
    const totalSaved = advancePayments.reduce((sum, apt) => 
      sum + ((apt.service?.preco || 0) * 0.1), 0
    )

    return {
      pendingPayments,
      totalPending,
      totalPaid,
      totalSaved,
      pendingCount: pendingPayments.length,
      paidCount: paidAppointments.length,
    }
  }, [appointments])

  if (appointments.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Nenhum agendamento ainda
          </h3>
          <p className="text-gray-500">
            Faça seu primeiro agendamento para ver o resumo de pagamentos
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Gasto */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Gasto</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatarMoeda(stats.valorTotalGasto)}
                </p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Economia com Pagamento Antecipado */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Economia Total</p>
                <p className="text-2xl font-bold text-primary-gold">
                  {formatarMoeda(paymentStats.totalSaved)}
                </p>
              </div>
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary-gold" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Pagando antecipado
            </p>
          </CardContent>
        </Card>

        {/* Pagamentos Pendentes */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatarMoeda(paymentStats.totalPending)}
                </p>
              </div>
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {paymentStats.pendingCount} serviço{paymentStats.pendingCount !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pagamentos Pendentes */}
      {paymentStats.pendingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Pagamentos Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentStats.pendingPayments.slice(0, 3).map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {appointment.service?.nome}
                    </h4>
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                      Não Pago
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span>
                      {new Date(appointment.data_agendamento).toLocaleDateString('pt-BR')}
                    </span>
                    <span>•</span>
                    <span>{appointment.barbeiro?.nome}</span>
                    <span>•</span>
                    <span className="font-medium text-red-600">
                      {formatarMoeda(appointment.preco_final || appointment.service?.preco || 0)}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => preparePaymentRedirect(appointment)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  💳 Pagar
                </Button>
              </div>
            ))}
            
            {paymentStats.pendingPayments.length > 3 && (
              <div className="text-center pt-2">
                <p className="text-sm text-gray-500">
                  E mais {paymentStats.pendingPayments.length - 3} pagamento{paymentStats.pendingPayments.length - 3 !== 1 ? 's' : ''} pendente{paymentStats.pendingPayments.length - 3 !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Últimos Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Últimos Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {appointments
            .filter(apt => apt.payment_status === 'paid' || apt.payment_method === 'advance')
            .slice(0, 3)
            .map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {appointment.service?.nome}
                    </h4>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {appointment.payment_method === 'advance' ? 'Pago Antecipado' : 'Pago'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span>
                      {new Date(appointment.data_agendamento).toLocaleDateString('pt-BR')}
                    </span>
                    <span>•</span>
                    <span>{appointment.barbeiro?.nome}</span>
                    <span>•</span>
                    <span className="font-medium text-green-600">
                      {formatarMoeda(appointment.preco_final || appointment.service?.preco || 0)}
                    </span>
                    {appointment.payment_method === 'advance' && (
                      <>
                        <span>•</span>
                        <span className="text-xs text-green-600 font-medium">
                          10% desconto
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-green-600">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>
            ))}
          
          {paymentStats.paidCount === 0 && (
            <div className="text-center py-4">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Nenhum pagamento realizado ainda</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dicas de Economia */}
      {paymentStats.totalSaved > 0 && (
        <Card className="bg-gradient-to-r from-primary-gold/10 to-yellow-500/10 border border-primary-gold/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary-gold/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary-gold" />
              </div>
              <div>
                <h4 className="font-semibold text-primary-gold mb-1">
                  💰 Parabéns pela economia!
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Você já economizou {formatarMoeda(paymentStats.totalSaved)} pagando antecipado. 
                  Continue assim e economize ainda mais nos próximos agendamentos!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PaymentSummary