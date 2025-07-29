// Tipos para o sistema financeiro
export interface MovimentacaoFluxoCaixa {
  id: string
  tipo: 'ENTRADA' | 'SAIDA'
  valor: number
  descricao: string
  categoria: 'OPERACIONAL' | 'INVESTIMENTO' | 'FINANCIAMENTO'
  dataMovimentacao: string
  status: 'REALIZADA' | 'PROJETADA' | 'PENDENTE'
  origem: string
}

export interface FluxoCaixaResumo {
  saldoAtual: number
  entradasDia: number
  saidasDia: number
  saldoProjetado: number
  limiteMinimoAlerta: number
}

export interface DateRange {
  inicio: string
  fim: string
}

export interface TransacaoFinanceira {
  id: string
  tipo: 'RECEITA' | 'DESPESA'
  valor: number
  descricao: string
  data_transacao: string
  agendamento_id?: string
  categoria_id?: string
  status: 'PENDENTE' | 'CONFIRMADA' | 'CANCELADA'
  created_at: string
  updated_at: string
}

export interface CategoriaFinanceira {
  id: string
  nome: string
  tipo: 'RECEITA' | 'DESPESA'
  cor: string
  ativa: boolean
  created_at: string
  updated_at: string
}

export interface ConfiguracaoFinanceira {
  id: string
  chave: string
  valor: string
  descricao?: string
  created_at: string
  updated_at: string
}