import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/api/supabase'
import type { HorarioFuncionamentoDia } from '@/shared/utils/date-utils'

interface HorarioFuncionamentoDB {
  id: string
  dia_semana: number // 0-6 (domingo-sábado)
  horario_inicio: string
  horario_fim: string
  intervalo_inicio?: string
  intervalo_fim?: string
  ativo: boolean
}

interface UseHorariosFuncionamentoReturn {
  horarios: Record<number, HorarioFuncionamentoDia>
  loading: boolean
  error: string | null
  getHorarioPorDia: (diaSemana: number) => HorarioFuncionamentoDia | null
  refetch: () => Promise<void>
}

export function useHorariosFuncionamento(): UseHorariosFuncionamentoReturn {
  const [horarios, setHorarios] = useState<Record<number, HorarioFuncionamentoDia>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHorarios = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('horarios_funcionamento')
        .select('*')
        .order('dia_semana', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      // Converter para formato do hook
      const horariosMap: Record<number, HorarioFuncionamentoDia> = {}

      if (data) {
        data.forEach((horario: HorarioFuncionamentoDB) => {
          if (horario.dia_semana !== null) {
            horariosMap[horario.dia_semana] = {
              horario_inicio: horario.horario_inicio,
              horario_fim: horario.horario_fim,
              intervalo_inicio: horario.intervalo_inicio,
              intervalo_fim: horario.intervalo_fim,
              ativo: horario.ativo,
            }
          }
        })
      }

      setHorarios(horariosMap)
    } catch (err) {
      console.error('Erro ao buscar horários de funcionamento:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [])

  const getHorarioPorDia = useCallback(
    (diaSemana: number): HorarioFuncionamentoDia | null => {
      return horarios[diaSemana] || null
    },
    [horarios]
  )

  useEffect(() => {
    fetchHorarios()
  }, [fetchHorarios])

  return {
    horarios,
    loading,
    error,
    getHorarioPorDia,
    refetch: fetchHorarios,
  }
}
