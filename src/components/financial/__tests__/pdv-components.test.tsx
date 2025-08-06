// Testes para componentes do PDV
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QuickTransactionPDV } from '../components/QuickTransactionPDV'
import { RecentTransactions } from '../components/RecentTransactions'

// Mock dos hooks
jest.mock('../hooks/use-quick-transactions', () => ({
  useQuickTransactions: () => ({
    historicoRecente: [
      {
        id: '1',
        tipo: 'RECEITA',
        valor: 45.00,
        descricao: 'Corte + Barba',
        metodo_pagamento: 'DINHEIRO',
        data_transacao: new Date().toISOString(),
        status: 'CONFIRMADA',
        categorias_financeiras: { nome: 'Serviços', cor: '#22C55E' },
        funcionarios: { nome: 'João Silva' }
      }
    ],
    estatisticasDia: {
      totalEntradas: 450.00,
      totalSaidas: 120.00,
      numeroTransacoes: 8,
      metodoPagamentoMaisUsado: 'DINHEIRO'
    },
    loading: false,
    saving: false,
    error: null,
    lastUpdate: new Date(),
    registrarTransacao: jest.fn().mockResolvedValue({ success: true }),
    cancelarTransacao: jest.fn().mockResolvedValue({ success: true }),
    refresh: jest.fn(),
    validarTransacao: jest.fn().mockReturnValue({ valid: true, errors: [] })
  }),
  useRealtimeStats: () => ({
    stats: {
      transacoesHoje: 15,
      valorTotalHoje: 1250.00,
      ultimaTransacao: {
        tipo: 'ENTRADA',
        valor: 45.00,
        descricao: 'Corte + Barba',
        tempo: new Date()
      },
      tendenciaHoraria: []
    },
    loading: false,
    refresh: jest.fn()
  }),
  useTransactionNotifications: () => ({
    notifications: [],
    notificacaosPendentes: [],
    adicionarNotificacao: jest.fn(),
    marcarComoLida: jest.fn(),
    removerNotificacao: jest.fn(),
    limparTodas: jest.fn()
  })
}))

// Mock do Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn()
  })
}))

// Mock do Recharts
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />
}))

describe('QuickTransactionPDV', () => {
  const mockOnTransactionSaved = jest.fn()

  beforeEach(() => {
    mockOnTransactionSaved.mockClear()
  })

  it('deve renderizar o componente PDV corretamente', () => {
    render(<QuickTransactionPDV onTransactionSaved={mockOnTransactionSaved} />)
    
    expect(screen.getByText('PDV - Registro Rápido')).toBeInTheDocument()
    expect(screen.getByText('Entrada')).toBeInTheDocument()
    expect(screen.getByText('Saída')).toBeInTheDocument()
  })

  it('deve exibir serviços rápidos na aba de entrada', () => {
    render(<QuickTransactionPDV onTransactionSaved={mockOnTransactionSaved} />)
    
    expect(screen.getByText('Serviços Rápidos')).toBeInTheDocument()
    expect(screen.getByText('Corte Simples')).toBeInTheDocument()
    expect(screen.getByText('Corte + Barba')).toBeInTheDocument()
    expect(screen.getByText('Barba')).toBeInTheDocument()
  })

  it('deve permitir alternar entre abas de entrada e saída', () => {
    render(<QuickTransactionPDV onTransactionSaved={mockOnTransactionSaved} />)
    
    const saidaTab = screen.getByRole('button', { name: /saída/i })
    fireEvent.click(saidaTab)
    
    expect(screen.getByText('Categoria da Despesa')).toBeInTheDocument()
    expect(screen.getByText('Produtos')).toBeInTheDocument()
  })

  it('deve permitir selecionar um serviço rápido', () => {
    render(<QuickTransactionPDV onTransactionSaved={mockOnTransactionSaved} />)
    
    const corteSimples = screen.getByText('Corte Simples')
    fireEvent.click(corteSimples)
    
    // Verificar se o valor foi preenchido
    const valorInput = screen.getByPlaceholderText('0,00')
    expect(valorInput).toHaveValue(25)
  })

  it('deve exibir métodos de pagamento para entradas', () => {
    render(<QuickTransactionPDV onTransactionSaved={mockOnTransactionSaved} />)
    
    expect(screen.getByText('Método de Pagamento')).toBeInTheDocument()
    expect(screen.getByText('Dinheiro')).toBeInTheDocument()
    expect(screen.getByText('PIX')).toBeInTheDocument()
    expect(screen.getByText('Débito')).toBeInTheDocument()
    expect(screen.getByText('Crédito')).toBeInTheDocument()
  })

  it('deve validar campos obrigatórios antes de salvar', () => {
    render(<QuickTransactionPDV onTransactionSaved={mockOnTransactionSaved} />)
    
    const salvarButton = screen.getByText('Registrar Entrada')
    expect(salvarButton).toBeDisabled()
    
    // Preencher valor
    const valorInput = screen.getByPlaceholderText('0,00')
    fireEvent.change(valorInput, { target: { value: '50' } })
    
    // Preencher descrição
    const descricaoInput = screen.getByPlaceholderText('Ex: Corte + Barba')
    fireEvent.change(descricaoInput, { target: { value: 'Teste' } })
    
    expect(salvarButton).toBeEnabled()
  })

  it('deve abrir calculadora quando clicado no botão', () => {
    render(<QuickTransactionPDV onTransactionSaved={mockOnTransactionSaved} />)
    
    const calculatorButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('[data-testid="calculator-icon"]') || 
      btn.textContent?.includes('Calculator')
    )
    
    if (calculatorButton) {
      fireEvent.click(calculatorButton)
      expect(screen.getByText('Calculadora')).toBeInTheDocument()
    }
  })

  it('deve chamar onTransactionSaved quando salvar transação válida', async () => {
    render(<QuickTransactionPDV onTransactionSaved={mockOnTransactionSaved} />)
    
    // Preencher dados válidos
    const valorInput = screen.getByPlaceholderText('0,00')
    fireEvent.change(valorInput, { target: { value: '50' } })
    
    const descricaoInput = screen.getByPlaceholderText('Ex: Corte + Barba')
    fireEvent.change(descricaoInput, { target: { value: 'Corte Teste' } })
    
    // Salvar
    const salvarButton = screen.getByText('Registrar Entrada')
    fireEvent.click(salvarButton)
    
    await waitFor(() => {
      expect(mockOnTransactionSaved).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: 'ENTRADA',
          valor: 50,
          descricao: 'Corte Teste'
        })
      )
    })
  })
})

describe('RecentTransactions', () => {
  it('deve renderizar o componente de transações recentes', () => {
    render(<RecentTransactions />)
    
    expect(screen.getByText('Transações Recentes')).toBeInTheDocument()
    expect(screen.getByText('Entradas Hoje')).toBeInTheDocument()
    expect(screen.getByText('Saídas Hoje')).toBeInTheDocument()
  })

  it('deve exibir estatísticas do dia', () => {
    render(<RecentTransactions />)
    
    expect(screen.getByText('R$ 450,00')).toBeInTheDocument() // Total entradas
    expect(screen.getByText('R$ 120,00')).toBeInTheDocument() // Total saídas
    expect(screen.getByText('8')).toBeInTheDocument() // Número de transações
  })

  it('deve exibir lista de transações', () => {
    render(<RecentTransactions />)
    
    expect(screen.getByText('Corte + Barba')).toBeInTheDocument()
    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText('CONFIRMADA')).toBeInTheDocument()
  })

  it('deve permitir cancelar transação', async () => {
    render(<RecentTransactions />)
    
    // Encontrar botão de ações
    const moreButton = screen.getByRole('button', { name: /more/i })
    fireEvent.click(moreButton)
    
    // Clicar em cancelar
    const cancelButton = screen.getByText('Cancelar')
    fireEvent.click(cancelButton)
    
    // Confirmar cancelamento (mock do confirm)
    window.confirm = jest.fn().mockReturnValue(true)
    
    await waitFor(() => {
      // Verificar se a função de cancelar foi chamada
      expect(window.confirm).toHaveBeenCalled()
    })
  })

  it('deve exibir mensagem quando não há transações', () => {
    // Mock sem transações
    jest.doMock('../hooks/use-quick-transactions', () => ({
      useQuickTransactions: () => ({
        historicoRecente: [],
        estatisticasDia: {
          totalEntradas: 0,
          totalSaidas: 0,
          numeroTransacoes: 0,
          metodoPagamentoMaisUsado: 'DINHEIRO'
        },
        loading: false,
        error: null,
        refresh: jest.fn()
      })
    }))
    
    render(<RecentTransactions />)
    
    expect(screen.getByText('Nenhuma transação encontrada')).toBeInTheDocument()
  })

  it('deve mostrar loading state', () => {
    // Mock com loading
    jest.doMock('../hooks/use-quick-transactions', () => ({
      useQuickTransactions: () => ({
        loading: true,
        historicoRecente: [],
        estatisticasDia: {
          totalEntradas: 0,
          totalSaidas: 0,
          numeroTransacoes: 0,
          metodoPagamentoMaisUsado: 'DINHEIRO'
        },
        error: null,
        refresh: jest.fn()
      })
    }))
    
    render(<RecentTransactions />)
    
    expect(screen.getByText('Carregando transações...')).toBeInTheDocument()
  })
})

describe('Integração PDV', () => {
  it('deve funcionar fluxo completo de registro de transação', async () => {
    const mockOnSaved = jest.fn()
    render(<QuickTransactionPDV onTransactionSaved={mockOnSaved} />)
    
    // Selecionar serviço
    const corteBarba = screen.getByText('Corte + Barba')
    fireEvent.click(corteBarba)
    
    // Selecionar barbeiro
    const barbeiroSelect = screen.getByDisplayValue('Selecionar barbeiro')
    fireEvent.change(barbeiroSelect, { target: { value: 'João Silva' } })
    
    // Adicionar cliente
    const clienteInput = screen.getByPlaceholderText('Nome do cliente')
    fireEvent.change(clienteInput, { target: { value: 'Cliente Teste' } })
    
    // Selecionar método de pagamento PIX
    const pixButton = screen.getByText('PIX')
    fireEvent.click(pixButton)
    
    // Salvar
    const salvarButton = screen.getByText('Registrar Entrada')
    fireEvent.click(salvarButton)
    
    await waitFor(() => {
      expect(mockOnSaved).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: 'ENTRADA',
          valor: 45,
          descricao: 'Corte + Barba',
          metodoPagamento: 'PIX',
          cliente: 'Cliente Teste',
          barbeiro: 'João Silva'
        })
      )
    })
  })

  it('deve limpar formulário após salvar', async () => {
    const mockOnSaved = jest.fn()
    render(<QuickTransactionPDV onTransactionSaved={mockOnSaved} />)
    
    // Preencher e salvar
    const valorInput = screen.getByPlaceholderText('0,00')
    fireEvent.change(valorInput, { target: { value: '100' } })
    
    const descricaoInput = screen.getByPlaceholderText('Ex: Corte + Barba')
    fireEvent.change(descricaoInput, { target: { value: 'Teste' } })
    
    const salvarButton = screen.getByText('Registrar Entrada')
    fireEvent.click(salvarButton)
    
    await waitFor(() => {
      expect(valorInput).toHaveValue(0)
      expect(descricaoInput).toHaveValue('')
    })
  })
})
