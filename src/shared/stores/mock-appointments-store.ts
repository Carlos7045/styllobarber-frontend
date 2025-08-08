/**
 * Store temporário global para agendamentos simulados
 * Permite que agendamentos criados durante desenvolvimento apareçam em todas as páginas
 */

// Store temporário global para agendamentos simulados
let mockAppointmentsStore: any[] = []

// Listeners para mudanças no store
let listeners: (() => void)[] = []

// Função para adicionar agendamento ao store
export const addMockAppointment = (appointment: any) => {
  mockAppointmentsStore.push(appointment)
  console.log('📝 Agendamento adicionado ao store temporário:', appointment)
  console.log('📋 Total de agendamentos no store:', mockAppointmentsStore.length)

  // Notificar listeners
  listeners.forEach((listener) => listener())
}

// Função para obter agendamentos do store
export const getMockAppointments = () => {
  return [...mockAppointmentsStore]
}

// Função para obter agendamentos de um cliente específico
export const getMockAppointmentsByClient = (clientId: string) => {
  return mockAppointmentsStore.filter((apt) => apt.cliente_id === clientId)
}

// Função para obter todos os agendamentos (para admin)
export const getAllMockAppointments = () => {
  return [...mockAppointmentsStore]
}

// Função para limpar o store (útil para testes)
export const clearMockAppointments = () => {
  mockAppointmentsStore = []
  console.log('🗑️ Store de agendamentos simulados limpo')

  // Notificar listeners
  listeners.forEach((listener) => listener())
}

// Função para adicionar listener de mudanças
export const addMockAppointmentsListener = (listener: () => void) => {
  listeners.push(listener)

  // Retornar função para remover listener
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

// Função para atualizar status de um agendamento
export const updateMockAppointmentStatus = (appointmentId: string, newStatus: string) => {
  const appointmentIndex = mockAppointmentsStore.findIndex((apt) => apt.id === appointmentId)

  if (appointmentIndex !== -1) {
    mockAppointmentsStore[appointmentIndex] = {
      ...mockAppointmentsStore[appointmentIndex],
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    console.log('📝 Status do agendamento atualizado:', {
      id: appointmentId,
      novoStatus: newStatus,
    })

    // Notificar listeners
    listeners.forEach((listener) => listener())

    return mockAppointmentsStore[appointmentIndex]
  }

  return null
}

// Função para remover agendamento (cancelar)
export const removeMockAppointment = (appointmentId: string) => {
  const initialLength = mockAppointmentsStore.length
  mockAppointmentsStore = mockAppointmentsStore.filter((apt) => apt.id !== appointmentId)

  if (mockAppointmentsStore.length < initialLength) {
    console.log('🗑️ Agendamento removido do store:', appointmentId)

    // Notificar listeners
    listeners.forEach((listener) => listener())

    return true
  }

  return false
}

// Hook React para usar o store
import { useState, useEffect } from 'react'

export const useMockAppointments = () => {
  const [appointments, setAppointments] = useState(getMockAppointments())

  useEffect(() => {
    const unsubscribe = addMockAppointmentsListener(() => {
      setAppointments(getMockAppointments())
    })

    return unsubscribe
  }, [])

  return {
    appointments,
    addAppointment: addMockAppointment,
    updateStatus: updateMockAppointmentStatus,
    removeAppointment: removeMockAppointment,
    clearAll: clearMockAppointments,
  }
}

// Hook para admin (todos os agendamentos)
export const useMockAppointmentsAdmin = () => {
  const [appointments, setAppointments] = useState(getAllMockAppointments())

  useEffect(() => {
    const unsubscribe = addMockAppointmentsListener(() => {
      setAppointments(getAllMockAppointments())
    })

    return unsubscribe
  }, [])

  return {
    appointments,
    addAppointment: addMockAppointment,
    updateStatus: updateMockAppointmentStatus,
    removeAppointment: removeMockAppointment,
    clearAll: clearMockAppointments,
  }
}

// Hook para cliente específico
export const useMockAppointmentsClient = (clientId: string) => {
  const [appointments, setAppointments] = useState(getMockAppointmentsByClient(clientId))

  useEffect(() => {
    const unsubscribe = addMockAppointmentsListener(() => {
      setAppointments(getMockAppointmentsByClient(clientId))
    })

    return unsubscribe
  }, [clientId])

  return {
    appointments,
    addAppointment: addMockAppointment,
    updateStatus: updateMockAppointmentStatus,
    removeAppointment: removeMockAppointment,
  }
}
