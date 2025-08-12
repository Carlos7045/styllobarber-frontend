'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { CreditCard, ArrowLeft, Check, Loader2 } from 'lucide-react'
import { formatarMoeda } from '@/shared/utils'
import { useClientAppointments } from '@/domains/appointments/hooks/use-client-appointments'
import { asaasService } from '@/lib/services/asaas-service'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import AsaasDebug from '@/components/debug/AsaasDebug'

export default function PagamentoPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { createAppointment } = useClientAppointments()
  const { profile } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pixData, setPixData] = useState<{ qrCode?: string; payload?: string } | null>(null)
  
  const amount = searchParams.get('amount')
  const type = searchParams.get('type')
  
  const [appointmentData, setAppointmentData] = useState<any>(null)

  useEffect(() => {
    // Recuperar dados do localStorage baseado no tipo de pagamento
    if (type === 'service') {
      // Pagamento de serviço já realizado
      const pendingPayment = localStorage.getItem('pendingPayment')
      if (pendingPayment) {
        setAppointmentData(JSON.parse(pendingPayment))
      }
    } else {
      // Pagamento antecipado de novo agendamento
      const pendingAppointment = localStorage.getItem('pendingAppointment')
      if (pendingAppointment) {
        setAppointmentData(JSON.parse(pendingAppointment))
      }
    }
  }, [type])

  const handlePayment = async (method: 'pix' | 'card' | 'cash') => {
    if (!appointmentData || !profile) return

    setLoading(true)
    setError(null)
    setPixData(null)

    try {
      // Preparar dados do cliente para o Asaas
      const customerData = {
        name: profile.nome || 'Cliente',
        email: profile.email || '',
        phone: profile.telefone || undefined,
      }

      // Preparar dados do pagamento
      const paymentData = {
        amount: appointmentData.amount,
        description: type === 'service' 
          ? `Pagamento - ${appointmentData.service_name}`
          : `Agendamento - ${appointmentData.service_name || 'Serviço'}`,
        appointmentId: type === 'service' 
          ? appointmentData.appointment_id 
          : `temp-${Date.now()}`,
        paymentMethod: method,
      }

      console.log('💳 Processando pagamento via Asaas:', { customerData, paymentData })

      // Processar pagamento via Asaas
      const paymentResult = await asaasService.processAppointmentPayment(
        customerData,
        paymentData
      )

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Erro ao processar pagamento')
      }

      console.log('✅ Pagamento processado via Asaas:', paymentResult)

      // Se for PIX, mostrar QR Code
      if (method === 'pix' && paymentResult.pixQrCode) {
        setPixData({
          qrCode: paymentResult.pixQrCode,
          payload: paymentResult.pixPayload,
        })
        
        // Para PIX, não marcar como sucesso imediatamente
        // O usuário precisa pagar primeiro
        return
      }

      if (type === 'service') {
        // Pagamento de serviço já realizado - atualizar status do agendamento
        console.log('💳 Atualizando status do agendamento:', appointmentData.appointment_id)
        
        try {
          // Atualizar status no banco de dados
          const { error: updateError } = await supabase
            .from('appointments')
            .update({
              payment_status: method === 'pix' ? 'pending' : 'paid',
              payment_method: method === 'cash' ? 'cash' : method === 'card' ? 'card' : 'pix',
              payment_date: method !== 'pix' ? new Date().toISOString() : null,
              asaas_payment_id: paymentResult.paymentId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', appointmentData.appointment_id)

          if (updateError) {
            console.error('Erro ao atualizar agendamento:', updateError)
            throw new Error(`Erro ao atualizar status do pagamento: ${updateError.message}`)
          }

          console.log('✅ Agendamento atualizado com sucesso')
          localStorage.removeItem('pendingPayment')
        } catch (updateError) {
          console.error('❌ Erro ao atualizar agendamento:', updateError)
          throw new Error('Erro ao atualizar status do pagamento')
        }
        
      } else {
        // Pagamento antecipado - criar novo agendamento
        const appointment = await createAppointment({
          ...appointmentData,
          payment_method: 'advance',
          payment_status: 'paid',
          payment_type: method,
          asaas_payment_id: paymentResult.paymentId,
        })

        console.log('✅ Agendamento criado com pagamento:', appointment)
        localStorage.removeItem('pendingAppointment')
      }
      
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

  // Tela de sucesso
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
              {type === 'service' 
                ? 'O pagamento do seu serviço foi processado com sucesso.'
                : 'Seu agendamento foi confirmado e o pagamento processado com sucesso.'
              }
            </p>
            <p className="text-sm text-gray-500">
              Redirecionando para seus agendamentos...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Tela do QR Code PIX
  if (pixData) {
    return (
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-md mx-auto">
          <Button
            variant="ghost"
            onClick={() => setPixData(null)}
            className="mb-4 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <Card className="border-gray-700 bg-gray-800">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Pagamento PIX</h2>
              
              {pixData.qrCode && (
                <div className="mb-6">
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <img 
                      src={`data:image/png;base64,${pixData.qrCode}`}
                      alt="QR Code PIX"
                      className="w-48 h-48"
                    />
                  </div>
                </div>
              )}

              <p className="text-gray-400 mb-4">
                Escaneie o QR Code com o app do seu banco ou copie o código PIX
              </p>

              {pixData.payload && (
                <div className="mb-6">
                  <div className="bg-gray-700 p-3 rounded-lg text-left">
                    <p className="text-xs text-gray-400 mb-1">Código PIX:</p>
                    <p className="text-sm text-white font-mono break-all">
                      {pixData.payload}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      navigator.clipboard.writeText(pixData.payload!)
                      // Aqui você poderia mostrar um toast de sucesso
                    }}
                  >
                    Copiar Código PIX
                  </Button>
                </div>
              )}

              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">
                  Após o pagamento, você será redirecionado automaticamente
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPixData(null)
                    setSuccess(true)
                    setTimeout(() => router.push('/dashboard/agendamentos'), 2000)
                  }}
                >
                  Já paguei
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
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
          <p className="text-gray-400">
            {type === 'service' 
              ? 'Finalize o pagamento do seu serviço'
              : 'Finalize seu agendamento com pagamento antecipado'
            }
          </p>
        </div>

        {/* Resumo do Agendamento/Serviço */}
        {appointmentData && (
          <Card className="mb-6 border-gray-700 bg-gray-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {type === 'service' ? 'Resumo do Serviço' : 'Resumo do Agendamento'}
              </h3>
              <div className="space-y-2 text-sm">
                {type === 'service' ? (
                  // Resumo para pagamento de serviço
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Serviço:</span>
                      <span className="text-white">{appointmentData.service_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Barbeiro:</span>
                      <span className="text-white">{appointmentData.barbeiro_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Data:</span>
                      <span className="text-white">{appointmentData.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Horário:</span>
                      <span className="text-white">{appointmentData.time}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-700 pt-2 mt-4">
                      <span className="text-gray-400">Total a pagar:</span>
                      <span className="text-xl font-bold text-primary-gold">
                        {formatarMoeda(appointmentData.amount)}
                      </span>
                    </div>
                  </>
                ) : (
                  // Resumo para pagamento antecipado
                  <>
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
                    <div className="text-center mt-2">
                      <span className="text-xs text-green-400">✓ 10% de desconto aplicado</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Métodos de Pagamento */}
        <Card className="border-gray-700 bg-gray-800">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Escolha a forma de pagamento</h3>
            <p className="text-gray-400 mb-6">Selecione o método mais conveniente para você</p>
            
            {error && (
              <div className="mb-4 p-4 bg-red-900/20 border border-red-700/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* PIX - Recomendado */}
              <div className="relative">
                <Button
                  onClick={() => handlePayment('pix')}
                  disabled={loading}
                  className="w-full h-20 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white justify-start relative overflow-hidden"
                >
                  <div className="flex items-center space-x-4 z-10">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <div className="text-2xl">📱</div>
                    </div>
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-bold">PIX</div>
                        <span className="bg-yellow-400 text-green-900 text-xs font-bold px-2 py-1 rounded-full">
                          INSTANTÂNEO
                        </span>
                      </div>
                      <div className="text-sm opacity-90">Aprovação imediata • Sem taxas</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-green-200">⚡ Mais rápido</div>
                    </div>
                  </div>
                  {loading && <Loader2 className="absolute right-4 h-5 w-5 animate-spin" />}
                </Button>
              </div>

              {/* Cartão */}
              <Button
                onClick={() => handlePayment('card')}
                disabled={loading}
                className="w-full h-20 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white justify-start"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold">Cartão de Crédito/Débito</div>
                    <div className="text-sm opacity-90">Visa • Mastercard • Elo • Parcelamento disponível</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-blue-200">💳 Tradicional</div>
                  </div>
                </div>
                {loading && <Loader2 className="absolute right-4 h-5 w-5 animate-spin" />}
              </Button>

              {/* Dinheiro */}
              <Button
                onClick={() => handlePayment('cash')}
                disabled={loading}
                className="w-full h-20 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white justify-start"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <div className="text-2xl">💰</div>
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold">Dinheiro</div>
                    <div className="text-sm opacity-90">Pagamento presencial na barbearia</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-yellow-200">🏪 No local</div>
                  </div>
                </div>
                {loading && <Loader2 className="absolute right-4 h-5 w-5 animate-spin" />}
              </Button>
            </div>

            {/* Informações de segurança */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-center gap-2 p-4 bg-gray-700/50 rounded-lg">
                <div className="text-green-400">🔒</div>
                <p className="text-sm text-gray-300 font-medium">
                  Pagamento 100% seguro e protegido
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                <div className="text-center">
                  <div className="text-green-400 mb-1">⚡</div>
                  <div>Processamento instantâneo</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-400 mb-1">🛡️</div>
                  <div>Dados criptografados</div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-400 mb-1">✅</div>
                  <div>Confirmação automática</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}