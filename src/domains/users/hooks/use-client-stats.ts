/**
 * Hook para estatísticas reais do cliente
 * Remove dados simulados e usa apenas dados do banco
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/api/supabase'
import { useAuth } from '@/domains/auth/hooks/use-auth'

export interface ClientStats {
  totalCortes: number
  valorTotalGasto: number
  pontosFidelidade: number
  frequenciaMedia: number
  servicoFavorito?: string
  barbeiroFavorito?: string
}

export interface ClientStatsData {
  stats: ClientStats
  loading: boolean
  error: string | null
}

export function useClientStats(): ClientStatsData {
  const { profile } = useAuth()
  const [data, setData] = useState<ClientStatsData>({
    stats: {
      totalCortes: 0,
      valorTotalGasto: 0,
      pontosFidelidade: 0,
      frequenciaMedia: 0,
      servicoFavorito: undefined,
      barbeiroFavorito: undefined,
    },
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!profile?.id) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Usuário não autenticado'
      }))
      return
    }

    const fetchClientStats = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }))

        const clienteId = profile.id

        // Buscar todos os agendamentos concluídos do cliente
        const { data: agendamentos, error: agendamentosError } = await supabase
          .from('appointments')
          .select(`
            id,
            data_agendamento,
            preco_final,
            status,
            barbeiro:profiles!appointments_barbeiro_id_fkey(nome),
            services(nome, preco)
          `)
          .eq('cliente_id', clienteId)
          .eq('status', 'concluido')
          .order('data_agendamento', { ascending: true })

        if (agendamentosError) {
          throw agendamentosError
        }

        const agendamentosData = agendamentos || []

        // Calcular estatísticas
        const totalCortes = agendamentosData.length

        const valorTotalGasto = agendamentosData.reduce((sum, apt) => {
          const preco = apt.preco_final || apt.services?.preco || 0
          return sum + preco
        }, 0)

        // Por enquanto, pontos de fidelidade = 1 ponto por real gasto
        const pontosFidelidade = Math.floor(valorTotalGasto)

        // Calcular frequência média (dias entre visitas)
        let frequenciaMedia = 0
        if (agendamentosData.length > 1) {
          const primeiraVisita = new Date(agendamentosData[0].data_agendamento)
          const ultimaVisita = new Date(agendamentosData[agendamentosData.length - 1].data_agendamento)
          const diasEntre = Math.floor((ultimaVisita.getTime() - primeiraVisita.getTime()) / (1000 * 60 * 60 * 24))
          frequenciaMedia = Math.floor(diasEntre / (agendamentosData.length - 1))
        }

        // Encontrar serviço favorito (mais frequente)
        const servicosCount = new Map<string, number>()
        agendamentosData.forEach(apt => {
          const nomeServico = apt.services?.nome
          if (nomeServico) {
            servicosCount.set(nomeServico, (servicosCount.get(nomeServico) || 0) + 1)
          }
        })

        let servicoFavorito: string | undefined
        let maxServicos = 0
        servicosCount.forEach((count, servico) => {
          if (count > maxServicos) {
            maxServicos = count
            servicoFavorito = servico
          }
        })

        // Encontrar barbeiro favorito (mais frequente)
        const barbeirosCount = new Map<string, number>()
        agendamentosData.forEach(apt => {
          const nomeBarbeiro = apt.barbeiro?.nome
          if (nomeBarbeiro) {
            barbeirosCount.set(nomeBarbeiro, (barbeirosCount.get(nomeBarbeiro) || 0) + 1)
          }
        })

        let barbeiroFavorito: string | undefined
        let maxBarbeiros = 0
        barbeirosCount.forEach((count, barbeiro) => {
          if (count > maxBarbeiros) {
            maxBarbeiros = count
            barbeiroFavorito = barbeiro
          }
        })

        setData({
          stats: {
            totalCortes,
            valorTotalGasto,
            pontosFidelidade,
            frequenciaMedia,
            servicoFavorito,
            barbeiroFavorito,
          },
          loading: false,
          error: null,
        })

      } catch (error) {
        console.error('Erro ao buscar estatísticas do cliente:', error)
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Erro ao carregar estatísticas'
        }))
      }
    }

    fetchClientStats()
  }, [profile?.id])

  return data
}