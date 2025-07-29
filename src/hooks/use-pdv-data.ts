// Hook para dados do PDV (Ponto de Venda)
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Servico {
  id: string
  nome: string
  preco: number
  ativo: boolean
  categoria?: string
  duracao?: number
}

interface Barbeiro {
  id: string
  nome: string
  ativo: boolean
  especialidades?: string[]
  comissao_percentual?: number
}

interface PDVStats {
  transacoesHoje: number
  valorTotalHoje: number
  ultimaTransacao: {
    tipo: 'ENTRADA' | 'SAIDA'
    valor: number
    descricao: string
    tempo: Date
  } | null
  tendenciaHoraria: Array<{ hora: number; valor: number }>
}

interface UsePDVDataReturn {
  // Dados
  servicos: Servico[]
  barbeiros: Barbeiro[]
  stats: PDVStats
  
  // Estados
  loading: boolean
  error: string | null
  
  // Ações
  refresh: () => Promise<void>
  refreshServicos: () => Promise<void>
  refreshBarbeiros: () => Promise<void>
  refreshStats: () => Promise<void>
}

export const usePDVData = (): UsePDVDataReturn => {
  // Estados
  const [servicos, setServicos] = useState<Servico[]>([])
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([])
  const [stats, setStats] = useState<PDVStats>({
    transacoesHoje: 0,
    valorTotalHoje: 0,
    ultimaTransacao: null,
    tendenciaHoraria: []
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carregar serviços
  const carregarServicos = useCallback(async () => {
    try {
      // Buscar serviços da tabela services (nome correto)
      const { data, error } = await supabase
        .from('services')
        .select('id, nome, preco, ativo, categoria, duracao_minutos')
        .eq('ativo', true)
        .order('nome')

      if (error) {
        // Se erro de tabela não existe ou conexão, usar fallback
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('connection')) {
          console.warn('Tabela services não existe ou erro de conexão, usando dados de fallback:', error.message)
          setServicos(getServicosFallback())
          return
        }
        
        // Para outros erros, tentar novamente mas usar dados vazios
        console.error('Erro ao carregar serviços:', error)
        setServicos([])
        return
      }

      // Se não há dados, usar array vazio (não fallback)
      if (!data || data.length === 0) {
        console.log('Nenhum serviço cadastrado no sistema')
        setServicos([])
        return
      }

      // Mapear dados para o formato esperado (duracao_minutos -> duracao)
      const servicosFormatados = data.map(servico => ({
        id: servico.id,
        nome: servico.nome,
        preco: servico.preco,
        ativo: servico.ativo,
        categoria: servico.categoria || 'Serviços',
        duracao: servico.duracao_minutos || 30
      }))

      // Dados reais encontrados
      console.log(`${servicosFormatados.length} serviços carregados do banco`)
      setServicos(servicosFormatados)
    } catch (err) {
      console.error('Erro inesperado ao carregar serviços:', err)
      setServicos(getServicosFallback())
    }
  }, [])

  // Carregar barbeiros
  const carregarBarbeiros = useCallback(async () => {
    try {
      // Buscar barbeiros reais da tabela profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, ativo')
        .eq('ativo', true)
        .eq('role', 'barber')
        .order('nome')

      if (error) {
        console.warn('Erro ao carregar barbeiros, usando dados de fallback:', error)
        setBarbeiros(getBarbeirosFallback())
        return
      }

      if (!data || data.length === 0) {
        console.log('Nenhum barbeiro encontrado, usando dados de fallback')
        setBarbeiros(getBarbeirosFallback())
        return
      }

      // Mapear dados para o formato esperado
      const barbeirosFormatados = data.map(barbeiro => ({
        id: barbeiro.id,
        nome: barbeiro.nome,
        ativo: barbeiro.ativo,
        especialidades: [], // Pode ser expandido futuramente
        comissao_percentual: 40 // Valor padrão, pode ser configurável
      }))

      console.log(`${barbeirosFormatados.length} barbeiros carregados do banco`)
      setBarbeiros(barbeirosFormatados)
    } catch (err) {
      console.error('Erro ao carregar barbeiros:', err)
      setBarbeiros(getBarbeirosFallback())
    }
  }, [])

  // Carregar estatísticas em tempo real
  const carregarStats = useCallback(async () => {
    try {
      const hoje = new Date().toISOString().split('T')[0]
      
      // Buscar transações de hoje
      const { data: transacoes, error } = await supabase
        .from('transacoes_financeiras')
        .select('tipo, valor, descricao, data_transacao')
        .gte('data_transacao', `${hoje}T00:00:00`)
        .lte('data_transacao', `${hoje}T23:59:59`)
        .eq('status', 'CONFIRMADA')
        .order('data_transacao', { ascending: false })

      if (error) {
        console.warn('Erro ao carregar estatísticas, usando dados de fallback:', error)
        setStats(getStatsFallback())
        return
      }

      if (!transacoes || transacoes.length === 0) {
        // Se não há transações hoje, mostrar dados zerados (não fallback)
        console.log('Nenhuma transação registrada hoje')
        setStats({
          transacoesHoje: 0,
          valorTotalHoje: 0,
          ultimaTransacao: null,
          tendenciaHoraria: []
        })
        return
      }

      // Calcular estatísticas
      const transacoesHoje = transacoes.length
      const valorTotalHoje = transacoes
        .filter(t => t.tipo === 'RECEITA')
        .reduce((sum, t) => sum + (t.valor || 0), 0)

      const ultimaTransacao = transacoes[0] ? {
        tipo: transacoes[0].tipo === 'RECEITA' ? 'ENTRADA' as const : 'SAIDA' as const,
        valor: transacoes[0].valor,
        descricao: transacoes[0].descricao,
        tempo: new Date(transacoes[0].data_transacao)
      } : null

      // Calcular tendência horária
      const tendenciaHoraria = calcularTendenciaHoraria(transacoes)

      setStats({
        transacoesHoje,
        valorTotalHoje,
        ultimaTransacao,
        tendenciaHoraria
      })

    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err)
      setStats(getStatsFallback())
    }
  }, [])

  // Função para calcular tendência horária
  const calcularTendenciaHoraria = (transacoes: any[]): Array<{ hora: number; valor: number }> => {
    const horasMap = new Map<number, number>()
    
    // Inicializar todas as horas do dia
    for (let hora = 0; hora < 24; hora++) {
      horasMap.set(hora, 0)
    }

    // Agrupar transações por hora
    transacoes
      .filter(t => t.tipo === 'RECEITA')
      .forEach(transacao => {
        const hora = new Date(transacao.data_transacao).getHours()
        const valorAtual = horasMap.get(hora) || 0
        horasMap.set(hora, valorAtual + (transacao.valor || 0))
      })

    // Converter para array e filtrar apenas horas com movimento
    return Array.from(horasMap.entries())
      .map(([hora, valor]) => ({ hora, valor }))
      .filter(item => item.valor > 0)
      .sort((a, b) => a.hora - b.hora)
  }

  // Refresh individual de serviços
  const refreshServicos = useCallback(async () => {
    await carregarServicos()
  }, [carregarServicos])

  // Refresh individual de barbeiros
  const refreshBarbeiros = useCallback(async () => {
    await carregarBarbeiros()
  }, [carregarBarbeiros])

  // Refresh individual de estatísticas
  const refreshStats = useCallback(async () => {
    await carregarStats()
  }, [carregarStats])

  // Refresh completo
  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      await Promise.all([
        carregarServicos(),
        carregarBarbeiros(),
        carregarStats()
      ])
    } catch (err) {
      setError('Erro ao carregar dados do PDV')
      console.error('Erro no refresh completo:', err)
    } finally {
      setLoading(false)
    }
  }, [carregarServicos, carregarBarbeiros, carregarStats])

  // Carregar dados iniciais
  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    // Dados
    servicos,
    barbeiros,
    stats,
    
    // Estados
    loading,
    error,
    
    // Ações
    refresh,
    refreshServicos,
    refreshBarbeiros,
    refreshStats
  }
}

// Dados de fallback para serviços
function getServicosFallback(): Servico[] {
  return [
    { id: '1', nome: 'Corte Simples', preco: 25.00, ativo: true, categoria: 'Cortes', duracao: 30 },
    { id: '2', nome: 'Corte + Barba', preco: 45.00, ativo: true, categoria: 'Combos', duracao: 60 },
    { id: '3', nome: 'Barba', preco: 20.00, ativo: true, categoria: 'Barba', duracao: 30 },
    { id: '4', nome: 'Sobrancelha', preco: 15.00, ativo: true, categoria: 'Estética', duracao: 15 },
    { id: '5', nome: 'Corte + Barba + Sobrancelha', preco: 55.00, ativo: true, categoria: 'Combos', duracao: 75 },
    { id: '6', nome: 'Hidratação', preco: 30.00, ativo: true, categoria: 'Tratamentos', duracao: 45 }
  ]
}

// Dados de fallback para barbeiros
function getBarbeirosFallback(): Barbeiro[] {
  return [
    { 
      id: '1', 
      nome: 'João Silva', 
      ativo: true, 
      especialidades: ['Cortes Clássicos', 'Barba'], 
      comissao_percentual: 40 
    },
    { 
      id: '2', 
      nome: 'Pedro Santos', 
      ativo: true, 
      especialidades: ['Cortes Modernos', 'Degradê'], 
      comissao_percentual: 45 
    },
    { 
      id: '3', 
      nome: 'Carlos Oliveira', 
      ativo: true, 
      especialidades: ['Barba', 'Sobrancelha'], 
      comissao_percentual: 40 
    },
    { 
      id: '4', 
      nome: 'Rafael Costa', 
      ativo: true, 
      especialidades: ['Cortes Infantis', 'Tratamentos'], 
      comissao_percentual: 35 
    }
  ]
}

// Dados de fallback para estatísticas
function getStatsFallback(): PDVStats {
  const agora = new Date()
  
  return {
    transacoesHoje: 12,
    valorTotalHoje: 580.00,
    ultimaTransacao: {
      tipo: 'ENTRADA',
      valor: 45.00,
      descricao: 'Corte + Barba',
      tempo: new Date(agora.getTime() - 15 * 60 * 1000) // 15 min atrás
    },
    tendenciaHoraria: [
      { hora: 8, valor: 50 },
      { hora: 9, valor: 120 },
      { hora: 10, valor: 180 },
      { hora: 11, valor: 95 },
      { hora: 12, valor: 60 },
      { hora: 13, valor: 30 },
      { hora: 14, valor: 45 }
    ]
  }
}

// Hook específico para estatísticas em tempo real (compatibilidade)
export const useRealtimeStats = () => {
  const { stats, loading, refreshStats } = usePDVData()
  
  return {
    stats,
    loading,
    refresh: refreshStats
  }
}