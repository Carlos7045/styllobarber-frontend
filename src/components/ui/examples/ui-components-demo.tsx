'use client'

import React, { useState } from 'react'
import { Modal } from '../modal'
import { DatePicker } from '../date-picker'
import { TimePicker } from '../time-picker'
import { ConfirmDialog, useConfirmDialog } from '../confirm-dialog'
import { Button } from '../button'

/**
 * Componente de demonstração dos componentes UI base
 * Este exemplo mostra como usar os componentes criados na tarefa 3
 */
export const UIComponentsDemo = () => {
  // Estados para controlar os modais
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  // Hook para confirmação imperativa
  const { confirm, ConfirmDialogComponent } = useConfirmDialog()

  // Dados de exemplo para disponibilidade
  const dateAvailability = [
    { date: '2024-01-15', available: true },
    { date: '2024-01-16', available: false },
    { date: '2024-01-17', available: true },
    { date: '2024-01-18', available: true },
    { date: '2024-01-19', available: false },
  ]

  const timeSlots = [
    { time: '09:00', available: true },
    { time: '09:30', available: true },
    { time: '10:00', available: false },
    { time: '10:30', available: true },
    { time: '14:00', available: true },
    { time: '14:30', available: false },
    { time: '15:00', available: true },
    { time: '19:00', available: true },
    { time: '19:30', available: true },
  ]

  const handleConfirmAction = async () => {
    const result = await confirm({
      title: 'Confirmar agendamento',
      description: 'Deseja realmente agendar este horário?',
      variant: 'success',
      confirmText: 'Sim, agendar',
      cancelText: 'Cancelar',
    })

    if (result) {
      alert('Agendamento confirmado!')
    }
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">
        Demonstração dos Componentes UI Base
      </h1>

      {/* Seção Modal */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Modal Component</h2>
        <p className="text-text-muted">
          Modal reutilizável com acessibilidade completa
        </p>
        
        <Button onClick={() => setIsModalOpen(true)}>
          Abrir Modal
        </Button>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Exemplo de Modal"
          description="Este é um modal de exemplo com título e descrição"
          size="md"
        >
          <div className="space-y-4">
            <p>
              Este modal demonstra as funcionalidades básicas:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Overlay com blur</li>
              <li>Animações de entrada e saída</li>
              <li>Botão de fechar acessível</li>
              <li>Escape para fechar</li>
              <li>Click no overlay para fechar</li>
              <li>Focus trap</li>
            </ul>
            
            <div className="flex gap-2 pt-4">
              <Button variant="primary">
                Ação Principal
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </Modal>
      </div>

      {/* Seção DatePicker */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">DatePicker Component</h2>
        <p className="text-text-muted">
          Seletor de data integrado com disponibilidade de horários
        </p>
        
        <div className="max-w-sm">
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            availability={dateAvailability}
            showAvailabilityIndicator
            placeholder="Selecione uma data"
            minDate={new Date()}
          />
        </div>

        {selectedDate && (
          <div className="p-4 bg-success/10 rounded-lg">
            <p className="text-success font-medium">
              Data selecionada: {selectedDate.toLocaleDateString('pt-BR')}
            </p>
          </div>
        )}
      </div>

      {/* Seção TimePicker */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">TimePicker Component</h2>
        <p className="text-text-muted">
          Seletor de horário com slots disponíveis agrupados por período
        </p>
        
        <div className="max-w-sm">
          <TimePicker
            value={selectedTime}
            onChange={setSelectedTime}
            timeSlots={timeSlots}
            showAvailabilityCount
            placeholder="Selecione um horário"
          />
        </div>

        {selectedTime && (
          <div className="p-4 bg-primary-gold/10 rounded-lg">
            <p className="text-primary-gold font-medium">
              Horário selecionado: {selectedTime}
            </p>
          </div>
        )}
      </div>

      {/* Seção ConfirmDialog */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">ConfirmDialog Component</h2>
        <p className="text-text-muted">
          Diálogos de confirmação para ações críticas
        </p>
        
        <div className="flex gap-4 flex-wrap">
          <Button 
            variant="primary"
            onClick={() => setIsConfirmOpen(true)}
          >
            Confirmação Básica
          </Button>

          <Button 
            variant="destructive"
            onClick={handleConfirmAction}
          >
            Confirmação Imperativa
          </Button>
        </div>

        <ConfirmDialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={() => {
            alert('Ação confirmada!')
            setIsConfirmOpen(false)
          }}
          title="Confirmar ação"
          description="Esta ação não pode ser desfeita. Deseja continuar?"
          variant="warning"
          confirmText="Sim, continuar"
          cancelText="Cancelar"
        />

        {/* Componente do hook imperativo */}
        {ConfirmDialogComponent}
      </div>

      {/* Resumo das funcionalidades */}
      <div className="mt-12 p-6 bg-background-dark-secondary rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Funcionalidades Implementadas</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Modal</h4>
            <ul className="text-sm text-text-muted space-y-1">
              <li>• Acessibilidade completa (ARIA, focus trap)</li>
              <li>• Múltiplos tamanhos</li>
              <li>• Animações suaves</li>
              <li>• Controle de fechamento</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">DatePicker</h4>
            <ul className="text-sm text-text-muted space-y-1">
              <li>• Calendário interativo</li>
              <li>• Indicadores de disponibilidade</li>
              <li>• Navegação entre meses</li>
              <li>• Datas mínimas/máximas</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">TimePicker</h4>
            <ul className="text-sm text-text-muted space-y-1">
              <li>• Slots agrupados por período</li>
              <li>• Contador de disponibilidade</li>
              <li>• Horários indisponíveis</li>
              <li>• Formato 24h/12h</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">ConfirmDialog</h4>
            <ul className="text-sm text-text-muted space-y-1">
              <li>• Múltiplas variantes (success, error, warning)</li>
              <li>• Hook imperativo</li>
              <li>• Componentes pré-configurados</li>
              <li>• Estados de loading</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UIComponentsDemo