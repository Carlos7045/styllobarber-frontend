/**
 * Testes de integração para appointment-utils
 * Valida toda a lógica de duração, intervalos e conflitos
 */

import {
  hasTimeOverlap,
  calculateEndTime,
  getOccupiedSlots,
  calculateBlockedSlots,
  calculateIntervalBlockedSlots,
  checkSlotAvailability,
  conflictsWithInterval,
  appointmentsConflict,
  SlotUnavailableReason,
  type AppointmentSlot,
  type IntervalConfig,
} from '../appointment-utils'

describe('appointment-utils', () => {
  // Dados de teste
  const testDate = '2025-02-07'
  const testAppointments: AppointmentSlot[] = [
    {
      inicio: new Date('2025-02-07T14:00:00'),
      fim: new Date('2025-02-07T15:30:00'),
      barbeiroId: 'barbeiro1',
      servicoId: 'corte-premium',
      duracaoMinutos: 90,
    },
    {
      inicio: new Date('2025-02-07T16:00:00'),
      fim: new Date('2025-02-07T16:30:00'),
      barbeiroId: 'barbeiro2',
      servicoId: 'barba',
      duracaoMinutos: 30,
    },
  ]

  const intervalConfig: IntervalConfig = {
    inicio: '12:00',
    fim: '13:00',
  }

  describe('hasTimeOverlap', () => {
    it('should detect overlap between periods', () => {
      const start1 = new Date('2025-02-07T14:00:00')
      const end1 = new Date('2025-02-07T15:30:00')
      const start2 = new Date('2025-02-07T14:30:00')
      const end2 = new Date('2025-02-07T15:00:00')

      expect(hasTimeOverlap(start1, end1, start2, end2)).toBe(true)
    })

    it('should not detect overlap when periods are separate', () => {
      const start1 = new Date('2025-02-07T14:00:00')
      const end1 = new Date('2025-02-07T15:30:00')
      const start2 = new Date('2025-02-07T16:00:00')
      const end2 = new Date('2025-02-07T16:30:00')

      expect(hasTimeOverlap(start1, end1, start2, end2)).toBe(false)
    })

    it('should detect adjacent periods as non-overlapping', () => {
      const start1 = new Date('2025-02-07T14:00:00')
      const end1 = new Date('2025-02-07T15:00:00')
      const start2 = new Date('2025-02-07T15:00:00')
      const end2 = new Date('2025-02-07T16:00:00')

      expect(hasTimeOverlap(start1, end1, start2, end2)).toBe(false)
    })
  })

  describe('calculateEndTime', () => {
    it('should calculate correct end time for 90 minutes', () => {
      const startTime = new Date('2025-02-07T14:00:00')
      const endTime = calculateEndTime(startTime, 90)

      expect(endTime.getHours()).toBe(15)
      expect(endTime.getMinutes()).toBe(30)
    })

    it('should calculate correct end time for 30 minutes', () => {
      const startTime = new Date('2025-02-07T14:30:00')
      const endTime = calculateEndTime(startTime, 30)

      expect(endTime.getHours()).toBe(15)
      expect(endTime.getMinutes()).toBe(0)
    })
  })

  describe('getOccupiedSlots', () => {
    it('should return correct slots for 90-minute appointment', () => {
      const startTime = new Date('2025-02-07T14:00:00')
      const slots = getOccupiedSlots(startTime, 90, 30)

      expect(slots).toEqual(['14:00', '14:30', '15:00', '15:30'])
    })

    it('should return correct slots for 60-minute appointment', () => {
      const startTime = new Date('2025-02-07T15:30:00')
      const slots = getOccupiedSlots(startTime, 60, 30)

      expect(slots).toEqual(['15:30', '16:00', '16:30'])
    })

    it('should return single slot for 30-minute appointment', () => {
      const startTime = new Date('2025-02-07T16:00:00')
      const slots = getOccupiedSlots(startTime, 30, 30)

      expect(slots).toEqual(['16:00', '16:30'])
    })
  })

  describe('calculateBlockedSlots', () => {
    it('should calculate all blocked slots from appointments', () => {
      const blockedSlots = calculateBlockedSlots(testAppointments, testDate, 30)
      const slotsArray = Array.from(blockedSlots).sort()

      expect(slotsArray).toEqual(['14:00', '14:30', '15:00', '15:30', '16:00', '16:30'])
    })

    it('should handle empty appointments array', () => {
      const blockedSlots = calculateBlockedSlots([], testDate, 30)

      expect(blockedSlots.size).toBe(0)
    })
  })

  describe('calculateIntervalBlockedSlots', () => {
    it('should calculate blocked slots for lunch interval', () => {
      const blockedSlots = calculateIntervalBlockedSlots('12:00', '13:00', testDate, 30)
      const slotsArray = Array.from(blockedSlots).sort()

      expect(slotsArray).toEqual(['12:00', '12:30', '13:00'])
    })

    it('should handle 90-minute interval', () => {
      const blockedSlots = calculateIntervalBlockedSlots('12:00', '13:30', testDate, 30)
      const slotsArray = Array.from(blockedSlots).sort()

      expect(slotsArray).toEqual(['12:00', '12:30', '13:00', '13:30'])
    })
  })

  describe('conflictsWithInterval', () => {
    it('should detect conflict when appointment starts during interval', () => {
      const appointmentStart = new Date('2025-02-07T12:30:00')
      const appointmentEnd = new Date('2025-02-07T13:30:00')

      const hasConflict = conflictsWithInterval(
        appointmentStart,
        appointmentEnd,
        '12:00',
        '13:00',
        testDate
      )

      expect(hasConflict).toBe(true)
    })

    it('should detect conflict when appointment spans interval', () => {
      const appointmentStart = new Date('2025-02-07T11:30:00')
      const appointmentEnd = new Date('2025-02-07T13:30:00')

      const hasConflict = conflictsWithInterval(
        appointmentStart,
        appointmentEnd,
        '12:00',
        '13:00',
        testDate
      )

      expect(hasConflict).toBe(true)
    })

    it('should not detect conflict when appointment is before interval', () => {
      const appointmentStart = new Date('2025-02-07T10:00:00')
      const appointmentEnd = new Date('2025-02-07T11:30:00')

      const hasConflict = conflictsWithInterval(
        appointmentStart,
        appointmentEnd,
        '12:00',
        '13:00',
        testDate
      )

      expect(hasConflict).toBe(false)
    })
  })

  describe('appointmentsConflict', () => {
    it('should detect conflict between appointments for same barber', () => {
      const appointment1: AppointmentSlot = {
        inicio: new Date('2025-02-07T14:00:00'),
        fim: new Date('2025-02-07T15:30:00'),
        barbeiroId: 'barbeiro1',
        servicoId: 'service1',
        duracaoMinutos: 90,
      }

      const appointment2: AppointmentSlot = {
        inicio: new Date('2025-02-07T14:30:00'),
        fim: new Date('2025-02-07T15:00:00'),
        barbeiroId: 'barbeiro1',
        servicoId: 'service2',
        duracaoMinutos: 30,
      }

      expect(appointmentsConflict(appointment1, appointment2)).toBe(true)
    })

    it('should not detect conflict between appointments for different barbers', () => {
      const appointment1: AppointmentSlot = {
        inicio: new Date('2025-02-07T14:00:00'),
        fim: new Date('2025-02-07T15:30:00'),
        barbeiroId: 'barbeiro1',
        servicoId: 'service1',
        duracaoMinutos: 90,
      }

      const appointment2: AppointmentSlot = {
        inicio: new Date('2025-02-07T14:30:00'),
        fim: new Date('2025-02-07T15:00:00'),
        barbeiroId: 'barbeiro2',
        servicoId: 'service2',
        duracaoMinutos: 30,
      }

      expect(appointmentsConflict(appointment1, appointment2)).toBe(false)
    })
  })

  describe('checkSlotAvailability', () => {
    it('should return available for free slot', () => {
      const availability = checkSlotAvailability(
        testDate,
        '10:00',
        30,
        testAppointments,
        intervalConfig,
        'barbeiro1'
      )

      expect(availability.available).toBe(true)
      expect(availability.reason).toBeUndefined()
    })

    it('should return unavailable for occupied slot', () => {
      const availability = checkSlotAvailability(
        testDate,
        '14:00',
        30,
        testAppointments,
        intervalConfig,
        'barbeiro1'
      )

      expect(availability.available).toBe(false)
      expect(availability.reason).toBe(SlotUnavailableReason.OCCUPIED)
      expect(availability.occupiedUntil).toBe('15:30')
    })

    it('should return unavailable for interval slot', () => {
      const availability = checkSlotAvailability(
        testDate,
        '12:30',
        30,
        testAppointments,
        intervalConfig,
        'barbeiro1'
      )

      expect(availability.available).toBe(false)
      expect(availability.reason).toBe(SlotUnavailableReason.INTERVAL)
      expect(availability.message).toContain('Horário de intervalo')
    })

    it('should return available for different barber', () => {
      const availability = checkSlotAvailability(
        testDate,
        '14:00',
        30,
        testAppointments,
        intervalConfig,
        'barbeiro3'
      )

      expect(availability.available).toBe(true)
    })
  })

  describe('Performance Tests', () => {
    it('should handle large number of appointments efficiently', () => {
      // Criar 1000 agendamentos
      const manyAppointments: AppointmentSlot[] = []
      for (let i = 0; i < 1000; i++) {
        const hour = 8 + (i % 10)
        const minute = (i % 2) * 30
        manyAppointments.push({
          inicio: new Date(
            `2025-02-07T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`
          ),
          fim: new Date(
            `2025-02-07T${hour.toString().padStart(2, '0')}:${(minute + 30).toString().padStart(2, '0')}:00`
          ),
          barbeiroId: `barbeiro${i % 10}`,
          servicoId: `service${i}`,
          duracaoMinutos: 30,
        })
      }

      const startTime = performance.now()

      const blockedSlots = calculateBlockedSlots(manyAppointments, testDate, 30)

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(100) // Deve completar em menos de 100ms
      expect(blockedSlots.size).toBeGreaterThan(0)
    })

    it('should check availability quickly with many appointments', () => {
      const manyAppointments: AppointmentSlot[] = []
      for (let i = 0; i < 500; i++) {
        const hour = 8 + (i % 10)
        manyAppointments.push({
          inicio: new Date(`2025-02-07T${hour.toString().padStart(2, '0')}:00:00`),
          fim: new Date(`2025-02-07T${hour.toString().padStart(2, '0')}:30:00`),
          barbeiroId: `barbeiro${i % 5}`,
          servicoId: `service${i}`,
          duracaoMinutos: 30,
        })
      }

      const startTime = performance.now()

      const availability = checkSlotAvailability(
        testDate,
        '15:00',
        60,
        manyAppointments,
        intervalConfig,
        'barbeiro1'
      )

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(50) // Deve completar em menos de 50ms
      expect(availability).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle appointments at midnight', () => {
      const midnightAppointment: AppointmentSlot = {
        inicio: new Date('2025-02-07T23:30:00'),
        fim: new Date('2025-02-08T00:30:00'),
        barbeiroId: 'barbeiro1',
        servicoId: 'service1',
        duracaoMinutos: 60,
      }

      const slots = getOccupiedSlots(midnightAppointment.inicio, 60, 30)
      expect(slots).toContain('23:30')
    })

    it('should handle very long appointments', () => {
      const longAppointment: AppointmentSlot = {
        inicio: new Date('2025-02-07T09:00:00'),
        fim: new Date('2025-02-07T12:00:00'),
        barbeiroId: 'barbeiro1',
        servicoId: 'service1',
        duracaoMinutos: 180,
      }

      const slots = getOccupiedSlots(longAppointment.inicio, 180, 30)
      expect(slots.length).toBe(7) // 09:00, 09:30, 10:00, 10:30, 11:00, 11:30, 12:00
    })

    it('should handle appointments with no barber specified', () => {
      const appointment: AppointmentSlot = {
        inicio: new Date('2025-02-07T14:00:00'),
        fim: new Date('2025-02-07T14:30:00'),
        servicoId: 'service1',
        duracaoMinutos: 30,
      }

      const availability = checkSlotAvailability(
        testDate,
        '14:00',
        30,
        [appointment],
        intervalConfig
      )

      expect(availability.available).toBe(false)
    })
  })
})
