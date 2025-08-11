'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { CreditCard, ArrowLeft, Check, Loader2 } from 'lucide-react'
import { formatarMoeda } from '@/shared/utils'
import { useClientAppointments } from '@/domains/appointments/hooks/use-client-appointments'

export default function PagamentoPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { createAppointment } = useClientAppointments()
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const amount = searchParams.get('amount')
  const type = searchParams.get('type')
  
  const [appointmentData, setAppointmentData] = useState<any>(null)

  useEffect(() => {
    // Recuperar dados do agendamento do localStorage
    const pendingData = localStorage.getItem('pendingAppointment')
    if (pendingData) {
      setAppointmentData(JSON.parse(pendingData))
    }
  }, [])

  const handlePayment = async (method: 'pix' | 'card' | 'cash') => {
    if (!appointmentData) return

    setLoading(true)
    setError(null)

    try {
      // Simular processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Criar agendamento após pagamento bem-sucedido
      const appointment = await createAppointment({
        ...appointmentData,
        payment_method: 'advance',
        payment_status: 'paid',
        payment_type: method,
      })

      console.log('✅ Pagamento processado e agendamento criado:', appointment)
      
      // Limpar dados temporários
      localStorage.removeItem('pendingAppointment')
      
      setSuccess(true)
      
      // Redirecionar após 3 segundos
      setTimeout(() => {
        router.push('/dashboard/agendamentos')
      }, 3000)

    } catch (err) {
      console.error('❌ Erro no pagamento:', err)
      setError(err instanceof Error ? err.message : 'Erro no processamento do pagamento')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-gray-700 bg-gray-800">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Pagamento Realizado!</h2>
            <p className="text-gray-400 mb-4">
              Seu agendamento foi confirmado e o pagamento processado com sucesso.
            </p>
            <p className="text-sm text-gray-500">
              Redirecionando para seus agendamentos...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-white">Pagamento</h1>
          <p className="text-gray-400">Finalize seu agendamento com pagamento antecipado</p>
        </div>

        {/* Resumo do Agendamento */}
        {appointmentData && (
          <Card className="mb-6 border-gray-700 bg-gray-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Resumo do Agendamento</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Data:</span>
                  <span className="text-white">
                    {new Date(appointmentData.data_agendamento).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Horário:</span>
                  <span className="text-white">
                    {new Date(appointmentData.data_agendamento).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-700 pt-2 mt-4">
                  <span className="text-gray-400">Total com desconto:</span>
                  <span className="text-xl font-bold text-primary-gold">
                    {formatarMoeda(appointmentData.amount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Métodos de Pagamento */}
        <Card className="border-gray-700 bg-gray-800">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Escolha a forma de pagamento</h3>
            
            {error && (
              <div className="mb-4 p-4 bg-red-900/20 border border-red-700/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {/* PIX */}
              <Button
                onClick={() => handlePayment('pix')}
                disabled={loading}
                className="w-full h-16 bg-green-600 hover:bg-green-700 text-white justify-start"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">📱</div>
                  <div className="text-left">
                    <div className="font-semibold">PIX</div>
                    <div className="text-sm opacity-90">Pagamento instantâneo</div>
                  </div>
                </div>
                {loading && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
              </Button>

              {/* Cartão */}
              <Button
                onClick={() => handlePayment('card')}
                disabled={loading}
                className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white justify-start"
              >
                <div className="flex items-center space-x-4">
                  <CreditCard className="h-6 w-6" />
                  <div className="text-left">
                    <div className="font-semibold">Cartão de Crédito/Débito</div>
                    <div className="text-sm opacity-90">Visa, Mastercard, Elo</div>
                  </div>
                </div>
                {loading && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
              </Button>

              {/* Dinheiro */}
              <Button
                onClick={() => handlePayment('cash')}
                disabled={loading}
                className="w-full h-16 bg-yellow-600 hover:bg-yellow-700 text-white justify-start"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">💰</div>
                  <div className="text-left">
                    <div className="font-semibold">Dinheiro</div>
                    <div className="text-sm opacity-90">Pagamento na barbearia</div>
                  </div>
                </div>
                {loading && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
              </Button>
            </div>

            <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-400 text-center">
                🔒 Pagamento seguro e protegido
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}