'use client'

import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import type { ClientAppointment } from '@/types/appointments'

interface ReagendamentoModalSimplesProps {
  isOpen: boolean
  onClose: () => void
  appointment: ClientAppointment | null
}

export const ReagendamentoModalSimples: React.FC<ReagendamentoModalSimplesProps> = ({
  isOpen,
  onClose,
  appointment,
}) => {
  console.log('🔄 ReagendamentoModalSimples renderizado:', { 
    isOpen, 
    appointment: !!appointment,
    appointmentId: appointment?.id,
    timestamp: new Date().toISOString()
  })
  
  if (!isOpen) {
    console.log('❌ Modal não está aberto (isOpen=false)')
    return null
  }
  
  if (!appointment) {
    console.log('❌ Appointment é null/undefined')
    return null
  }
  
  console.log('✅ Modal vai renderizar!')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-lg shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Reagendar Agendamento
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Reagendar agendamento de <strong>{appointment.service?.nome}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Data atual: {new Date(appointment.data_agendamento).toLocaleString('pt-BR')}
            </p>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={onClose} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  console.log('✅ Reagendamento confirmado!')
                  alert('Funcionalidade de reagendamento em desenvolvimento!')
                  onClose()
                }} 
                className="flex-1"
              >
                Continuar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReagendamentoModalSimples